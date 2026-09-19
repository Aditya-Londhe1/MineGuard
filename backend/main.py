from datetime import datetime, timezone

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect
)

from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

from backend.database import (
    get_db,
    engine,
    Base,
    migrate_database,
)

from backend.models.sensor import SensorData

from backend.models.database_models import (
    SensorReading,
    Alert,
    Worker,
    Device,
)

from backend.routes.workers import router as worker_router
from backend.routes.alerts import router as alert_router
from backend.routes.intelligence import router as intelligence_router
from backend.routes.analytics import router as analytics_router
from backend.routes.audit import router as audit_router
from backend.routes.monitoring import router as monitoring_router
from backend.auth.auth import router as auth_router

from backend.safety.engine import evaluate_safety
from backend.safety.prioritization import (
    determine_event_type,
    determine_priority,
)
from backend.safety.audit import record_audit_event
from backend.reliability.monitoring import get_monitoring_details
from backend.reliability.validation import validate_sensor_data
from backend.reliability.device import (
    validate_device_timestamp,
    normalize_timestamp,
)
from backend.reliability.device_registry import validate_device

from backend.realtime.manager import ConnectionManager


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="MineGuard API",
    description="Backend API for MineGuard Smart Mining Safety System",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        # Local development
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # Render frontend
        "https://mineguard-1.onrender.com",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# DATABASE
# =========================================================

migrate_database()


# =========================================================
# REAL-TIME CONNECTION MANAGER
# =========================================================

manager = ConnectionManager()


# =========================================================
# ROUTES
# =========================================================

app.include_router(worker_router)

app.include_router(alert_router)
app.include_router(intelligence_router)
app.include_router(analytics_router)
app.include_router(audit_router)
app.include_router(auth_router)
app.include_router(monitoring_router)


# =========================================================
# BASIC ENDPOINTS
# =========================================================

@app.get("/")
def home():

    return {
        "project": "MineGuard",
        "status": "running",
        "message": "MineGuard backend is operational"
    }


@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


# =========================================================
# SENSOR DATA ENDPOINT
# =========================================================

