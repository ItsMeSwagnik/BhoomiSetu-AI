"""Validation engine: rule-based, cross-record, entity-matching, GIS spatial."""
import re
from dataclasses import dataclass
from typing import Optional
from sqlalchemy.orm import Session
from app.models import LandRecord, ValidationResult, ValidationType, Parcel, RecordStatus
from app.config import settings


@dataclass
class ValidationOutput:
    validation_type: str
    status: str  # pass, warning, fail
    message: str


def run_rule_validation(record: LandRecord) -> list[ValidationOutput]:
    results = []

    # Required fields
    for field in ("owner", "village", "district"):
        if not getattr(record, field):
            results.append(ValidationOutput("rule", "fail", f"Missing required field: {field}"))

    # Area must be positive
    if record.area is not None and record.area <= 0:
        results.append(ValidationOutput("rule", "fail", "Area must be a positive number"))

    # Ownership share
    if record.owner_share is not None:
        if not (0 < record.owner_share <= 100):
            results.append(ValidationOutput("rule", "fail", f"Invalid ownership share: {record.owner_share}%"))

    # Co-owner share consistency: owner_share + co_owner implied share should not exceed 100%
    # We flag if owner_share alone > 100 (already caught above) or if it's suspiciously low with a co-owner
    if record.owner_share and record.co_owner and record.owner_share == 100:
        results.append(ValidationOutput(
            "rule", "warning",
            f"Owner share is 100% but co-owner '{record.co_owner}' is listed — possible data entry error"
        ))

    # Date format check
    date_pattern = re.compile(r"\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}")
    for date_field in ("mutation_date", "registration_date"):
        val = getattr(record, date_field)
        if val and not date_pattern.match(val):
            results.append(ValidationOutput("rule", "warning", f"Unusual date format in {date_field}: {val}"))

    # Impossible area (> 10,000 acres is suspicious for a single parcel)
    if record.area is not None and record.area > 10000:
        results.append(ValidationOutput("rule", "warning", f"Suspiciously large area: {record.area} {record.area_unit}"))

    if not results:
        results.append(ValidationOutput("rule", "pass", "All rule checks passed"))

    return results


def run_cross_record_validation(record: LandRecord, db: Session) -> list[ValidationOutput]:
    results = []
    if not record.plot_number or not record.village:
        return results

    prior = (
        db.query(LandRecord)
        .filter(
            LandRecord.plot_number == record.plot_number,
            LandRecord.village == record.village,
            LandRecord.id != record.id,
            LandRecord.status == RecordStatus.verified,
        )
        .order_by(LandRecord.created_at.desc())
        .first()
    )

    if prior:
        if prior.owner and record.previous_owner and prior.owner != record.previous_owner:
            results.append(ValidationOutput(
                "cross_record", "warning",
                f"Previous owner mismatch: record says '{record.previous_owner}', last verified owner was '{prior.owner}'"
            ))
        else:
            results.append(ValidationOutput("cross_record", "pass", "Ownership chain consistent with prior record"))
    return results


def run_entity_matching(record: LandRecord, db: Session) -> list[ValidationOutput]:
    results = []
    if not record.owner:
        return results
    try:
        from rapidfuzz import fuzz
        existing_owners = db.query(LandRecord.owner).filter(
            LandRecord.id != record.id,
            LandRecord.owner.isnot(None),
        ).distinct().limit(200).all()

        for (owner,) in existing_owners:
            if owner and owner != record.owner:
                score = fuzz.token_sort_ratio(record.owner, owner)
                if 80 <= score < 100:
                    results.append(ValidationOutput(
                        "entity_match", "warning",
                        f"Possible duplicate entity: '{record.owner}' ≈ '{owner}' (similarity {score}%). Human confirmation required."
                    ))
                    break
    except ImportError:
        pass
    return results


def run_gis_validation(record: LandRecord, db: Session) -> list[ValidationOutput]:
    results = []
    if not record.parcel_id or record.area is None:
        return results

    parcel = db.query(Parcel).filter(Parcel.id == record.parcel_id).first()
    if not parcel or not parcel.calculated_area:
        return results

    # If parcel has no calculated_area yet, try to compute it from WKT
    if not parcel.calculated_area and parcel.geometry_wkt:
        try:
            from app.services.gis import wkt_to_area_acres
            computed = wkt_to_area_acres(parcel.geometry_wkt)
            if computed:
                parcel.calculated_area = computed
                db.commit()
        except Exception:
            pass

    if not parcel.calculated_area:
        return results

    diff_pct = abs(record.area - parcel.calculated_area) / parcel.calculated_area * 100

    if diff_pct > settings.gis_area_tolerance_percent:
        results.append(ValidationOutput(
            "gis_spatial", "fail",
            f"Area mismatch: record={record.area} ac, GIS={parcel.calculated_area:.2f} ac, diff={diff_pct:.1f}% (tolerance {settings.gis_area_tolerance_percent}%)"
        ))
    else:
        results.append(ValidationOutput(
            "gis_spatial", "pass",
            f"Area within tolerance: record={record.area} ac, GIS={parcel.calculated_area:.2f} ac, diff={diff_pct:.1f}%"
        ))

    # Also validate the geometry itself
    if parcel.geometry_wkt:
        try:
            from app.services.gis import validate_geometry
            geo_result = validate_geometry(parcel.geometry_wkt)
            for issue in geo_result.get("issues", []):
                results.append(ValidationOutput(
                    "gis_spatial", "warning",
                    f"Geometry issue on linked parcel {parcel.parcel_code}: {issue['detail']}"
                ))
        except Exception:
            pass

    return results


def compute_confidence_score(
    ocr_confidence: float,
    extracted_fields: list,
    validation_outputs: list[ValidationOutput],
) -> float:
    field_conf = sum(f.confidence for f in extracted_fields) / len(extracted_fields) if extracted_fields else 0.5
    fail_count = sum(1 for v in validation_outputs if v.status == "fail")
    warn_count = sum(1 for v in validation_outputs if v.status == "warning")
    penalty = fail_count * 0.15 + warn_count * 0.05
    score = (ocr_confidence * 0.4 + field_conf * 0.4 + 0.2) - penalty
    return max(0.0, min(1.0, score))


def run_all_validations(record: LandRecord, db: Session) -> list[ValidationOutput]:
    results = []
    results.extend(run_rule_validation(record))
    results.extend(run_cross_record_validation(record, db))
    results.extend(run_entity_matching(record, db))
    results.extend(run_gis_validation(record, db))
    return results
