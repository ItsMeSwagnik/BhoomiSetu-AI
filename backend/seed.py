"""Seed demo data: users, parcels, documents, land records, audit logs, notifications."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import datetime, timedelta
import uuid
from app.database import SessionLocal, create_tables
from app.models import (
    User, UserRole, UserStatus, Document, DocumentType, DocumentStatus,
    LandRecord, RecordStatus, ExtractedField, ValidationResult, ValidationType,
    Parcel, AuditLog, Notification, Submission, SubmissionStatus, SystemSetting, SystemLog
)

DEMO_USERS = [
    {"name": "BhoomiSetu Root Admin", "email": "sysadmin@bhoomisetu.gov.in", "role": UserRole.admin, "firebase_uid": "demo_admin_001"},
    {"name": "Vikramaditya Sen", "email": "officer.tehsildar@lrms.gov.in", "role": UserRole.approving_officer, "firebase_uid": "demo_officer_001"},
    {"name": "Pooja Sharma", "email": "cadastral.verifier@lrms.gov.in", "role": UserRole.verifier, "firebase_uid": "demo_verifier_001"},
    {"name": "Meenakshi Iyer", "email": "vigilance.auditor@cag.gov.in", "role": UserRole.auditor, "firebase_uid": "demo_auditor_001"},
    {"name": "Anil Verma", "email": "data.operator@lrms.gov.in", "role": UserRole.data_operator, "firebase_uid": "demo_operator_001"},
    {"name": "Rajesh Kumar", "email": "citizen.rajesh@gmail.com", "role": UserRole.citizen, "firebase_uid": "demo_citizen_001"},
]

SAMPLE_PARCELS = [
    {"parcel_code": "P100", "plot_number": "100", "village": "Rampur", "district": "Gaya", "calculated_area": 1.84,
     "geometry_wkt": "POLYGON((85.0 24.7, 85.01 24.7, 85.01 24.71, 85.0 24.71, 85.0 24.7))"},
    {"parcel_code": "P101", "plot_number": "101", "village": "Rampur", "district": "Gaya", "calculated_area": 3.12,
     "geometry_wkt": "POLYGON((85.01 24.7, 85.02 24.7, 85.02 24.71, 85.01 24.71, 85.01 24.7))"},
    {"parcel_code": "P102", "plot_number": "102", "village": "Rampur", "district": "Gaya", "calculated_area": 2.58,
     "geometry_wkt": "POLYGON((85.0 24.71, 85.01 24.71, 85.01 24.72, 85.0 24.72, 85.0 24.71))"},
    {"parcel_code": "P103", "plot_number": "103", "village": "Rampur", "district": "Gaya", "calculated_area": 1.39,
     "geometry_wkt": "POLYGON((85.01 24.71, 85.02 24.71, 85.02 24.72, 85.01 24.72, 85.01 24.71))"},
    {"parcel_code": "P201", "plot_number": "201", "village": "Sitapur", "district": "Patna", "calculated_area": 2.10,
     "geometry_wkt": "POLYGON((85.1 25.6, 85.11 25.6, 85.11 25.61, 85.1 25.61, 85.1 25.6))"},
    {"parcel_code": "P202", "plot_number": "202", "village": "Sitapur", "district": "Patna", "calculated_area": 1.75,
     "geometry_wkt": "POLYGON((85.11 25.6, 85.12 25.6, 85.12 25.61, 85.11 25.61, 85.11 25.6))"},
    {"parcel_code": "P301", "plot_number": "301", "village": "Nadia", "district": "Nadia", "calculated_area": 0.95,
     "geometry_wkt": "POLYGON((88.5 23.4, 88.51 23.4, 88.51 23.41, 88.5 23.41, 88.5 23.4))"},
    {"parcel_code": "P302", "plot_number": "302", "village": "Nadia", "district": "Nadia", "calculated_area": 1.20,
     "geometry_wkt": "POLYGON((88.51 23.4, 88.52 23.4, 88.52 23.41, 88.51 23.41, 88.51 23.4))"},
]


def seed():
    create_tables()
    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(User).count() > 0:
            print("Database already seeded. Skipping.")
            return

        # Users
        user_map = {}
        for u in DEMO_USERS:
            user = User(
                firebase_uid=u["firebase_uid"],
                name=u["name"],
                email=u["email"],
                role=u["role"],
                status=UserStatus.active,
            )
            db.add(user)
            db.flush()
            user_map[u["role"].value] = user

        # Try to create Firebase users
        try:
            from app.auth import get_firebase_app
            app = get_firebase_app()
            if app:
                from firebase_admin import auth
                for u in DEMO_USERS:
                    try:
                        fb_user = auth.create_user(email=u["email"], password="BhoomiSetu@2026", display_name=u["name"], app=app)
                        auth.set_custom_user_claims(fb_user.uid, {"role": u["role"].value}, app=app)
                        # Update firebase_uid in DB
                        db_user = db.query(User).filter(User.email == u["email"]).first()
                        if db_user:
                            db_user.firebase_uid = fb_user.uid
                    except Exception as e:
                        print(f"Firebase user creation skipped for {u['email']}: {e}")
        except Exception as e:
            print(f"Firebase Admin SDK not available: {e}")

        # Parcels
        parcel_map = {}
        for p in SAMPLE_PARCELS:
            parcel = Parcel(**p)
            db.add(parcel)
            db.flush()
            parcel_map[p["parcel_code"]] = parcel

        operator = user_map.get("data_operator")
        officer = user_map.get("approving_officer")
        verifier = user_map.get("verifier")
        citizen = user_map.get("citizen")

        # Sample documents + land records
        samples = [
            {
                "filename": "Khatiyan_Register_1042.pdf", "doc_type": DocumentType.khatian,
                "village": "Rampur", "district": "Gaya", "doc_status": DocumentStatus.extracted,
                "record": {
                    "owner": "Rajesh Kumar", "plot_number": "102", "khatian_number": "1042",
                    "area": 2.45, "area_unit": "acre", "village": "Rampur", "district": "Gaya",
                    "land_classification": "Agricultural", "previous_owner": "Ramesh Kumar",
                    "mutation_number": "MUT-2020-019", "mutation_date": "15/03/2020",
                    "confidence_score": 0.63, "status": RecordStatus.flagged,
                    "parcel_code": "P102",
                },
            },
            {
                "filename": "Mutation_Order_19_2020.pdf", "doc_type": DocumentType.mutation_record,
                "village": "Rampur", "district": "Gaya", "doc_status": DocumentStatus.extracted,
                "record": {
                    "owner": "Maheshwar Prasad", "plot_number": "100", "khatian_number": "1001",
                    "area": 1.84, "area_unit": "acre", "village": "Rampur", "district": "Gaya",
                    "land_classification": "Agricultural",
                    "confidence_score": 0.94, "status": RecordStatus.verified,
                    "parcel_code": "P100",
                },
            },
            {
                "filename": "Sale_Deed_482.pdf", "doc_type": DocumentType.registration_record,
                "village": "Sitapur", "district": "Patna", "doc_status": DocumentStatus.extracted,
                "record": {
                    "owner": "Sunita Sharma", "plot_number": "201", "khatian_number": "2010",
                    "area": 2.10, "area_unit": "acre", "village": "Sitapur", "district": "Patna",
                    "land_classification": "Residential",
                    "confidence_score": 0.88, "status": RecordStatus.pending_approval,
                    "parcel_code": "P201",
                },
            },
            {
                "filename": "RoR_Register_0991.pdf", "doc_type": DocumentType.ror,
                "village": "Nadia", "district": "Nadia", "doc_status": DocumentStatus.extracted,
                "record": {
                    "owner": "Kusum Devi", "plot_number": "301", "khatian_number": "3001",
                    "area": 0.95, "area_unit": "acre", "village": "Nadia", "district": "Nadia",
                    "land_classification": "Agricultural",
                    "confidence_score": 0.97, "status": RecordStatus.verified,
                    "parcel_code": "P301",
                },
            },
            {
                "filename": "Khatiyan_Savitri_Devi.pdf", "doc_type": DocumentType.khatian,
                "village": "Patna", "district": "Patna", "doc_status": DocumentStatus.extracted,
                "record": {
                    "owner": "Savitri Devi", "co_owner": "Ramphal Yadav", "owner_share": 60.0,
                    "plot_number": "205", "khatian_number": "2055",
                    "area": 1.20, "area_unit": "acre", "village": "Sitapur", "district": "Patna",
                    "land_classification": "Residential",
                    "confidence_score": 0.55, "status": RecordStatus.flagged,
                    "parcel_code": "P202",
                },
            },
        ]

        for s in samples:
            doc = Document(
                uploaded_by=operator.id,
                file_path=f"documents/sample_{s['filename']}",
                original_filename=s["filename"],
                file_type="pdf",
                document_type=s["doc_type"],
                status=s["doc_status"],
                village=s["village"],
                district=s["district"],
                uploaded_at=datetime.utcnow() - timedelta(days=3),
                processed_at=datetime.utcnow() - timedelta(days=2),
            )
            db.add(doc)
            db.flush()

            rec_data = s["record"]
            parcel = parcel_map.get(rec_data.pop("parcel_code", None))
            record = LandRecord(
                document_id=doc.id,
                parcel_id=parcel.id if parcel else None,
                **rec_data,
            )
            db.add(record)
            db.flush()

            # Sample extracted fields
            for fname, fval, conf, label in [
                ("owner", record.owner, 0.95, "Owner Name"),
                ("plot_number", record.plot_number, 0.98, "Plot No."),
                ("village", record.village, 0.96, "Village"),
                ("area", str(record.area), record.confidence_score or 0.7, "Area"),
            ]:
                if fval:
                    db.add(ExtractedField(
                        record_id=record.id,
                        field_name=fname,
                        extracted_value=fval,
                        original_label=label,
                        confidence=conf,
                        bbox=[50, 100, 300, 20],
                        page_number=1,
                    ))

            # Validation results
            if record.status == RecordStatus.flagged:
                db.add(ValidationResult(
                    record_id=record.id,
                    validation_type=ValidationType.gis_spatial,
                    status="fail",
                    message=f"Area mismatch: record={record.area} ac, GIS={parcel.calculated_area if parcel else '?'} ac",
                ))
            db.add(ValidationResult(
                record_id=record.id,
                validation_type=ValidationType.rule,
                status="pass",
                message="All required fields present",
            ))

        db.flush()

        # Audit log entries
        records_all = db.query(LandRecord).all()
        for i, rec in enumerate(records_all[:3]):
            db.add(AuditLog(
                record_id=rec.id,
                user_id=officer.id,
                action="field_corrected",
                field_changed="area",
                old_value="2.45",
                new_value="2.58",
                reason="OCR correction after GIS comparison",
                timestamp=datetime.utcnow() - timedelta(hours=i + 1),
            ))

        # Notifications
        db.add(Notification(
            user_id=verifier.id,
            message="New flagged record requires verification: Rajesh Kumar — Rampur",
            type="verification_required",
            is_read=False,
        ))
        db.add(Notification(
            user_id=officer.id,
            message="Record verified and ready for approval: Sunita Sharma — Sitapur",
            type="approval_required",
            is_read=False,
        ))
        db.add(Notification(
            user_id=citizen.id,
            message="Your mutation request MUT-2024-001 is under review",
            type="submission_update",
            is_read=False,
        ))

        # Citizen submission
        db.add(Submission(
            citizen_id=citizen.id,
            request_type="Mutation",
            parcel_reference="P102",
            status=SubmissionStatus.in_verification,
        ))

        # System logs
        for event, msg, level in [
            ("startup", "BhoomiSetu backend started", "info"),
            ("ocr_pipeline", "MockOCREngine processed 5 documents", "info"),
            ("validation", "GIS spatial validation completed for Rampur parcels", "info"),
            ("auth", "Demo users seeded via Firebase Admin SDK", "info"),
        ]:
            db.add(SystemLog(event_type=event, message=msg, level=level))

        # System settings
        for key, value in [
            ("confidence_threshold", 0.85),
            ("gis_area_tolerance_percent", 10.0),
            ("ocr_confidence_threshold", 0.75),
            ("session_timeout_minutes", 30),
            ("max_upload_size_mb", 50),
            ("lrms_api_url", "https://api.lrms.gov.in/v2"),
            ("supported_languages", ["en", "hi", "bn"]),
            ("org_name", "BhoomiSetu AI"),
        ]:
            db.add(SystemSetting(key=key, value=value))

        db.commit()
        print("[OK] Seed complete. Demo credentials: BhoomiSetu@2026")
        for u in DEMO_USERS:
            print(f"  {u['role'].value:20s} -> {u['email']}")

    except Exception as e:
        db.rollback()
        print(f"[FAIL] Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
