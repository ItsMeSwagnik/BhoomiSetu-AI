import os
import re
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.database import get_db
from app.models import CadastralMap, MapPlot, LandRecord
from app.services.storage import storage_service
from app.services.mouza_vision import mouza_vision_service

router = APIRouter(prefix="/api/cadastral-maps", tags=["cadastral-maps"])


def wkt_to_coords(wkt: str) -> List[List[float]]:
    """Converts canonical WKT POLYGON((x1 y1, x2 y2, ...)) to [[x1, y1], [x2, y2], ...]"""
    if not wkt:
        return []
    try:
        match = re.search(r"\(\((.*?)\)\)", wkt)
        if not match:
            return []
        points_str = match.group(1).split(",")
        coords = []
        for p in points_str:
            parts = p.strip().split()
            if len(parts) >= 2:
                coords.append([float(parts[0]), float(parts[1])])
        return coords
    except Exception:
        return []


def serialize_plot(plot: MapPlot) -> Dict[str, Any]:
    """Serializes MapPlot with on-the-fly GeoJSON polygon coordinates."""
    dalil_info = None
    if plot.dalil_record:
        dalil_info = {
            "id": plot.dalil_record.id,
            "owner": plot.dalil_record.owner,
            "coOwner": plot.dalil_record.co_owner,
            "khasra": plot.dalil_record.khasra,
            "plotNumber": plot.dalil_record.plot_number,
            "area": f"{plot.dalil_record.area or ''} {plot.dalil_record.area_unit or ''}".strip(),
            "village": plot.dalil_record.village,
            "district": plot.dalil_record.district,
            "landClassification": plot.dalil_record.land_classification,
            "registrationNumber": plot.dalil_record.registration_number,
            "status": plot.dalil_record.status,
        }

    return {
        "id": plot.id,
        "mapId": plot.map_id,
        "plotNumber": plot.plot_number,
        "geometryWkt": plot.geometry_wkt,
        "coordinates": wkt_to_coords(plot.geometry_wkt),
        "polygonCoordinates": wkt_to_coords(plot.geometry_wkt),
        "centroidX": plot.centroid_x,
        "centroidY": plot.centroid_y,
        "calculatedAreaPx": plot.area_pixels,
        "areaPixels": plot.area_pixels,
        "status": plot.status,
        "dalilId": plot.dalil_id,
        "dalilRecord": dalil_info,
        "confidenceScore": plot.confidence_score,
        "notes": plot.notes,
        "createdAt": plot.created_at.isoformat() if plot.created_at else None,
        "updatedAt": plot.updated_at.isoformat() if plot.updated_at else None,
    }


def serialize_map(m: CadastralMap, include_plots: bool = True) -> Dict[str, Any]:
    total_plots = len(m.plots)
    assigned_plots = sum(1 for p in m.plots if p.dalil_id is not None)
    flagged_plots = sum(1 for p in m.plots if p.status == "flagged")

    res = {
        "id": m.id,
        "state": m.state,
        "district": m.district,
        "mouzaName": m.mouza_name,
        "mouzaNo": m.mouza_no,
        "cloudinaryUrl": m.cloudinary_url,
        "cloudinaryPublicId": m.cloudinary_public_id,
        "imageWidth": m.image_width,
        "imageHeight": m.image_height,
        "uploadedBy": m.uploaded_by,
        "status": m.status,
        "totalPlots": total_plots,
        "plotsCount": total_plots,
        "assignedPlots": assigned_plots,
        "unassignedPlots": total_plots - assigned_plots,
        "flaggedPlots": flagged_plots,
        "createdAt": m.created_at.isoformat() if m.created_at else None,
        "updatedAt": m.updated_at.isoformat() if m.updated_at else None,
    }

    if include_plots:
        res["plots"] = [serialize_plot(p) for p in m.plots]

    return res


class PlotUpdateRequest(BaseModel):
    plot_number: Optional[str] = None
    geometry_wkt: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class PlotCreateRequest(BaseModel):
    plot_number: str
    geometry_wkt: str
    centroid_x: Optional[float] = None
    centroid_y: Optional[float] = None
    area_pixels: Optional[float] = None
    notes: Optional[str] = None


class AssignDalilRequest(BaseModel):
    dalil_id: str


