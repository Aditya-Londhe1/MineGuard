from datetime import datetime, timedelta, timezone

MAX_CLOCK_SKEW_SECONDS = 60
MAX_FUTURE_TIMESTAMP_SECONDS = 10


def validate_device_timestamp(timestamp):
    """
    Validate a sensor timestamp against server time.

    Returns:
        None if valid
        Error message if invalid
    """

    if timestamp is None:
        return "Sensor timestamp is required"

    sensor_time = timestamp

    if sensor_time.tzinfo is None:
        sensor_time = sensor_time.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)

    if sensor_time > now + timedelta(seconds=10):
        return "Sensor timestamp is too far in the future"

    age_seconds = (now - sensor_time).total_seconds()

    if age_seconds > MAX_CLOCK_SKEW_SECONDS:
        return "Sensor timestamp is too old"

    return None


def normalize_timestamp(timestamp):
    """Convert timestamp to UTC-aware datetime."""

    if timestamp is None:
        return None

    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=timezone.utc)

    return timestamp.astimezone(timezone.utc)
