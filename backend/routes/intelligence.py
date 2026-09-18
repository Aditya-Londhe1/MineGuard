from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import cast
from datetime import datetime

from backend.database import get_db
from backend.models.database_models import SensorReading

from backend.safety.engine import evaluate_safety

from backend.models.sensor import SensorData

from backend.intelligence.risk import (
    calculate_risk_trend
)

from backend.intelligence.anomaly import (
    analyze_worker_anomalies
)

from backend.intelligence.predictive import (
    predict_risk
)

from backend.intelligence.recommendation import (
    generate_recommendation
)

router = APIRouter(
    prefix="/api/intelligence",
    tags=["Intelligence"]
)


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

        timestamp=cast(datetime, reading.timestamp)
    )


def _get_worker_readings(
    db: Session,
    worker_id: str
):

    readings = (

        db.query(SensorReading)

        .filter(
            SensorReading.worker_id == worker_id
        )

        .order_by(
            SensorReading.timestamp.desc()
        )

        .limit(50)

        .all()
    )

    readings.reverse()

    return readings


def _build_worker_intelligence(
    readings,
    worker_id: str
):

    if not readings:

        return {
            "worker_id": worker_id,
            "risk": {
                "worker_id": worker_id,
                "risk_scores": [],
                "trend": calculate_risk_trend([]),
            },
            "anomalies": {
                "worker_id": worker_id,
                "status": "NORMAL",
                "score": 0,
                "anomalies": [],
                "sensor_results": [],
            },
            "prediction": {
                "worker_id": worker_id,
                "current_risk": 0,
                "predicted_risk": 0,
                "status": "LOW",
                "trend_change": 0,
                "anomaly_score": 0,
                "factors": [],
                "message": "No telemetry available",
            },
            "recommendation": generate_recommendation(
                current_risk=0,
                predicted_risk=0,
                anomaly_score=0,
                status="LOW",
                factors=[],
                worker_id=worker_id,
                zone="UNKNOWN",
            ),
        }

    current = readings[-1]
    history = readings[:-1]

    risk_scores = []

    for reading in readings:

        safety_result = evaluate_safety(
            _to_sensor_data(reading)
        )

        risk_scores.append(
            safety_result.risk_score
        )

    anomaly_data = analyze_worker_anomalies(
        history,
        current
    )

    prediction = predict_risk(
        current_risk=risk_scores[-1],
        risk_scores=risk_scores,
        anomaly_score=anomaly_data["score"],
        anomaly_results=anomaly_data["sensor_results"],
    )

    zone = cast(str, current.zone)

    recommendation = generate_recommendation(
        current_risk=risk_scores[-1],
        predicted_risk=prediction["predicted_risk"],
        anomaly_score=anomaly_data["score"],
        status=prediction["status"],
        factors=prediction["factors"],
        worker_id=worker_id,
        zone=zone,
    )

    return {
        "worker_id": worker_id,
        "risk": {
            "worker_id": worker_id,
            "risk_scores": risk_scores,
            "trend": calculate_risk_trend(risk_scores),
        },
        "anomalies": {
            "worker_id": worker_id,
            **anomaly_data,
        },
        "prediction": {
            "worker_id": worker_id,
            **prediction,
        },
        "recommendation": recommendation,
    }


@router.get("/risk/{worker_id}")
def worker_risk_history(
    worker_id: str,
    db: Session = Depends(get_db)
):

    readings = _get_worker_readings(
        db,
        worker_id
    )

    risk_scores = []

    for reading in readings:

        sensor = _to_sensor_data(reading)

        result = evaluate_safety(sensor)

        risk_scores.append(
            result.risk_score
        )

    trend = calculate_risk_trend(
        risk_scores
    )

    return {

        "worker_id": worker_id,

        "risk_scores": risk_scores,

        "trend": trend
    }


@router.get("/anomalies/{worker_id}")
def worker_anomalies(
    worker_id: str,
    db: Session = Depends(get_db)
):

    readings = _get_worker_readings(
        db,
        worker_id
    )

    if not readings:

        return {
            "worker_id": worker_id,
            "status": "NORMAL",
            "score": 0,
            "anomalies": [],
            "sensor_results": []
        }

    current = readings[-1]

    history = readings[:-1]

    result = analyze_worker_anomalies(
        history,
        current
    )

    return {

        "worker_id": worker_id,

        **result
    }


