from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.database_models import Alert, SafetyEventAudit

router = APIRouter(
    prefix="/api/audit",
    tags=["Safety Audit"]
)


@router.get("/incident/{alert_id}")
def get_incident_audit(
    alert_id: int,
    db: Session = Depends(get_db)
):

    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    records = (
        db.query(SafetyEventAudit)
        .filter(
            SafetyEventAudit.alert_id == alert_id
        )
        .order_by(
            SafetyEventAudit.timestamp.asc()
        )
        .all()
    )

    return {
        "alert_id": alert_id,
        "worker_id": alert.worker_id,
        "zone": alert.zone,
        "event_state": alert.event_state,
        "audit": [
            {
                "id": record.id,
                "action": record.action,
                "previous_state": record.previous_state,
                "new_state": record.new_state,
                "actor": record.actor,
                "timestamp": record.timestamp,
                "details": record.details,
            }
            for record in records
        ],
    }
