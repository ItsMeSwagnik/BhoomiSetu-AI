"""Celery tasks for the document processing pipeline."""
import uuid
from datetime import datetime
from app.celery_app import celery_app
from app.config import settings


@celery_app.task(bind=True, max_retries=2, default_retry_delay=10)
def process_document(self, document_id: str):
    from app.database import SessionLocal
    from app.models import Document, DocumentStatus, OCRResult, LandRecord, ExtractedField,\
        ValidationResult, RecordStatus, Parcel, Notification, User, UserRole
    from app.services.ocr import get_ocr_engine, MockOCREngine
    from app.services.extraction import extract_fields
    from app.services.validation import run_all_validations, compute_confidence_score

    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return

        doc.status = DocumentStatus.processing
        db.commit()

        import os
        raw_path = os.path.join(settings.storage_local_path, doc.file_path)

        # Step 1: Preprocessing (deskew, denoise, contrast, binarize)
        try:
            from app.services.preprocessing import preprocess_image
            file_path = preprocess_image(raw_path)
        except Exception:
            file_path = raw_path

        # Step 2: OCR
        engine = get_ocr_engine(settings.ocr_engine)
        try:
            ocr_results = engine.extract(file_path)
        except Exception:
            ocr_results = MockOCREngine().extract("")  # fallback to mock

        for r in ocr_results:
            db.add(OCRResult(
                document_id=doc.id,
                page_number=r.page_number,
                raw_text=r.text,
                confidence=r.confidence,
                bbox=r.bbox,
                language=r.language,
                text_type=r.text_type,
            ))
        db.commit()

        # Step 3: Field extraction
        extracted = extract_fields(ocr_results)

        # Step 4: Build LandRecord from extracted fields
        field_map = {f.field_name: f for f in extracted}

        def fval(name):
            f = field_map.get(name)
            return f.extracted_value if f else None

        area_str = fval("area")
        area_val = None
        if area_str:
            import re
            m = re.search(r"[\d.]+", area_str)
            if m:
                try:
                    area_val = float(m.group())
                except ValueError:
                    pass

        record = LandRecord(
            document_id=doc.id,
            owner=fval("owner"),
            co_owner=fval("co_owner"),
            khatian_number=fval("khatian_number"),
            khasra_number=fval("khasra_number"),
            plot_number=fval("plot_number"),
            survey_number=fval("survey_number"),
            area=area_val,
            area_unit="acre",
            village=fval("village") or doc.village,
            district=fval("district") or doc.district,
            land_classification=fval("land_classification"),
            mutation_number=fval("mutation_number"),
            mutation_date=fval("mutation_date"),
            registration_number=fval("registration_number"),
            registration_date=fval("registration_date"),
            previous_owner=fval("previous_owner"),
            status=RecordStatus.pending,
        )
        db.add(record)
        db.flush()

        for f in extracted:
            db.add(ExtractedField(
                record_id=record.id,
                field_name=f.field_name,
                extracted_value=f.extracted_value,
                original_label=f.original_label,
                confidence=f.confidence,
                bbox=f.bbox,
                page_number=f.page_number,
            ))

        # Step 5: Try to link parcel
        if record.plot_number and record.village:
            parcel = db.query(Parcel).filter(
                Parcel.plot_number == record.plot_number,
                Parcel.village == record.village,
            ).first()
            if parcel:
                record.parcel_id = parcel.id

        db.flush()

        # Step 6: Validation
        validation_outputs = run_all_validations(record, db)
        for v in validation_outputs:
            db.add(ValidationResult(
                record_id=record.id,
                validation_type=v.validation_type,
                status=v.status,
                message=v.message,
            ))

        # Step 7: Confidence score
        avg_ocr_conf = sum(r.confidence for r in ocr_results) / len(ocr_results) if ocr_results else 0.5
        score = compute_confidence_score(avg_ocr_conf, extracted, validation_outputs)
        record.confidence_score = score

        has_fail = any(v.status == "fail" for v in validation_outputs)
        if has_fail or score < settings.confidence_threshold:
            record.status = RecordStatus.flagged
            verifiers = db.query(User).filter(User.role == UserRole.verifier).all()
            for v in verifiers:
                db.add(Notification(
                    user_id=v.id,
                    message=f"New flagged record requires verification: {record.owner or 'Unknown'} — {record.village or 'Unknown'}",
                    type="verification_required",
                ))
        else:
            record.status = RecordStatus.pending_approval
            officers = db.query(User).filter(User.role == UserRole.approving_officer).all()
            for o in officers:
                db.add(Notification(
                    user_id=o.id,
                    message=f"Record ready for approval: {record.owner or 'Unknown'} — {record.village or 'Unknown'}",
                    type="approval_required",
                ))

        doc.status = DocumentStatus.extracted
        doc.processed_at = datetime.utcnow()
        db.commit()

    except Exception as exc:
        db.rollback()
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = DocumentStatus.failed
            doc.error_message = str(exc)
            db.commit()
        raise self.retry(exc=exc)
    finally:
        db.close()
