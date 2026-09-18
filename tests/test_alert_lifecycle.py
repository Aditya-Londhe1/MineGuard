import asyncio
from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base
from backend.main import receive_sensor_data
from backend.models.database_models import Alert
from backend.models.sensor import SensorData
from backend.safety.prioritization import (
    determine_priority,
)
from backend.routes.alerts import (
    acknowledge_alert,
    get_response_queue,
    mark_under_review,
    resolve_alert,
)


@pytest.fixture
def db_session(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'lifecycle.db'}")
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()

    alert = Alert(
        worker_id="W-TEST",
        alert_type="SAFETY_EVENT",
        severity="WARNING",
        risk_score=50,
        message="Elevated gas reading",
        zone="Test Zone",
        timestamp=datetime.utcnow(),
        resolved=False,
        event_state="ACTIVE",
    )
    session.add(alert)
    session.commit()

    yield session, alert.id

    session.close()
    engine.dispose()


def test_alert_lifecycle_transitions(db_session):
    db, alert_id = db_session

    with pytest.raises(HTTPException) as error:
        resolve_alert(alert_id, db)

    assert error.value.status_code == 400

    acknowledged = acknowledge_alert(alert_id, db)
    assert acknowledged["event_state"] == "ACKNOWLEDGED"
    assert acknowledged["acknowledged_by"] == "supervisor"

    reviewed = mark_under_review(alert_id, db)
    assert reviewed["event_state"] == "UNDER_REVIEW"
    assert reviewed["under_review_by"] == "supervisor"

    resolved = resolve_alert(alert_id, db)
    assert resolved["event_state"] == "RESOLVED"
    assert resolved["resolved"] is True
    assert resolved["resolved_by"] == "supervisor"


def test_sensor_updates_preserve_acknowledged_state(db_session):
    db, _ = db_session
    initial_timestamp = datetime.utcnow()

    first_reading = SensorData(
        worker_id="W-TEST-LIVE",
        heart_rate=100,
        spo2=92,
        temperature=34,
        humidity=70,
        methane=300,
        co=30,
        h2s=8,
        fall_detected=False,
        sos=False,
        zone="Test Zone",
        battery=90,
        timestamp=initial_timestamp,
    )

    asyncio.run(receive_sensor_data(first_reading, db))
    alert = db.query(Alert).filter(
        Alert.worker_id == first_reading.worker_id
    ).one()

    acknowledge_alert(alert.id, db)

    follow_up_reading = first_reading.model_copy(
        update={"timestamp": initial_timestamp + timedelta(minutes=1)}
    )
    asyncio.run(receive_sensor_data(follow_up_reading, db))

    db.refresh(alert)
    assert alert.event_state == "ACKNOWLEDGED"
    assert alert.resolved is False
    assert alert.event_type == "GAS_THRESHOLD"
    assert alert.priority == "P1"


def test_priority_rules_for_direct_and_non_direct_events():
    assert determine_priority("CRITICAL", 100, "SOS") == "P1"
    assert determine_priority("WARNING", 60, "FALL_DETECTED") == "P1"
    assert determine_priority("WARNING", 55, "GAS_THRESHOLD") == "P1"
    assert determine_priority("MODERATE", 45, "SAFETY_EVENT") == "P3"
    assert determine_priority(
        "LOW", 80, "SAFETY_EVENT", source="PREDICTION"
    ) == "P2"


def test_response_queue_orders_priority_then_risk_then_time(db_session):
    db, _ = db_session
    timestamp = datetime.utcnow()

    alerts = [
        Alert(
            worker_id="W-P3",
            alert_type="SAFETY_EVENT",
            event_type="SAFETY_EVENT",
            source="SENSOR",
            severity="WARNING",
            priority="P3",
            risk_score=90,
            message="Warning",
            zone="Test Zone",
            timestamp=timestamp,
            resolved=False,
            event_state="ACTIVE",
        ),
        Alert(
            worker_id="W-P1-LOW",
            alert_type="SAFETY_EVENT",
            event_type="SOS",
            source="SENSOR",
            severity="CRITICAL",
            priority="P1",
            risk_score=50,
            message="SOS",
            zone="Test Zone",
            timestamp=timestamp + timedelta(minutes=2),
            resolved=False,
            event_state="ACTIVE",
        ),
        Alert(
            worker_id="W-P1-HIGH",
            alert_type="SAFETY_EVENT",
            event_type="FALL_DETECTED",
            source="SENSOR",
            severity="CRITICAL",
            priority="P1",
            risk_score=90,
            message="Fall detected",
            zone="Test Zone",
            timestamp=timestamp + timedelta(minutes=1),
            resolved=False,
            event_state="ACTIVE",
        ),
        Alert(
            worker_id="W-P2",
            alert_type="SAFETY_EVENT",
            event_type="SAFETY_EVENT",
            source="SENSOR",
            severity="WARNING",
            priority="P2",
            risk_score=100,
            message="Warning",
            zone="Test Zone",
            timestamp=timestamp + timedelta(minutes=3),
            resolved=False,
            event_state="ACTIVE",
        ),
    ]
    db.add_all(alerts)
    db.commit()

    queue = get_response_queue(db)

    assert [item["worker_id"] for item in queue] == [
        "W-P1-HIGH",
        "W-P1-LOW",
        "W-P2",
        "W-P3",
        "W-TEST",
    ]
