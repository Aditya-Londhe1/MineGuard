from datetime import datetime

from sqlalchemy import Column, Index, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class Worker(Base):

    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)

    worker_id = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    name = Column(String, nullable=False)

    helmet_id = Column(String, unique=True)

    zone = Column(String)

    status = Column(
        String,
        default="SAFE"
    )

    battery = Column(Float, default=100)

    last_seen_at = Column(DateTime)

    latitude = Column(Float)
    longitude = Column(Float)
    gps_altitude = Column(Float)
    gps_satellites = Column(Integer)
    gps_valid = Column(Boolean, default=False)

    created_at = Column(DateTime)


class Device(Base):

    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)

    device_id = Column(String, unique=True, index=True, nullable=False)

    worker_id = Column(String, index=True, nullable=False)

    device_type = Column(String, default="ESP32_DEVKIT_V1")

    enabled = Column(Boolean, default=True)

    last_seen_at = Column(DateTime)

    created_at = Column(DateTime)

class SensorReading(Base):

    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)

    worker_id = Column(String, index=True)

    heart_rate = Column(Integer)

    spo2 = Column(Float)

    temperature = Column(Float)

    humidity = Column(Float)

    methane = Column(Float)

    co = Column(Float)

    h2s = Column(Float)

    fall_detected = Column(Boolean)

    sos = Column(Boolean)

    zone = Column(String)

    battery = Column(Float)

    latitude = Column(Float)
    longitude = Column(Float)
    gps_altitude = Column(Float)
    gps_satellites = Column(Integer)
    gps_valid = Column(Boolean, default=False)

    timestamp = Column(DateTime)

    __table_args__ = (
        Index("ix_sensor_readings_timestamp", "timestamp"),
        Index("ix_sensor_readings_zone", "zone"),
    )

class Alert(Base):

    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    worker_id: Mapped[str | None] = mapped_column(String, index=True)

    alert_type: Mapped[str | None] = mapped_column(String)

    event_type: Mapped[str] = mapped_column(
        String,
        default="SAFETY_EVENT",
    )

    source: Mapped[str] = mapped_column(String, default="SENSOR")

    severity: Mapped[str | None] = mapped_column(String)

    priority: Mapped[str] = mapped_column(String, default="P3")

    risk_score: Mapped[int | None] = mapped_column(Integer)

    message: Mapped[str | None] = mapped_column(String)

    zone: Mapped[str | None] = mapped_column(String)

    timestamp: Mapped[datetime | None] = mapped_column(DateTime)

    # Existing field - kept for backward compatibility
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)

    # Operational lifecycle
    event_state: Mapped[str] = mapped_column(String, default="ACTIVE")

    # Acknowledgement information
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime)
    acknowledged_by: Mapped[str | None] = mapped_column(String)

    # Investigation information
    under_review_at: Mapped[datetime | None] = mapped_column(DateTime)
    under_review_by: Mapped[str | None] = mapped_column(String)

    # Resolution information
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime)
    resolved_by: Mapped[str | None] = mapped_column(String)
    resolution_note: Mapped[str | None] = mapped_column(String)

    __table_args__ = (
        Index("ix_alerts_event_state", "event_state"),
        Index("ix_alerts_priority", "priority"),
        Index("ix_alerts_timestamp", "timestamp"),
        Index("ix_alerts_zone", "zone"),
        Index("ix_alerts_resolved", "resolved"),
    )


class SafetyEventAudit(Base):
    __tablename__ = "safety_event_audits"

    id = Column(Integer, primary_key=True, index=True)

    alert_id = Column(Integer, index=True, nullable=False)

    worker_id = Column(String, index=True)

    zone = Column(String)

    action = Column(String, nullable=False)

    previous_state = Column(String)

    new_state = Column(String)

    actor = Column(String)

    timestamp = Column(DateTime)

    details = Column(String)

    __table_args__ = (
        Index("ix_safety_event_audits_timestamp", "timestamp"),
    )


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    password_hash = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False,
        default="SUPERVISOR"
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime
    )
