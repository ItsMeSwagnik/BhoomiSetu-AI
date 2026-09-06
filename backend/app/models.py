import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Boolean, DateTime, Enum, ForeignKey,
    Text, Integer, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class UserRole(str, enum.Enum):
    citizen = "citizen"
    data_operator = "data_operator"
    verifier = "verifier"
    approving_officer = "approving_officer"
    admin = "admin"
    auditor = "auditor"


class UserStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    pending = "pending"


class DocumentType(str, enum.Enum):
    ror = "ror"
    khatian = "khatian"
    mutation_record = "mutation_record"
    registration_record = "registration_record"
    cadastral_map = "cadastral_map"
    other = "other"


class DocumentStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    extracted = "extracted"
    needs_review = "needs_review"
    failed = "failed"


class RecordStatus(str, enum.Enum):
    pending = "pending"
    flagged = "flagged"
    in_verification = "in_verification"
    pending_approval = "pending_approval"
    verified = "verified"
    rejected = "rejected"


class ValidationStatus(str, enum.Enum):
    pass_ = "pass"
    warning = "warning"
    fail = "fail"


class ValidationType(str, enum.Enum):
    rule = "rule"
    cross_record = "cross_record"
    entity_match = "entity_match"
    gis_spatial = "gis_spatial"


class SubmissionStatus(str, enum.Enum):
    submitted = "submitted"
    processing = "processing"
    in_verification = "in_verification"
    verified = "verified"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    documents = relationship("Document", back_populates="uploader")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    document_type = Column(Enum(DocumentType), default=DocumentType.other)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.queued, index=True)
    village = Column(String, index=True)
    district = Column(String, index=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)

    uploader = relationship("User", back_populates="documents")
    ocr_results = relationship("OCRResult", back_populates="document")
    land_records = relationship("LandRecord", back_populates="document")


class OCRResult(Base):
    __tablename__ = "ocr_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False, index=True)
    page_number = Column(Integer, default=1)
    raw_text = Column(Text)
    confidence = Column(Float)
    bbox = Column(JSON)
    language = Column(String, default="en")
    text_type = Column(String, default="printed")

    document = relationship("Document", back_populates="ocr_results")


class Parcel(Base):
    __tablename__ = "parcels"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_code = Column(String, unique=True, nullable=False, index=True)
    plot_number = Column(String, index=True)
    village = Column(String, index=True)
    district = Column(String, index=True)
    geometry_wkt = Column(Text)  # WKT polygon, PostGIS geometry in production
    calculated_area = Column(Float)  # in acres
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    land_records = relationship("LandRecord", back_populates="parcel")


class LandRecord(Base):
    __tablename__ = "land_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False, index=True)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=True, index=True)
    owner = Column(String, index=True)
    co_owner = Column(String)
    owner_share = Column(Float)
    khatian_number = Column(String, index=True)
    khasra_number = Column(String, index=True)
    plot_number = Column(String, index=True)
    survey_number = Column(String)
    area = Column(Float)
    area_unit = Column(String, default="acre")
    village = Column(String, index=True)
    mouza = Column(String)
    tehsil = Column(String)
    district = Column(String, index=True)
    state = Column(String)
    land_classification = Column(String)
    mutation_number = Column(String)
    mutation_date = Column(String)
    registration_number = Column(String)
    registration_date = Column(String)
    previous_owner = Column(String)
    status = Column(Enum(RecordStatus), default=RecordStatus.pending, index=True)
    confidence_score = Column(Float)
    rejection_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    document = relationship("Document", back_populates="land_records")
    parcel = relationship("Parcel", back_populates="land_records")
    extracted_fields = relationship("ExtractedField", back_populates="record")
    validation_results = relationship("ValidationResult", back_populates="record")
    audit_logs = relationship("AuditLog", back_populates="record")


class ExtractedField(Base):
    __tablename__ = "extracted_fields"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = Column(UUID(as_uuid=True), ForeignKey("land_records.id"), nullable=False, index=True)
    field_name = Column(String, nullable=False)
    extracted_value = Column(String)
    original_label = Column(String)
    confidence = Column(Float)
    bbox = Column(JSON)
    page_number = Column(Integer, default=1)
    is_corrected = Column(Boolean, default=False)
    corrected_value = Column(String)
    corrected_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    corrected_at = Column(DateTime(timezone=True))

    record = relationship("LandRecord", back_populates="extracted_fields")


class ValidationResult(Base):
    __tablename__ = "validation_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = Column(UUID(as_uuid=True), ForeignKey("land_records.id"), nullable=False, index=True)
    validation_type = Column(Enum(ValidationType))
    status = Column(String)  # pass, warning, fail
    message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    record = relationship("LandRecord", back_populates="validation_results")


class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = Column(UUID(as_uuid=True), ForeignKey("land_records.id"), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String, nullable=False)
    field_changed = Column(String)
    old_value = Column(Text)
    new_value = Column(Text)
    reason = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    record = relationship("LandRecord", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")


class Submission(Base):
    __tablename__ = "submissions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    citizen_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    record_id = Column(UUID(as_uuid=True), ForeignKey("land_records.id"), nullable=True)
    request_type = Column(String)
    parcel_reference = Column(String)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.submitted)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    type = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")


class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    message = Column(Text)
    level = Column(String, default="info")
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String, primary_key=True)
    value = Column(JSON)


class ParcelHistory(Base):
    """Stores historical geometry snapshots for parcel change detection (step 18)."""
    __tablename__ = "parcel_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=False, index=True)
    geometry_wkt = Column(Text, nullable=False)
    calculated_area = Column(Float)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    source_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    notes = Column(Text)

    parcel = relationship("Parcel", backref="history")