@app.post("/api/sensor-data")
async def receive_sensor_data(
    data: SensorData,
    db: Session = Depends(get_db)
):

    validation_errors = validate_sensor_data(data)

    if validation_errors:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Invalid sensor data",
                "errors": validation_errors,
            },
        )

    sensor_timestamp = normalize_timestamp(data.timestamp)

    timestamp_error = validate_device_timestamp(
        sensor_timestamp
    )

    if timestamp_error:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Invalid sensor timestamp",
                "error": timestamp_error,
            },
        )

    device_error = validate_device(
        db=db,
        device_id=data.device_id,
        worker_id=data.worker_id,
    )

    if device_error:
        raise HTTPException(
            status_code=403,
            detail={
                "message": "Device validation failed",
                "error": device_error,
            },
        )

    # Device passed validation — record its last communication time.
    device = (
        db.query(Device)
        .filter(Device.device_id == data.device_id)
        .first()
    )

    if device:
        setattr(device, "last_seen_at", datetime.utcnow())

    monitoring_details = get_monitoring_details(data.timestamp)

    server_received_at = datetime.utcnow()

    worker = (
        db.query(Worker)
        .filter(Worker.worker_id == data.worker_id)
        .first()
    )

    if worker is None:
        worker = Worker(
            worker_id=data.worker_id,
            name=f"Worker {data.worker_id}",
            helmet_id=data.device_id,
            zone=data.zone,
            status="SAFE",
            battery=data.battery,
            last_seen_at=server_received_at,
            latitude=data.latitude,
            longitude=data.longitude,
            gps_altitude=data.gps_altitude,
            gps_satellites=data.gps_satellites,
            gps_valid=data.gps_valid,
            created_at=server_received_at,
        )
        db.add(worker)
    else:
        setattr(worker, "last_seen_at", server_received_at)
        setattr(worker, "zone", data.zone)
        setattr(worker, "battery", data.battery)

        if (
            data.gps_valid
            and data.latitude is not None
            and data.longitude is not None
        ):
            setattr(worker, "latitude", data.latitude)
            setattr(worker, "longitude", data.longitude)
            setattr(worker, "gps_altitude", data.gps_altitude)
            setattr(worker, "gps_satellites", data.gps_satellites)
            setattr(worker, "gps_valid", True)
        else:
            setattr(worker, "gps_valid", False)

    monitoring_state = monitoring_details["monitoring_state"]
    data_age_seconds = monitoring_details["data_age_seconds"]

    # -----------------------------------------------------
    # SAVE SENSOR READING
    # -----------------------------------------------------

    reading = SensorReading(

        worker_id=data.worker_id,

        heart_rate=data.heart_rate,

        spo2=data.spo2,

        temperature=data.temperature,

        humidity=data.humidity,

        methane=data.methane,

        co=data.co,

        h2s=data.h2s,

        fall_detected=data.fall_detected,

        sos=data.sos,

        zone=data.zone,

        battery=data.battery,

        latitude=data.latitude,
        longitude=data.longitude,
        gps_altitude=data.gps_altitude,
        gps_satellites=data.gps_satellites,
        gps_valid=data.gps_valid,

        timestamp=data.timestamp
    )

    db.add(reading)


    # -----------------------------------------------------
    # SAFETY ANALYSIS
    # -----------------------------------------------------

    safety_result = evaluate_safety(data)

    setattr(worker, "status", safety_result.status)

    if data.sos:

        safety_result.status = "CRITICAL"

        if "SOS ACTIVATED" not in safety_result.alerts:

            safety_result.alerts.insert(
                0,
                "SOS ACTIVATED"
            )

        safety_result.risk_score = 100

    # -----------------------------------------------------
    # OPERATIONAL EVENT PRIORITIZATION
    # -----------------------------------------------------

    event_type = determine_event_type(data, safety_result)

    event_priority = determine_priority(
        severity=safety_result.status,
        risk_score=safety_result.risk_score,
        event_type=event_type,
        source="SENSOR",
    )


    # -----------------------------------------------------
    # REAL-TIME SENSOR EVENT
    # -----------------------------------------------------

    sensor_event = {

        "type": "sensor_update",

        "worker_id": data.worker_id,

        "device_id": data.device_id,

        "status": safety_result.status,

        "risk_score": safety_result.risk_score,

        "alerts": safety_result.alerts,

        "heart_rate": data.heart_rate,

        "spo2": data.spo2,

        "temperature": data.temperature,

        "methane": data.methane,

        "co": data.co,

        "h2s": data.h2s,

        "fall_detected": data.fall_detected,

        "sos": data.sos,

        "zone": data.zone,

        "battery": data.battery,

        "gps": {
            "latitude": data.latitude,
            "longitude": data.longitude,
            "altitude": data.gps_altitude,
            "satellites": data.gps_satellites,
            "valid": data.gps_valid,
        },

        "timestamp": data.timestamp.isoformat(),
        "monitoring_state": monitoring_state,
        "data_age_seconds": data_age_seconds,
    }

    # -----------------------------------------------------
    # CREATE / UPDATE ALERT
    # -----------------------------------------------------

    if safety_result.status != "SAFE":

        existing_alert = (

            db.query(Alert)

            .filter(
                Alert.worker_id == data.worker_id,
                Alert.resolved.is_(False)
            )

            .order_by(
                Alert.timestamp.desc()
            )

            .first()
        )


        alert_message = ", ".join(
            safety_result.alerts
        )


        # -------------------------------------------------
        # UPDATE EXISTING INCIDENT
        # -------------------------------------------------

        if existing_alert:

            alert = existing_alert

            setattr(
                existing_alert,
                "severity",
                safety_result.status
            )

            setattr(
                existing_alert,
                "risk_score",
                safety_result.risk_score
            )

            setattr(
                existing_alert,
                "message",
                alert_message
            )

            setattr(
                existing_alert,
                "zone",
                data.zone
            )

            setattr(
                existing_alert,
                "timestamp",
                data.timestamp
            )

            setattr(
                existing_alert,
                "event_type",
                event_type
            )

            setattr(
                existing_alert,
                "source",
                "SENSOR"
            )

            setattr(
                existing_alert,
                "priority",
                event_priority
            )

            # Keep acknowledged and reviewed incidents in their current
            # operational state when later sensor readings arrive.
            if existing_alert.event_state not in [
                "ACKNOWLEDGED",
                "UNDER_REVIEW"
            ]:
                existing_alert.event_state = "ACTIVE"


        # -------------------------------------------------
        # CREATE NEW INCIDENT
        # -------------------------------------------------

        else:

            alert = Alert(

                worker_id=data.worker_id,

                alert_type="SAFETY_EVENT",

                event_type=event_type,

                source="SENSOR",

                severity=safety_result.status,

                priority=event_priority,

                risk_score=safety_result.risk_score,

                message=alert_message,

                zone=data.zone,

                timestamp=data.timestamp,

                resolved=False,

                event_state="ACTIVE"
            )

            db.add(alert)
            db.flush()

            record_audit_event(
                db=db,
                alert=alert,
                action="INCIDENT_DETECTED",
                previous_state=None,
                new_state="ACTIVE",
                actor="system",
                details=alert.message,
            )


        # -------------------------------------------------
        # REAL-TIME ALERT EVENT
        # -------------------------------------------------

        alert_event = {

            "type": "alert",

            "id": alert.id,

            "worker_id": data.worker_id,

            "event_type": event_type,

            "source": "SENSOR",

            "priority": event_priority,

            "severity": safety_result.status,

            "risk_score": safety_result.risk_score,

            "alerts": safety_result.alerts,

            "message": alert_message,

            "zone": data.zone,

            "timestamp": data.timestamp.isoformat()
        }


        await manager.broadcast(
            alert_event
        )


    # -----------------------------------------------------
    # SAVE EVERYTHING
    # -----------------------------------------------------

    db.commit()


    # -----------------------------------------------------
    # BROADCAST SENSOR UPDATE
    # -----------------------------------------------------

    await manager.broadcast(
        sensor_event
    )


    # -----------------------------------------------------
    # API RESPONSE
    # -----------------------------------------------------

    return {

        "success": True,

        "worker_id": data.worker_id,

        "device_id": data.device_id,

        "status": safety_result.status,

        "risk_score": safety_result.risk_score,

        "alerts": safety_result.alerts,

        "gps": {
            "latitude": data.latitude,
            "longitude": data.longitude,
            "altitude": data.gps_altitude,
            "satellites": data.gps_satellites,
            "valid": data.gps_valid,
        },

        "server_received_at": server_received_at.isoformat(),
    }


# =========================================================
# WEBSOCKET
# =========================================================

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket
):

    await manager.connect(
        websocket
    )

    try:

        while True:

            await websocket.receive_text()

    except WebSocketDisconnect:

        manager.disconnect(
            websocket
        )
