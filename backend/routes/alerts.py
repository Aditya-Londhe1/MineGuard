from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.database_models import Alert
from backend.safety.audit import record_audit_event


router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts"]
)


class ResolutionRequest(BaseModel):
    resolved_by: str = "supervisor"
    resolution_note: str


def _get_alert_or_404(alert_id: int, db: Session) -> Alert:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return alert


# =========================================================
# GET ALERTS
# =========================================================

@router.get("/")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).all()

    return [
        {
            "id": alert.id,
            "worker_id": alert.worker_id,
            "alert_type": alert.alert_type,
            "event_type": alert.event_type,
            "source": alert.source,
            "severity": alert.severity,
            "priority": alert.priority,
            "risk_score": alert.risk_score,
            "message": alert.message,
            "zone": alert.zone,
            "timestamp": alert.timestamp,
            "resolved": alert.resolved,
            "event_state": alert.event_state,
            "acknowledgement": {
                "status": (
                    "ACKNOWLEDGED"
                    if alert.acknowledged_at
                    else "PENDING"
                ),
                "acknowledged_at": alert.acknowledged_at,
                "acknowledged_by": alert.acknowledged_by,
            },
            "acknowledged_at": alert.acknowledged_at,
            "acknowledged_by": alert.acknowledged_by,
            "under_review_at": alert.under_review_at,
            "under_review_by": alert.under_review_by,
            "resolved_at": alert.resolved_at,
            "resolved_by": alert.resolved_by,
            "resolution_note": alert.resolution_note,
            "resolution": {
                "status": "RESOLVED" if alert.resolved else "PENDING",
                "resolved_at": alert.resolved_at,
                "resolved_by": alert.resolved_by,
                "resolution_note": alert.resolution_note,
            },
        }
        for alert in alerts
    ]


# =========================================================
# INCIDENT RESPONSE QUEUE
# =========================================================

@router.get("/response/queue")
def get_response_queue(db: Session = Depends(get_db)):
    alerts = (
        db.query(Alert)
        .filter(Alert.resolved.is_(False))
        .order_by(Alert.timestamp.desc())
        .all()
    )

    priority_order = {
        "P1": 1,
        "P2": 2,
        "P3": 3,
        "P4": 4,
    }

    alerts.sort(
        key=lambda alert: (
            priority_order.get(alert.priority, 99),
            -(alert.risk_score or 0),
            -(alert.timestamp.timestamp() if alert.timestamp else 0),
        )
    )

    return [
        {
            "id": alert.id,
            "worker_id": alert.worker_id,
            "zone": alert.zone,
            "event_type": alert.event_type,
            "source": alert.source,
            "severity": alert.severity,
            "priority": alert.priority,
            "risk_score": alert.risk_score,
            "message": alert.message,
            "event_state": alert.event_state,
            "acknowledgement": {
                "status": (
                    "ACKNOWLEDGED"
                    if alert.acknowledged_at
                    else "PENDING"
                ),
                "acknowledged_at": alert.acknowledged_at,
                "acknowledged_by": alert.acknowledged_by,
            },
            "timestamp": alert.timestamp,
            "acknowledged_at": alert.acknowledged_at,
            "acknowledged_by": alert.acknowledged_by,
            "under_review_at": alert.under_review_at,
            "under_review_by": alert.under_review_by,
            "resolution": {
                "status": "RESOLVED" if alert.resolved else "PENDING",
                "resolved_at": alert.resolved_at,
                "resolved_by": alert.resolved_by,
                "resolution_note": alert.resolution_note,
            },
        }
        for alert in alerts
    ]


# =========================================================
# GET INCIDENT BY ID
# =========================================================

@router.get("/{alert_id}")
def get_incident(alert_id: int, db: Session = Depends(get_db)):
    alert = _get_alert_or_404(alert_id, db)

    return {
        "id": alert.id,
        "worker_id": alert.worker_id,
        "zone": alert.zone,
        "event_type": alert.event_type,
        "source": alert.source,
        "alert_type": alert.alert_type,
        "severity": alert.severity,
        "priority": alert.priority,
        "risk_score": alert.risk_score,
        "message": alert.message,
        "event_state": alert.event_state,
        "acknowledgement": {
            "status": (
                "ACKNOWLEDGED"
                if alert.acknowledged_at
                else "PENDING"
            ),
            "acknowledged_at": alert.acknowledged_at,
            "acknowledged_by": alert.acknowledged_by,
        },
        "timestamp": alert.timestamp,
        "acknowledged_at": alert.acknowledged_at,
        "acknowledged_by": alert.acknowledged_by,
        "under_review_at": alert.under_review_at,
        "under_review_by": alert.under_review_by,
        "resolved": alert.resolved,
        "resolved_at": alert.resolved_at,
        "resolved_by": alert.resolved_by,
        "resolution_note": alert.resolution_note,
        "resolution": {
            "status": "RESOLVED" if alert.resolved else "PENDING",
            "resolved_at": alert.resolved_at,
            "resolved_by": alert.resolved_by,
            "resolution_note": alert.resolution_note,
        },
    }


