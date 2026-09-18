from datetime import datetime

from backend.models.database_models import SafetyEventAudit


def record_audit_event(
    db,
    alert,
    action,
    previous_state=None,
    new_state=None,
    actor="system",
    details=None,
):
    audit = SafetyEventAudit(
        alert_id=alert.id,
        worker_id=alert.worker_id,
        zone=alert.zone,
        action=action,
        previous_state=previous_state,
        new_state=new_state,
        actor=actor,
        timestamp=datetime.utcnow(),
        details=details,
    )

    db.add(audit)

    return audit
