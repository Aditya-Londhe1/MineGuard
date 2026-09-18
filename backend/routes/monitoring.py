from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.database_models import Worker
from backend.reliability.monitoring import get_last_seen_state

router = APIRouter(
    prefix="/api/monitoring",
    tags=["Monitoring"]
)


@router.get("/workers")
def get_worker_monitoring(
    db: Session = Depends(get_db)
):

    workers = (
        db.query(Worker)
        .order_by(Worker.worker_id)
        .all()
    )

    result = []

    for worker in workers:
        monitoring = get_last_seen_state(
            worker.last_seen_at
        )

        result.append({
            "worker_id": worker.worker_id,
            "name": worker.name,
            "zone": worker.zone,
            "safety_status": worker.status,
            "monitoring_state": monitoring["monitoring_state"],
            "last_seen_at": (
                worker.last_seen_at.isoformat()
                if worker.last_seen_at
                else None
            ),
            "last_seen_age_seconds": monitoring[
                "last_seen_age_seconds"
            ],
            "battery": worker.battery,
            "gps": {
                "valid": worker.gps_valid,
                "latitude": worker.latitude,
                "longitude": worker.longitude,
                "altitude": worker.gps_altitude,
                "satellites": worker.gps_satellites,
            },
        })

    return {
        "workers": result
    }
