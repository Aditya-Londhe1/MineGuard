from datetime import datetime, timezone

LIVE_THRESHOLD_SECONDS = 10
STALE_THRESHOLD_SECONDS = 30


def get_monitoring_details(timestamp):
    """Return communication state and sensor data age."""

    if timestamp is None:
        return {
            "monitoring_state": "OFFLINE",
            "data_age_seconds": None,
        }

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    age_seconds = max(
        0,
        (now - timestamp).total_seconds()
    )

    if age_seconds <= LIVE_THRESHOLD_SECONDS:
        state = "LIVE"
    elif age_seconds <= STALE_THRESHOLD_SECONDS:
        state = "STALE"
    else:
        state = "OFFLINE"

    return {
        "monitoring_state": state,
        "data_age_seconds": round(age_seconds, 1),
    }


def get_monitoring_state(timestamp):
    """Return only the monitoring state for compatibility."""

    return get_monitoring_details(timestamp)["monitoring_state"]


def get_last_seen_state(last_seen_at):
    """Determine worker communication state from server last-seen time."""

    if last_seen_at is None:
        return {
            "monitoring_state": "OFFLINE",
            "last_seen_age_seconds": None,
        }

    if last_seen_at.tzinfo is None:
        last_seen_at = last_seen_at.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    age_seconds = max(
        0,
        (now - last_seen_at).total_seconds()
    )

    if age_seconds <= LIVE_THRESHOLD_SECONDS:
        state = "LIVE"
    elif age_seconds <= STALE_THRESHOLD_SECONDS:
        state = "STALE"
    else:
        state = "OFFLINE"

    return {
        "monitoring_state": state,
        "last_seen_age_seconds": round(age_seconds, 1),
    }