# =========================================================
# ACKNOWLEDGE ALERT
# =========================================================

@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = _get_alert_or_404(alert_id, db)

    if alert.resolved:
        raise HTTPException(
            status_code=400,
            detail="Resolved alert cannot be acknowledged"
        )

    if alert.event_state == "ACKNOWLEDGED":
        return {
            "success": True,
            "message": "Incident already acknowledged",
            "alert_id": alert.id,
            "event_state": alert.event_state,
            "acknowledged_at": alert.acknowledged_at,
            "acknowledged_by": alert.acknowledged_by,
            "resolved": alert.resolved,
        }

    if alert.event_state == "UNDER_REVIEW":
        raise HTTPException(
            status_code=400,
            detail="Incident is already under review"
        )

    if alert.event_state != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="Only ACTIVE incidents can be acknowledged"
        )

    alert.event_state = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.utcnow()
    # Temporary operational identity until authentication is available.
    alert.acknowledged_by = "supervisor"

    record_audit_event(
        db=db,
        alert=alert,
        action="INCIDENT_ACKNOWLEDGED",
        previous_state="ACTIVE",
        new_state="ACKNOWLEDGED",
        actor=alert.acknowledged_by or "supervisor",
        details="Incident acknowledged by supervisor",
    )

    db.commit()
    db.refresh(alert)

    return {
        "success": True,
        "message": "Incident acknowledged",
        "alert_id": alert.id,
        "event_state": alert.event_state,
        "acknowledged_at": alert.acknowledged_at,
        "acknowledged_by": alert.acknowledged_by,
        "resolved": alert.resolved,
    }


# =========================================================
# MOVE ALERT TO UNDER REVIEW
# =========================================================

@router.patch("/{alert_id}/under-review")
def mark_under_review(alert_id: int, db: Session = Depends(get_db)):
    alert = _get_alert_or_404(alert_id, db)

    if alert.resolved:
        raise HTTPException(
            status_code=400,
            detail="Resolved alert cannot be reviewed"
        )

    if alert.event_state != "ACKNOWLEDGED":
        raise HTTPException(
            status_code=400,
            detail="Alert must be acknowledged before review"
        )

    previous_state = alert.event_state

    alert.event_state = "UNDER_REVIEW"
    alert.under_review_at = datetime.utcnow()
    # Temporary operational identity until authentication is available.
    alert.under_review_by = "supervisor"

    record_audit_event(
        db=db,
        alert=alert,
        action="INCIDENT_REVIEW_STARTED",
        previous_state=previous_state,
        new_state="UNDER_REVIEW",
        actor=alert.under_review_by or "supervisor",
        details="Incident investigation started",
    )

    db.commit()
    db.refresh(alert)

    return {
        "success": True,
        "message": "Incident moved to under review",
        "alert_id": alert.id,
        "event_state": alert.event_state,
        "under_review_at": alert.under_review_at,
        "under_review_by": alert.under_review_by,
    }


# =========================================================
# RESOLVE ALERT
# =========================================================

@router.patch("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    request: ResolutionRequest,
    db: Session = Depends(get_db)
):
    alert = _get_alert_or_404(alert_id, db)

    if alert.resolved or alert.event_state == "RESOLVED":
        raise HTTPException(
            status_code=400,
            detail="Incident is already resolved"
        )

    if alert.event_state not in ["ACKNOWLEDGED", "UNDER_REVIEW"]:
        raise HTTPException(
            status_code=400,
            detail="Incident must be acknowledged or under review before resolution"
        )

    note = request.resolution_note.strip()

    if not note:
        raise HTTPException(
            status_code=400,
            detail="Resolution note is required"
        )

    previous_state = alert.event_state

    alert.event_state = "RESOLVED"
    alert.resolved = True
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = request.resolved_by.strip() or "supervisor"
    alert.resolution_note = note

    record_audit_event(
        db=db,
        alert=alert,
        action="INCIDENT_RESOLVED",
        previous_state=previous_state,
        new_state="RESOLVED",
        actor=alert.resolved_by or "supervisor",
        details=alert.resolution_note,
    )

    db.commit()
    db.refresh(alert)

    return {
        "success": True,
        "message": "Incident resolved",
        "alert_id": alert.id,
        "event_state": alert.event_state,
        "resolved": alert.resolved,
        "resolved_at": alert.resolved_at,
        "resolved_by": alert.resolved_by,
        "resolution_note": alert.resolution_note,
    }
