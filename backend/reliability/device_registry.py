from backend.models.database_models import Device


def validate_device(db, device_id, worker_id):
    """
    Validate a physical device against its database registration.

    Returns:
        None if valid
        Error message otherwise
    """

    if not device_id:
        return "Device ID is required"

    device = (
        db.query(Device)
        .filter(Device.device_id == device_id)
        .first()
    )

    if device is None:
        return "Unknown device"

    if not device.enabled:
        return "Device is disabled"

    if device.worker_id != worker_id:
        return "Device is not assigned to this worker"

    return None
