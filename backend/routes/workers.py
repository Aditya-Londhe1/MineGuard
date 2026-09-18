from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database import get_db
from backend.models.database_models import SensorReading, Worker
from backend.reliability.monitoring import get_monitoring_details
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/workers",
    tags=["Workers"]
)


@router.get("/")
def get_workers(db: Session = Depends(get_db)):

    workers = db.query(Worker).all()

    result = []

    for worker in workers:
        latest_reading = (
            db.query(SensorReading)
            .filter(SensorReading.worker_id == worker.worker_id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )

        worker_data = {
            column.name: getattr(worker, column.name)
            for column in Worker.__table__.columns
        }

        if latest_reading:
            for field in [
                "heart_rate",
                "spo2",
                "temperature",
                "humidity",
                "methane",
                "co",
                "h2s",
                "fall_detected",
                "sos",
                "zone",
                "battery",
                "latitude",
                "longitude",
                "gps_altitude",
                "gps_satellites",
                "gps_valid",
                "timestamp",
            ]:
                worker_data[field] = getattr(latest_reading, field)

            # Computed server-side (server clock only) so the frontend
            # never has to diff a device timestamp against the browser clock.
            monitoring_details = get_monitoring_details(latest_reading.timestamp)
            worker_data["data_age_seconds"] = monitoring_details["data_age_seconds"]
            worker_data["monitoring_state"] = monitoring_details["monitoring_state"]
        else:
            worker_data["data_age_seconds"] = None
            worker_data["monitoring_state"] = "OFFLINE"

        result.append(worker_data)

    return result
class WorkerCreate(BaseModel):

    worker_id: str
    name: str
    helmet_id: str
    zone: str


@router.post("/")
def create_worker(
    worker: WorkerCreate,
    db: Session = Depends(get_db)
):

    new_worker = Worker(

        worker_id=worker.worker_id,

        name=worker.name,

        helmet_id=worker.helmet_id,

        zone=worker.zone,

        status="SAFE",

        battery=100,

        created_at=datetime.now()
    )

    db.add(new_worker)

    db.commit()

    db.refresh(new_worker)

    return new_worker