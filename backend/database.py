from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = "sqlite:///./mineguard.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def migrate_alert_lifecycle_schema():
    """Add lifecycle and priority columns without removing alert history."""

    def infer_event_type(message):
        text_value = str(message or "").upper()

        if "SOS" in text_value:
            return "SOS"

        if "FALL" in text_value:
            return "FALL_DETECTED"

        if "METHANE" in text_value:
            return "GAS_THRESHOLD"

        if "CO" in text_value:
            return "GAS_THRESHOLD"

        if "H2S" in text_value:
            return "GAS_THRESHOLD"

        return "SAFETY_EVENT"

    def infer_priority(severity, risk_score, event_type, source):
        severity = str(severity or "").upper()
        event_type = str(event_type or "").upper()
        source = str(source or "").upper()

        if event_type in {
            "SOS",
            "FALL_DETECTED",
            "GAS_THRESHOLD",
        }:
            return "P1"

        if source == "SENSOR" and severity == "CRITICAL":
            return "P1"

        if severity == "HIGH":
            return "P2"

        if severity == "WARNING":
            if risk_score is not None and risk_score >= 50:
                return "P2"
            return "P3"

        if severity == "MODERATE":
            return "P3"

        return "P4"

    inspector = inspect(engine)

    if "alerts" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("alerts")
    }
    event_state_was_added = "event_state" not in existing_columns
    event_type_was_added = "event_type" not in existing_columns
    source_was_added = "source" not in existing_columns
    priority_was_added = "priority" not in existing_columns

    lifecycle_columns = {
        "event_type": "VARCHAR DEFAULT 'SAFETY_EVENT'",
        "source": "VARCHAR DEFAULT 'SENSOR'",
        "priority": "VARCHAR DEFAULT 'P3'",
        "event_state": "VARCHAR DEFAULT 'ACTIVE'",
        "acknowledged_at": "DATETIME",
        "acknowledged_by": "VARCHAR",
        "under_review_at": "DATETIME",
        "under_review_by": "VARCHAR",
        "resolved_at": "DATETIME",
        "resolved_by": "VARCHAR",
        "resolution_note": "VARCHAR",
    }

    with engine.begin() as connection:
        for name, definition in lifecycle_columns.items():
            if name not in existing_columns:
                connection.execute(
                    text(
                        f"ALTER TABLE alerts ADD COLUMN {name} {definition}"
                    )
                )

        if event_state_was_added:
            connection.execute(
                text(
                    """
                    UPDATE alerts
                    SET event_state = CASE
                        WHEN resolved THEN 'RESOLVED'
                        ELSE 'ACTIVE'
                    END
                    """
                )
            )

        alerts = connection.execute(
            text(
                """
                SELECT id, message, severity, risk_score,
                       event_type, source, priority
                FROM alerts
                """
            )
        ).mappings()

        for alert in alerts:
            has_event_type = bool(alert["event_type"])
            has_source = bool(alert["source"])
            has_priority = bool(alert["priority"])

            if (
                has_event_type
                and has_source
                and has_priority
                and not (
                    event_type_was_added
                    or source_was_added
                    or priority_was_added
                )
            ):
                continue

            event_type = (
                alert["event_type"]
                if has_event_type and not event_type_was_added
                else infer_event_type(alert["message"])
            )
            source = (
                alert["source"]
                if has_source and not source_was_added
                else "SENSOR"
            )
            priority = (
                alert["priority"]
                if has_priority and not priority_was_added
                else infer_priority(
                    alert["severity"],
                    alert["risk_score"],
                    event_type,
                    source,
                )
            )

            connection.execute(
                text(
                    """
                    UPDATE alerts
                    SET event_type = :event_type,
                        source = :source,
                        priority = :priority
                    WHERE id = :id
                    """
                ),
                {
                    "id": alert["id"],
                    "event_type": event_type,
                    "source": source,
                    "priority": priority,
                },
            )
        else:
            connection.execute(
                text(
                    """
                    UPDATE alerts
                    SET event_state = CASE
                        WHEN resolved THEN 'RESOLVED'
                        ELSE 'ACTIVE'
                    END
                    WHERE event_state IS NULL
                        OR event_state = ''
                        OR (
                            resolved
                            AND event_state = 'ACTIVE'
                            AND resolved_at IS NULL
                            AND resolved_by IS NULL
                            AND resolution_note IS NULL
                        )
                    """
                )
            )


def migrate_database():
    """Create missing MineGuard tables without removing existing data."""

    Base.metadata.create_all(bind=engine)
    migrate_indexes()
    migrate_alert_lifecycle_schema()
    migrate_worker_monitoring_schema()
    migrate_device_schema()
    migrate_gps_schema()


def migrate_gps_schema():
    """Add GPS columns to existing worker and sensor reading tables."""

    inspector = inspect(engine)

    if "workers" in inspector.get_table_names():
        worker_columns = {
            column["name"]
            for column in inspector.get_columns("workers")
        }

        with engine.begin() as connection:
            gps_columns = {
                "latitude": "FLOAT",
                "longitude": "FLOAT",
                "gps_altitude": "FLOAT",
                "gps_satellites": "INTEGER",
                "gps_valid": "BOOLEAN DEFAULT 0",
            }

            for name, definition in gps_columns.items():
                if name not in worker_columns:
                    connection.execute(
                        text(
                            f"ALTER TABLE workers ADD COLUMN {name} "
                            f"{definition}"
                        )
                    )

    inspector = inspect(engine)

    if "sensor_readings" not in inspector.get_table_names():
        return

    sensor_columns = {
        column["name"]
        for column in inspector.get_columns("sensor_readings")
    }

    with engine.begin() as connection:
        gps_columns = {
            "latitude": "FLOAT",
            "longitude": "FLOAT",
            "gps_altitude": "FLOAT",
            "gps_satellites": "INTEGER",
            "gps_valid": "BOOLEAN DEFAULT 0",
        }

        for name, definition in gps_columns.items():
            if name not in sensor_columns:
                connection.execute(
                    text(
                        f"ALTER TABLE sensor_readings ADD COLUMN {name} "
                        f"{definition}"
                    )
                )


def migrate_indexes():
    """Create declared indexes on existing tables without changing data."""

    for table in Base.metadata.tables.values():
        for index in table.indexes:
            index.create(bind=engine, checkfirst=True)


def migrate_worker_monitoring_schema():
    """Add monitoring fields without removing existing worker data."""

    inspector = inspect(engine)

    if "workers" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("workers")
    }

    with engine.begin() as connection:
        if "last_seen_at" not in existing_columns:
            connection.execute(
                text(
                    """
                    ALTER TABLE workers
                    ADD COLUMN last_seen_at DATETIME
                    """
                )
            )


def migrate_device_schema():
    """Create the devices table if it does not exist."""

    Base.metadata.create_all(bind=engine)