@router.post("/upload")
async def upload_cadastral_map(
    file: UploadFile = File(...),
    district: str = Form(...),
    mouza_name: str = Form(...),
    mouza_no: Optional[str] = Form(None),
    state: Optional[str] = Form("Maharashtra"),
    uploaded_by: Optional[str] = Form("operator"),
    db: Session = Depends(get_db),
):
    """
    Ingests a high-resolution Mouza Map image into Cloudinary CDN, runs OpenCV
    contour extraction and plot detection, and stores canonical map & plot records.
    """
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded map file is empty.")

        # 1. Save file to Cloudinary / Storage
        file_id, local_path, file_url = storage_service.save_file(contents, file.filename)

        # 2. Extract plot boundaries via OpenCV Contour & OCR Pipeline
        extraction = mouza_vision_service.extract_cadastral_plots(
            image_bytes=contents,
            mouza_name=mouza_name,
            mouza_no=mouza_no or "",
        )

        width = extraction.get("image_width", 2000)
        height = extraction.get("image_height", 1500)
        detected_plots = extraction.get("plots", [])

        # 3. Create CadastralMap in PostgreSQL
        cad_map = CadastralMap(
            id=file_id,
            state=state,
            district=district,
            mouza_name=mouza_name,
            mouza_no=mouza_no,
            cloudinary_url=file_url,
            cloudinary_public_id=f"bhoomisetu_documents/{file_id}_{os.path.splitext(file.filename)[0]}",
            image_width=width,
            image_height=height,
            uploaded_by=uploaded_by,
            status="extracted",
        )
        db.add(cad_map)
        db.commit()
        db.refresh(cad_map)

        # 4. Save detected plots
        for p in detected_plots:
            plot_rec = MapPlot(
                map_id=cad_map.id,
                plot_number=p["plot_number"],
                geometry_wkt=p["geometry_wkt"],
                centroid_x=p["centroid_x"],
                centroid_y=p["centroid_y"],
                area_pixels=p["area_pixels"],
                confidence_score=p.get("confidence_score", 0.92),
                status=p.get("status", "detected"),
                notes=p.get("notes"),
            )
            db.add(plot_rec)

        db.commit()
        db.refresh(cad_map)

        return serialize_map(cad_map, include_plots=True)
    except Exception as e:
        db.rollback()
        print(f"[CadastralMap] Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process cadastral map: {str(e)}")


