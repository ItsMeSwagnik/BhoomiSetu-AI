from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_url = Column(String(1024), nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), default="application/pdf")
    status = Column(String(50), default="queued")  # queued, processing, extracted, verified, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    records = relationship("LandRecord", back_populates="document", cascade="all, delete-orphan")


class LandRecord(Base):
    __tablename__ = "land_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    
    # 20 specified land record fields
    owner = Column(String(255), nullable=True)
    co_owner = Column(String(255), nullable=True)
    share = Column(String(100), nullable=True)
    khatian_khata = Column(String(100), nullable=True)
    khasra = Column(String(100), nullable=True)
    dag = Column(String(100), nullable=True)
    plot_number = Column(String(100), nullable=True)
    survey_number = Column(String(100), nullable=True)
    area = Column(String(100), nullable=True)
    area_unit = Column(String(100), nullable=True)
    village = Column(String(255), nullable=True)
    mouza = Column(String(255), nullable=True)
    tehsil_taluk = Column(String(255), nullable=True)
    district = Column(String(255), nullable=True)
    land_classification = Column(JSON, default=list)  # array of strings e.g. ["🌾 Agricultural Land"]
    mutation_number = Column(String(100), nullable=True)
    mutation_date = Column(String(100), nullable=True)
    registration_number = Column(String(100), nullable=True)
    registration_date = Column(String(100), nullable=True)
    previous_owner = Column(String(255), nullable=True)
    new_owner = Column(String(255), nullable=True)

    # Metadata & Tracking
    raw_ocr_response = Column(JSON, nullable=True)
    confidence_score = Column(Float, default=0.95)
    ocr_model_used = Column(String(100), nullable=True)
    is_validated = Column(Boolean, default=False, nullable=True)  # True if passes PDF ground truth validation, False if fails
    status = Column(String(50), default="extracted")  # extracted, verified, flagged
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="records")


class CadastralMap(Base):
    __tablename__ = "cadastral_maps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=False)
    mouza_name = Column(String(255), nullable=False)
    mouza_no = Column(String(100), nullable=True)  # JL Number
    cloudinary_url = Column(String(1024), nullable=False)
    cloudinary_public_id = Column(String(255), nullable=True)
    image_width = Column(Integer, default=2000)
    image_height = Column(Integer, default=1500)
    uploaded_by = Column(String(100), default="operator")
    status = Column(String(50), default="extracted")  # uploaded, processing, extracted, completed, failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    plots = relationship("MapPlot", back_populates="cadastral_map", cascade="all, delete-orphan", order_by="MapPlot.plot_number")


class MapPlot(Base):
    __tablename__ = "map_plots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    map_id = Column(String(36), ForeignKey("cadastral_maps.id", ondelete="CASCADE"), nullable=False)
    plot_number = Column(String(100), nullable=False)
    geometry_wkt = Column(Text, nullable=False)  # Canonical WKT POLYGON((...)) in pixel space
    centroid_x = Column(Float, nullable=True)
    centroid_y = Column(Float, nullable=True)
    area_pixels = Column(Float, nullable=True)
    status = Column(String(50), default="detected")  # detected, assigned, flagged, verified
    dalil_id = Column(String(36), ForeignKey("land_records.id", ondelete="SET NULL"), nullable=True)
    confidence_score = Column(Float, default=0.92)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    cadastral_map = relationship("CadastralMap", back_populates="plots")
    dalil_record = relationship("LandRecord")
