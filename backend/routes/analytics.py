from datetime import datetime, timedelta
from typing import cast

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.database_models import (
    Alert,
    SensorReading,
    Worker,
)
from backend.models.sensor import SensorData
from backend.safety.engine import evaluate_safety

router = APIRouter(
    prefix="/api/analytics",
    tags=["Historical Analytics"]
)


def _cutoff(hours: int) -> datetime:

    return datetime.utcnow() - timedelta(hours=hours)


def _to_sensor_data(reading: SensorReading) -> SensorData:

    return SensorData(
        worker_id=cast(str, reading.worker_id),
        heart_rate=cast(int, reading.heart_rate),
        spo2=cast(float, reading.spo2),
        temperature=cast(float, reading.temperature),
        humidity=cast(float, reading.humidity),
        methane=cast(float, reading.methane),
        co=cast(float, reading.co),
        h2s=cast(float, reading.h2s),
        fall_detected=cast(bool, reading.fall_detected),
        sos=cast(bool, reading.sos),
        zone=cast(str, reading.zone),
        battery=cast(float, reading.battery),
        latitude=cast(float, reading.latitude),
        longitude=cast(float, reading.longitude),
        gps_altitude=cast(float, reading.gps_altitude),
        gps_satellites=cast(int, reading.gps_satellites),
        gps_valid=cast(bool, reading.gps_valid),
        timestamp=cast(datetime, reading.timestamp),
    )


def _risk_score(reading: SensorReading) -> int:

    return round(
        evaluate_safety(
            _to_sensor_data(reading)
        ).risk_score
    )


def _readings_for_worker(
    db: Session,
    worker_id: str,
    hours: int
):

    return (
        db.query(SensorReading)
        .filter(
            SensorReading.worker_id == worker_id,
            SensorReading.timestamp >= _cutoff(hours),
        )
        .order_by(SensorReading.timestamp.asc())
        .all()
    )


@router.get("/overview")
def analytics_overview(
    hours: int = Query(
        24,
        ge=1,
        le=8760,
        description="Number of hours to analyze"
    ),
    db: Session = Depends(get_db)
):

    cutoff = _cutoff(hours)

    alerts = (
        db.query(Alert)
        .filter(Alert.timestamp >= cutoff)
        .all()
    )

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.timestamp >= cutoff)
        .all()
    )

    risk_scores = [
        _risk_score(reading)
        for reading in readings
    ]

    return {
        "time_window_hours": hours,
        "total_incidents": len(alerts),
        "active_incidents": sum(
            not bool(alert.resolved)
            for alert in alerts
        ),
        "resolved_incidents": sum(
            bool(alert.resolved)
            for alert in alerts
        ),
        "critical_incidents": sum(
            alert.severity == "CRITICAL"
            for alert in alerts
        ),
        "high_incidents": sum(
            alert.severity in ["HIGH", "WARNING"]
            for alert in alerts
        ),
        "moderate_incidents": sum(
            alert.severity == "MODERATE"
            for alert in alerts
        ),
        "average_risk": round(
            sum(risk_scores) / len(risk_scores)
        ) if risk_scores else 0,
        "peak_risk": max(risk_scores) if risk_scores else 0,
        "total_sensor_readings": db.query(
            func.count(SensorReading.id)
        ).filter(
            SensorReading.timestamp >= cutoff
        ).scalar(),
        "active_workers": db.query(
            func.count(Worker.id)
        ).scalar(),
        "active_zones": db.query(
            SensorReading.zone
        ).filter(
            SensorReading.timestamp >= cutoff,
            SensorReading.zone.isnot(None)
        ).distinct().count(),
    }


@router.get("/incidents")
def analytics_incidents(
    hours: int = Query(24, ge=1, le=8760),
    severity: str | None = None,
    worker_id: str | None = None,
    zone: str | None = None,
    resolved: bool | None = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):

    query = db.query(Alert).filter(
        Alert.timestamp >= _cutoff(hours)
    )

    if severity:
        query = query.filter(
            Alert.severity == severity.upper()
        )

    if worker_id:
        query = query.filter(
            Alert.worker_id == worker_id
        )

    if zone:
        query = query.filter(
            Alert.zone == zone
        )

    if resolved is not None:
        query = query.filter(
            Alert.resolved == resolved
        )

    alerts = (
        query
        .order_by(Alert.timestamp.desc())
        .limit(limit)
        .all()
    )

    return {
        "time_window_hours": hours,
        "count": len(alerts),
        "incidents": [
            {
                "id": alert.id,
                "worker_id": alert.worker_id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "risk_score": alert.risk_score,
                "message": alert.message,
                "zone": alert.zone,
                "timestamp": alert.timestamp,
                "resolved": alert.resolved,
            }
            for alert in alerts
        ],
    }