@router.get("")
def list_cadastral_maps(
    district: Optional[str] = Query(None),
    mouza_name: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Lists all uploaded mouza sheets with summary plot metrics."""
    query = db.query(CadastralMap)
    if district and district != "All":
        query = query.filter(CadastralMap.district == district)
    if mouza_name:
        query = query.filter(CadastralMap.mouza_name.ilike(f"%{mouza_name}%"))

    maps = query.order_by(CadastralMap.created_at.desc()).offset(skip).limit(limit).all()
    return [serialize_map(m, include_plots=False) for m in maps]


@router.get("/{map_id}")
def get_cadastral_map_detail(map_id: str, db: Session = Depends(get_db)):
    """Retrieves single mouza sheet with all plots and linked dalil records."""
    m = db.query(CadastralMap).filter(CadastralMap.id == map_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Cadastral map not found")
    return serialize_map(m, include_plots=True)


@router.get("/{map_id}/image")
@router.get("/{map_id}/file")
def get_cadastral_map_image(map_id: str, db: Session = Depends(get_db)):
    """
    Streams the high-resolution rasterized map sheet image (PNG/JPEG) for browser rendering.
    If the source file is a multi-page or single-page PDF, dynamically rasterizes page 1 to 150 DPI PNG.
    """
    m = db.query(CadastralMap).filter(CadastralMap.id == map_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Cadastral map not found")

    file_bytes = storage_service.get_file_bytes(
        file_path="",
        file_id=m.id,
        file_url=m.cloudinary_url,
    )

    if not file_bytes:
        raise HTTPException(status_code=404, detail="Map file content not found in storage")

    # If it is a PDF, rasterize page 1 to PNG via PyMuPDF
    if file_bytes.startswith(b"%PDF"):
        try:
            import fitz
            pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")
            if len(pdf_doc) > 0:
                page = pdf_doc[0]
                pix = page.get_pixmap(dpi=150)
                png_bytes = pix.tobytes("png")
                pdf_doc.close()
                return Response(
                    content=png_bytes,
                    media_type="image/png",
                    headers={"Cache-Control": "public, max-age=86400"},
                )
        except Exception as e:
            print(f"[CadastralMap] PDF rasterization error: {e}")

    # Determine image media type
    media_type = "image/png"
    if file_bytes.startswith(b"\xff\xd8\xff"):
        media_type = "image/jpeg"
    elif file_bytes.startswith(b"RIFF") and b"WEBP" in file_bytes[:12]:
        media_type = "image/webp"

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.post("/{map_id}/reprocess")
def reprocess_cadastral_map(map_id: str, db: Session = Depends(get_db)):
    """Re-runs the OpenCV contour & plot extraction pipeline on an existing map sheet."""
    m = db.query(CadastralMap).filter(CadastralMap.id == map_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Cadastral map not found")

    # Fetch file bytes from local or Cloudinary
    file_bytes = storage_service.get_file_bytes(
        file_path=m.cloudinary_url,
        file_id=m.id,
        file_url=m.cloudinary_url,
    )
    if not file_bytes:
        raise HTTPException(status_code=404, detail="Map file content could not be retrieved")

    extraction = mouza_vision_service.extract_cadastral_plots(
        image_bytes=file_bytes,
        mouza_name=m.mouza_name,
        mouza_no=m.mouza_no or "",
    )

    # Remove existing unassigned plots
    unassigned = [p for p in m.plots if p.dalil_id is None]
    for p in unassigned:
        db.delete(p)

    # Insert newly detected plots
    for p in extraction.get("plots", []):
        plot_rec = MapPlot(
            map_id=m.id,
            plot_number=p["plot_number"],
            geometry_wkt=p["geometry_wkt"],
            centroid_x=p["centroid_x"],
            centroid_y=p["centroid_y"],
            area_pixels=p["area_pixels"],
            confidence_score=p.get("confidence_score", 0.92),
            status=p.get("status", "detected"),
            notes="Reprocessed via OpenCV contour pipeline",
        )
        db.add(plot_rec)

    m.image_width = extraction.get("image_width", m.image_width)
    m.image_height = extraction.get("image_height", m.image_height)
    m.status = "extracted"
    db.commit()
    db.refresh(m)

    return serialize_map(m, include_plots=True)


@router.delete("/{map_id}")
def delete_cadastral_map(map_id: str, db: Session = Depends(get_db)):
    """Deletes mouza map and cascade-deletes all its detected plots."""
    m = db.query(CadastralMap).filter(CadastralMap.id == map_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Cadastral map not found")

    db.delete(m)
    db.commit()
    return {"success": True, "message": "Cadastral map and plots deleted"}


@router.post("/{map_id}/plots")
def create_manual_plot(map_id: str, payload: PlotCreateRequest, db: Session = Depends(get_db)):
    """Manually adds a user-drawn plot boundary to a mouza sheet."""
    m = db.query(CadastralMap).filter(CadastralMap.id == map_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Cadastral map not found")

    plot = MapPlot(
        map_id=m.id,
        plot_number=payload.plot_number,
        geometry_wkt=payload.geometry_wkt,
        centroid_x=payload.centroid_x,
        centroid_y=payload.centroid_y,
        area_pixels=payload.area_pixels,
        confidence_score=1.0,
        status="detected",
        notes=payload.notes or "Manually drawn by operator",
    )
    db.add(plot)
    db.commit()
    db.refresh(plot)

    return serialize_plot(plot)


@router.patch("/{map_id}/plots/{plot_id}")
def update_plot(map_id: str, plot_id: str, payload: PlotUpdateRequest, db: Session = Depends(get_db)):
    """Updates plot number, polygon geometry vertices (WKT), or status."""
    plot = db.query(MapPlot).filter(MapPlot.id == plot_id, MapPlot.map_id == map_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found on this map")

    if payload.plot_number is not None:
        plot.plot_number = payload.plot_number
    if payload.geometry_wkt is not None:
        plot.geometry_wkt = payload.geometry_wkt
        # Recompute centroid from coordinates
        coords = wkt_to_coords(payload.geometry_wkt)
        if coords:
            plot.centroid_x = sum(c[0] for c in coords) / len(coords)
            plot.centroid_y = sum(c[1] for c in coords) / len(coords)
    if payload.status is not None:
        plot.status = payload.status
    if payload.notes is not None:
        plot.notes = payload.notes

    db.commit()
    db.refresh(plot)
    return serialize_plot(plot)


@router.delete("/{map_id}/plots/{plot_id}")
def delete_plot(map_id: str, plot_id: str, db: Session = Depends(get_db)):
    """Deletes an individual plot boundary."""
    plot = db.query(MapPlot).filter(MapPlot.id == plot_id, MapPlot.map_id == map_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    db.delete(plot)
    db.commit()
    return {"success": True, "message": "Plot deleted"}


@router.post("/{map_id}/plots/{plot_id}/assign")
def assign_dalil_to_plot(map_id: str, plot_id: str, payload: AssignDalilRequest, db: Session = Depends(get_db)):
    """Links a Dalil (LandRecord) to a cadastral plot."""
    plot = db.query(MapPlot).filter(MapPlot.id == plot_id, MapPlot.map_id == map_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    record = db.query(LandRecord).filter(LandRecord.id == payload.dalil_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Land record / Dalil not found")

    plot.dalil_id = record.id
    plot.status = "assigned"
    db.commit()
    db.refresh(plot)

    return serialize_plot(plot)


@router.post("/{map_id}/plots/{plot_id}/unassign")
def unassign_dalil_from_plot(map_id: str, plot_id: str, db: Session = Depends(get_db)):
    """Unlinks the dalil from a cadastral plot."""
    plot = db.query(MapPlot).filter(MapPlot.id == plot_id, MapPlot.map_id == map_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    plot.dalil_id = None
    plot.status = "detected"
    db.commit()
    db.refresh(plot)

    return serialize_plot(plot)
