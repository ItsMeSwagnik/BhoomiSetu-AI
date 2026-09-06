from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Parcel, LandRecord, User, UserRole, ParcelHistory
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/parcels", tags=["parcels"])


class ParcelCreate(BaseModel):
    parcelCode: str
    plotNumber: str
    village: str
    district: str
    geometryWkt: Optional[str] = None
    calculatedArea: Optional[float] = None


@router.post("", status_code=201)
async def create_parcel(
    body: ParcelCreate,
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.data_operator])),
    db: Session = Depends(get_db),
):
    existing = db.query(Parcel).filter(Parcel.parcel_code == body.parcelCode).first()
    if existing:
        raise HTTPException(status_code=409, detail="Parcel code already exists")

    # Auto-compute area from WKT using GeoPandas if not provided
    calculated_area = body.calculatedArea
    if not calculated_area and body.geometryWkt:
        try:
            from app.services.gis import wkt_to_area_acres
            calculated_area = wkt_to_area_acres(body.geometryWkt)
        except Exception:
            pass

    parcel = Parcel(
        parcel_code=body.parcelCode,
        plot_number=body.plotNumber,
        village=body.village,
        district=body.district,
        geometry_wkt=body.geometryWkt,
        calculated_area=calculated_area,
    )
    db.add(parcel)
    db.commit()
    db.refresh(parcel)
    return _parcel_out(parcel)