@router.get("/prediction/{worker_id}")
def worker_risk_prediction(
    worker_id: str,
    db: Session = Depends(get_db)
):

    readings = _get_worker_readings(
        db,
        worker_id
    )

    if not readings:

        return {
            "worker_id": worker_id,
            "current_risk": 0,
            "predicted_risk": 0,
            "status": "LOW",
            "trend_change": 0,
            "anomaly_score": 0,
            "factors": [],
            "message": "No telemetry available"
        }

    # =====================================================
    # CURRENT READING
    # =====================================================

    current = readings[-1]

    # =====================================================
    # BUILD SENSOR DATA
    # =====================================================

    def to_sensor_data(reading):

        return SensorData(

            worker_id=reading.worker_id,

            heart_rate=reading.heart_rate,

            spo2=reading.spo2,

            temperature=reading.temperature,

            humidity=reading.humidity,

            methane=reading.methane,

            co=reading.co,

            h2s=reading.h2s,

            fall_detected=reading.fall_detected,

            sos=reading.sos,

            zone=reading.zone,

            battery=reading.battery,

            latitude=reading.latitude,

            longitude=reading.longitude,

            gps_altitude=reading.gps_altitude,

            gps_satellites=reading.gps_satellites,

            gps_valid=reading.gps_valid,

            timestamp=reading.timestamp
        )

    # =====================================================
    # CALCULATE RISK HISTORY
    # =====================================================

    risk_scores = []

    for reading in readings:

        sensor = to_sensor_data(
            reading
        )

        result = evaluate_safety(
            sensor
        )

        risk_scores.append(
            result.risk_score
        )

    current_risk = risk_scores[-1]

    current_status = evaluate_safety(
        _to_sensor_data(current)
    ).status

    # =====================================================
    # ANOMALY ANALYSIS
    # =====================================================

    history = readings[:-1]

    anomaly_data = analyze_worker_anomalies(
        history,
        current
    )

    # =====================================================
    # PREDICTION
    # =====================================================

    prediction = predict_risk(

        current_risk=current_risk,

        risk_scores=risk_scores,

        anomaly_score=anomaly_data["score"],

        anomaly_results=
            anomaly_data["sensor_results"]
    )

    recommendation = generate_recommendation(
        current_risk=current_risk,
        predicted_risk=prediction["predicted_risk"],
        anomaly_score=prediction["anomaly_score"],
        status=current_status,
        factors=prediction["factors"],
        worker_id=worker_id,
        zone=cast(str, current.zone),
        latest_reading=str(current.timestamp),
    )

    return {

        "worker_id":
            worker_id,

        **prediction,
        "recommendation": recommendation,
    }


@router.get("/recommendation/{worker_id}")
def worker_recommendation(
    worker_id: str,
    db: Session = Depends(get_db)
):

    readings = _get_worker_readings(
        db,
        worker_id
    )

    if not readings:

        return {
            "worker_id": worker_id,
            "zone": "UNKNOWN",
            "priority": "LOW",
            "summary": "No telemetry available.",
            "actions": [],
            "reasons": [],
            "current_risk": 0,
            "predicted_risk": 0,
            "anomaly_score": 0
        }

    current = readings[-1]

    history = readings[:-1]

    # =====================================================
    # CALCULATE RISK HISTORY
    # =====================================================

    risk_scores = []

    for reading in readings:

        sensor = _to_sensor_data(reading)

        safety_result = evaluate_safety(
            sensor
        )

        risk_scores.append(
            safety_result.risk_score
        )

    current_risk = risk_scores[-1]

    current_status = evaluate_safety(
        _to_sensor_data(current)
    ).status

    # =====================================================
    # ANOMALY
    # =====================================================

    anomaly_data = analyze_worker_anomalies(
        history,
        current
    )

    # =====================================================
    # PREDICTION
    # =====================================================

    prediction = predict_risk(

        current_risk=current_risk,

        risk_scores=risk_scores,

        anomaly_score=anomaly_data["score"],

        anomaly_results=
            anomaly_data["sensor_results"]
    )

    # =====================================================
    # RECOMMENDATION
    # =====================================================

    recommendation = generate_recommendation(

        current_risk=current_risk,

        predicted_risk=
            prediction["predicted_risk"],

        anomaly_score=
            anomaly_data["score"],

        status=
            current_status,

        factors=
            prediction["factors"],

        worker_id=
            worker_id,

        zone=
            cast(str, current.zone),

        latest_reading=
            str(current.timestamp)
    )

    return recommendation


@router.get("/worker/{worker_id}")
def worker_intelligence(
    worker_id: str,
    db: Session = Depends(get_db)
):

    readings = _get_worker_readings(
        db,
        worker_id
    )

    return _build_worker_intelligence(
        readings,
        worker_id
    )
