def validate_sensor_data(data):
    """Return validation error codes for physically invalid sensor values."""

    errors = []

    if data.heart_rate is not None:
        if data.heart_rate < 40 or data.heart_rate > 180:
            errors.append("heart_rate_out_of_range")

    if data.spo2 is not None:
        if not 0 <= data.spo2 <= 100:
            errors.append("spo2_out_of_range")

    if data.temperature is not None:
        if not -50 <= data.temperature <= 100:
            errors.append("temperature_out_of_range")

    if data.humidity is not None:
        if not 0 <= data.humidity <= 100:
            errors.append("humidity_out_of_range")

    if data.methane is not None and data.methane < 0:
        errors.append("methane_invalid")

    if data.co is not None:
        if data.co < 0:
            errors.append("co_invalid")

    if data.h2s is not None:
        if data.h2s < 0:
            errors.append("h2s_invalid")

    if data.battery is not None:
        if data.battery < 0:
            errors.append("battery_invalid")

    return errors