@router.get("/risk-trend")
def analytics_risk_trend(
    worker_id: str | None = None,
    hours: int = Query(24, ge=1, le=8760),
    zone: str | None = None,
    db: Session = Depends(get_db)
):

    query = db.query(SensorReading).filter(
        SensorReading.timestamp >= _cutoff(hours)
    )

    if worker_id:
        query = query.filter(
            SensorReading.worker_id == worker_id
        )

    if zone:
        query = query.filter(
            SensorReading.zone == zone
        )

    readings = query.order_by(
        SensorReading.timestamp.asc()
    ).all()

    return {
        "time_window_hours": hours,
        "count": len(readings),
        "worker_id": worker_id,
        "zone": zone,
        "points": [
            {
                "timestamp": reading.timestamp,
                "worker_id": reading.worker_id,
                "zone": reading.zone,
                "risk_score": _risk_score(reading),
                "status": evaluate_safety(
                    _to_sensor_data(reading)
                ).status,
                "alerts": evaluate_safety(
                    _to_sensor_data(reading)
                ).alerts,
            }
            for reading in readings
        ],
    }


@router.get("/workers/{worker_id}")
def analytics_worker(
    worker_id: str,
    hours: int = Query(24, ge=1, le=8760),
    db: Session = Depends(get_db)
):

    readings = _readings_for_worker(
        db,
        worker_id,
        hours
    )

    risk_scores = [
        _risk_score(reading)
        for reading in readings
    ]

    incidents = (
        db.query(Alert)
        .filter(
            Alert.worker_id == worker_id,
            Alert.timestamp >= _cutoff(hours),
        )
        .order_by(Alert.timestamp.desc())
        .all()
    )

    return {
        "worker_id": worker_id,
        "time_window_hours": hours,
        "worker_found": db.query(Worker).filter(
            Worker.worker_id == worker_id
        ).first() is not None,
        "sensor_readings": len(readings),
        "average_risk": round(
            sum(risk_scores) / len(risk_scores)
        ) if risk_scores else 0,
        "peak_risk": max(risk_scores) if risk_scores else 0,
        "risk_scores": risk_scores,
        "incident_count": len(incidents),
        "total_incidents": len(incidents),
        "critical_incidents": sum(
            incident.severity == "CRITICAL"
            for incident in incidents
        ),
        "high_incidents": sum(
            incident.severity in ["HIGH", "WARNING"]
            for incident in incidents
        ),
        "active_incidents": sum(
            not bool(incident.resolved)
            for incident in incidents
        ),
        "incidents": [
            {
                "id": incident.id,
                "severity": incident.severity,
                "risk_score": incident.risk_score,
                "message": incident.message,
                "zone": incident.zone,
                "timestamp": incident.timestamp,
                "resolved": incident.resolved,
            }
            for incident in incidents
        ],
    }


@router.get("/zones/{zone_id}")
def analytics_zone(
    zone_id: str,
    hours: int = Query(24, ge=1, le=8760),
    db: Session = Depends(get_db)
):

    cutoff = _cutoff(hours)

    readings = (
        db.query(SensorReading)
        .filter(
            SensorReading.zone == zone_id,
            SensorReading.timestamp >= cutoff,
        )
        .order_by(SensorReading.timestamp.asc())
        .all()
    )

    incidents = (
        db.query(Alert)
        .filter(
            Alert.zone == zone_id,
            Alert.timestamp >= cutoff,
        )
        .order_by(Alert.timestamp.desc())
        .all()
    )

    risk_scores = [
        _risk_score(reading)
        for reading in readings
    ]

    return {
        "zone": zone_id,
        "time_window_hours": hours,
        "workers_observed": len({
            cast(str, reading.worker_id)
            for reading in readings
        }),
        "workers": sorted({
            cast(str, reading.worker_id)
            for reading in readings
        }),
        "sensor_readings": len(readings),
        "average_risk": round(
            sum(risk_scores) / len(risk_scores)
        ) if risk_scores else 0,
        "peak_risk": max(risk_scores) if risk_scores else 0,
        "incident_count": len(incidents),
        "total_incidents": len(incidents),
        "critical_incidents": sum(
            incident.severity == "CRITICAL"
            for incident in incidents
        ),
        "high_incidents": sum(
            incident.severity in ["HIGH", "WARNING"]
            for incident in incidents
        ),
        "active_incidents": sum(
            not bool(incident.resolved)
            for incident in incidents
        ),
        "incidents": [
            {
                "id": incident.id,
                "worker_id": incident.worker_id,
                "severity": incident.severity,
                "risk_score": incident.risk_score,
                "message": incident.message,
                "timestamp": incident.timestamp,
                "resolved": incident.resolved,
            }
            for incident in incidents
        ],
    }
