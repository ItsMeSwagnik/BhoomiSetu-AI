"""GIS utility functions using Shapely and GeoPandas.

Used for:
- Area calculation from WKT geometry (in acres)
- Geometry validity checks
- Spatial queries and comparisons
- Parcel change detection helpers

GeoPandas and Shapely are optional — functions fall back gracefully.
"""
from typing import Optional


def wkt_to_area_acres(geometry_wkt: str) -> Optional[float]:
    """
    Calculate area in acres from a WKT polygon string.
    Uses GeoPandas with EPSG:4326 → EPSG:32644 (UTM Zone 44N, covers most of India)
    for accurate metric area, then converts to acres.
    Falls back to Shapely planar area (degrees²) if GeoPandas unavailable.
    """
    if not geometry_wkt:
        return None
    try:
        import geopandas as gpd
        from shapely import wkt as shapely_wkt
        geom = shapely_wkt.loads(geometry_wkt)
        gdf = gpd.GeoDataFrame(geometry=[geom], crs="EPSG:4326")
        # Project to UTM for accurate area in square metres
        gdf_utm = gdf.to_crs("EPSG:32644")
        area_sqm = gdf_utm.geometry.area.iloc[0]
        return round(area_sqm / 4046.856, 4)  # 1 acre = 4046.856 m²
    except ImportError:
        # GeoPandas not available — use Shapely planar area as approximation
        try:
            from shapely import wkt as shapely_wkt
            geom = shapely_wkt.loads(geometry_wkt)
            # Very rough: 1 degree² ≈ 12,391 km² at India's latitude
            # Convert to acres: 1 km² = 247.105 acres
            area_deg2 = geom.area
            area_acres = area_deg2 * 12_391_000 * 247.105 / 1_000_000
            return round(area_acres, 4)
        except Exception:
            return None
    except Exception:
        return None


def validate_geometry(geometry_wkt: str) -> dict:
    """
    Run full geometry validation using Shapely.
    Returns a dict with validity status and list of issues.
    """
    issues = []
    if not geometry_wkt:
        return {"valid": False, "issues": [{"type": "missing", "detail": "No geometry provided"}]}
    try:
        from shapely import wkt as shapely_wkt
        from shapely.validation import explain_validity, make_valid
        geom = shapely_wkt.loads(geometry_wkt)

        if geom.is_empty:
            issues.append({"type": "empty_geometry", "detail": "Geometry is empty"})
        if not geom.is_valid:
            issues.append({"type": "invalid_geometry", "detail": explain_validity(geom)})
        if geom.geom_type not in ("Polygon", "MultiPolygon"):
            issues.append({"type": "wrong_type", "detail": f"Expected Polygon, got {geom.geom_type}"})

        return {
            "valid": len(issues) == 0,
            "geometryType": geom.geom_type,
            "issues": issues,
            "area": wkt_to_area_acres(geometry_wkt),
        }
    except Exception as e:
        return {"valid": False, "issues": [{"type": "parse_error", "detail": str(e)}]}


def compute_geometry_diff(wkt_a: str, wkt_b: str) -> dict:
    """
    Compare two WKT geometries and return change metrics.
    Used for parcel change detection (step 18).
    """
    try:
        from shapely import wkt as shapely_wkt
        geom_a = shapely_wkt.loads(wkt_a)
        geom_b = shapely_wkt.loads(wkt_b)

        intersection = geom_a.intersection(geom_b)
        union = geom_a.union(geom_b)
        iou = intersection.area / union.area if union.area > 0 else 0

        area_a = wkt_to_area_acres(wkt_a) or 0
        area_b = wkt_to_area_acres(wkt_b) or 0
        area_change_pct = ((area_b - area_a) / area_a * 100) if area_a > 0 else None

        return {
            "iou": round(iou, 4),                          # Intersection over Union
            "boundaryChanged": not geom_a.equals(geom_b),
            "areaA": area_a,
            "areaB": area_b,
            "areaChangePct": round(area_change_pct, 2) if area_change_pct is not None else None,
            "intersectionArea": wkt_to_area_acres(intersection.wkt) if not intersection.is_empty else 0,
        }
    except Exception as e:
        return {"error": str(e)}


def find_overlapping_parcels(parcels: list[dict]) -> list[dict]:
    """
    Given a list of dicts with 'parcel_code' and 'geometry_wkt',
    return all overlapping pairs using Shapely.
    """
    try:
        from shapely import wkt as shapely_wkt
    except ImportError:
        return []

    geoms = []
    for p in parcels:
        try:
            geoms.append((p["parcel_code"], shapely_wkt.loads(p["geometry_wkt"])))
        except Exception:
            pass

    overlaps = []
    for i in range(len(geoms)):
        for j in range(i + 1, len(geoms)):
            code_a, ga = geoms[i]
            code_b, gb = geoms[j]
            if ga.intersects(gb) and not ga.touches(gb):
                inter = ga.intersection(gb)
                if inter.area > 0:
                    overlap_pct = inter.area / min(ga.area, gb.area) * 100
                    overlaps.append({
                        "parcelA": code_a,
                        "parcelB": code_b,
                        "overlapPct": round(overlap_pct, 2),
                        "severity": "high" if overlap_pct > 10 else "low",
                    })
    return overlaps