@router.get("")
async def list_parcels(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parcels = db.query(Parcel).limit(100).all()
    return [_parcel_out(p) for p in parcels]


@router.get("/search")
async def search_parcels(
    village: str = None,
    plot_number: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Parcel)
    if village:
        q = q.filter(Parcel.village.ilike(f"%{village}%"))
    if plot_number:
        q = q.filter(Parcel.plot_number == plot_number)
    return [_parcel_out(p) for p in q.limit(50).all()]


@router.get("/topology/overlaps")
async def detect_overlaps(
    district: Optional[str] = None,
    current_user: User = Depends(require_roles([
        UserRole.verifier, UserRole.approving_officer, UserRole.admin, UserRole.auditor
    ])),
    db: Session = Depends(get_db),
):
    """Detect overlapping parcel geometries using Shapely (step 17)."""
    try:
        from shapely import wkt as shapely_wkt
    except ImportError:
        raise HTTPException(status_code=501, detail="Shapely not installed")

    q = db.query(Parcel).filter(Parcel.geometry_wkt.isnot(None))
    if district:
        q = q.filter(Parcel.district == district)
    parcels = q.limit(200).all()

    geoms = []
    for p in parcels:
        try:
            geoms.append((p, shapely_wkt.loads(p.geometry_wkt)))
        except Exception:
            pass

    overlaps = []
    for i in range(len(geoms)):
        for j in range(i + 1, len(geoms)):
            pa, ga = geoms[i]
            pb, gb = geoms[j]
            if ga.intersects(gb) and not ga.touches(gb):
                intersection = ga.intersection(gb)
                if intersection.area > 0:
                    overlaps.append({
                        "parcelA": pa.parcel_code,
                        "parcelB": pb.parcel_code,
                        "overlapAreaSqDeg": round(intersection.area, 8),
                        "severity": "high" if intersection.area / min(ga.area, gb.area) > 0.1 else "low",
                    })
    return {"overlapsDetected": len(overlaps), "overlaps": overlaps}


@router.get("/{parcel_id}")
async def get_parcel(
    parcel_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return _parcel_out(parcel)


@router.get("/{parcel_id}/records")
async def get_parcel_records(
    parcel_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all land records linked to a parcel, ordered by creation date (historical timeline)."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    records = (
        db.query(LandRecord)
        .filter(LandRecord.parcel_id == parcel.id)
        .order_by(LandRecord.created_at.asc())
        .all()
    )
    return {
        "parcel": _parcel_out(parcel),
        "timeline": [
            {
                "id": str(r.id),
                "owner": r.owner,
                "coOwner": r.co_owner,
                "ownerShare": r.owner_share,
                "area": r.area,
                "areaUnit": r.area_unit,
                "mutationNumber": r.mutation_number,
                "mutationDate": r.mutation_date,
                "registrationNumber": r.registration_number,
                "registrationDate": r.registration_date,
                "previousOwner": r.previous_owner,
                "status": r.status.value if r.status else None,
                "confidenceScore": r.confidence_score,
                "createdAt": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ],
    }


@router.get("/{parcel_id}/change-detection")
async def parcel_change_detection(
    parcel_id: str,
    current_user: User = Depends(require_roles([
        UserRole.verifier, UserRole.approving_officer, UserRole.admin, UserRole.auditor
    ])),
    db: Session = Depends(get_db),
):
    """Compare current parcel geometry against historical snapshots (step 18)."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    history = (
        db.query(ParcelHistory)
        .filter(ParcelHistory.parcel_id == parcel.id)
        .order_by(ParcelHistory.recorded_at.asc())
        .all()
    )
    if not history:
        return {"parcel": _parcel_out(parcel), "changes": [], "message": "No historical geometry available"}

    changes = []
    try:
        from shapely import wkt as shapely_wkt
        current_geom = shapely_wkt.loads(parcel.geometry_wkt) if parcel.geometry_wkt else None

        for snap in history:
            try:
                hist_geom = shapely_wkt.loads(snap.geometry_wkt)
            except Exception:
                continue

            area_change_pct = None
            boundary_changed = False
            intersection_ratio = None

            if current_geom and snap.calculated_area:
                area_change_pct = round(
                    (parcel.calculated_area - snap.calculated_area) / snap.calculated_area * 100, 2
                ) if snap.calculated_area else None

            if current_geom:
                boundary_changed = not current_geom.equals(hist_geom)
                if hist_geom.area > 0:
                    intersection = current_geom.intersection(hist_geom)
                    intersection_ratio = round(intersection.area / hist_geom.area, 4)

            changes.append({
                "snapshotId": str(snap.id),
                "recordedAt": snap.recorded_at.isoformat() if snap.recorded_at else None,
                "historicalArea": snap.calculated_area,
                "currentArea": parcel.calculated_area,
                "areaChangePct": area_change_pct,
                "boundaryChanged": boundary_changed,
                "intersectionRatio": intersection_ratio,
                "notes": snap.notes,
                "severity": (
                    "high" if area_change_pct and abs(area_change_pct) > 20
                    else "medium" if area_change_pct and abs(area_change_pct) > 5
                    else "low"
                ),
            })
    except ImportError:
        return {"parcel": _parcel_out(parcel), "changes": [], "message": "Shapely not installed"}

    return {"parcel": _parcel_out(parcel), "changes": changes}


@router.post("/{parcel_id}/history", status_code=201)
async def record_parcel_snapshot(
    parcel_id: str,
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.verifier])),
    db: Session = Depends(get_db),
):
    """Snapshot the current geometry into parcel history before updating."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    if not parcel.geometry_wkt:
        raise HTTPException(status_code=400, detail="Parcel has no geometry to snapshot")
    snap = ParcelHistory(
        parcel_id=parcel.id,
        geometry_wkt=parcel.geometry_wkt,
        calculated_area=parcel.calculated_area,
    )
    db.add(snap)
    db.commit()
    db.refresh(snap)
    return {"message": "Snapshot recorded", "snapshotId": str(snap.id)}


@router.get("/{parcel_id}/spatial-validation")
async def spatial_validation(
    parcel_id: str,
    current_user: User = Depends(require_roles([
        UserRole.verifier, UserRole.approving_officer, UserRole.admin, UserRole.auditor
    ])),
    db: Session = Depends(get_db),
):
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    records = db.query(LandRecord).filter(LandRecord.parcel_id == parcel.id).all()
    from app.config import settings
    results = []
    for r in records:
        if r.area and parcel.calculated_area:
            diff = abs(r.area - parcel.calculated_area) / parcel.calculated_area * 100
            results.append({
                "recordId": str(r.id),
                "recordArea": r.area,
                "gisArea": parcel.calculated_area,
                "diffPercent": round(diff, 2),
                "withinTolerance": diff <= settings.gis_area_tolerance_percent,
            })

    # Geometry validation using Shapely
    geometry_issues = []
    if parcel.geometry_wkt:
        try:
            from shapely import wkt as shapely_wkt
            from shapely.validation import explain_validity
            geom = shapely_wkt.loads(parcel.geometry_wkt)
            if not geom.is_valid:
                geometry_issues.append({"type": "invalid_geometry", "detail": explain_validity(geom)})
            if geom.is_empty:
                geometry_issues.append({"type": "empty_geometry", "detail": "Parcel geometry is empty"})
        except Exception as e:
            geometry_issues.append({"type": "parse_error", "detail": str(e)})

    return {"parcel": _parcel_out(parcel), "spatialChecks": results, "geometryIssues": geometry_issues}


def _parcel_out(p: Parcel) -> dict:
    return {
        "id": str(p.id),
        "parcelCode": p.parcel_code,
        "plotNumber": p.plot_number,
        "village": p.village,
        "district": p.district,
        "calculatedArea": p.calculated_area,
        "geometryWkt": p.geometry_wkt,
        "createdAt": p.created_at.isoformat() if p.created_at else None,
    }
