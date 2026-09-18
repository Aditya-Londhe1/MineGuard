# =========================================================
# MineGuard Alert Prioritization
# =========================================================

DIRECT_CRITICAL_EVENTS = {
    "SOS",
    "FALL_DETECTED",
    "GAS_THRESHOLD",
}


def determine_event_type_from_alerts(alerts):
    """Classify alert messages when raw sensor flags are unavailable."""

    alert_text = " ".join(str(alert).upper() for alert in alerts)

    if "SOS" in alert_text:
        return "SOS"

    if "FALL DETECTED" in alert_text:
        return "FALL_DETECTED"

    if any(gas in alert_text for gas in {"METHANE", "CO", "H2S"}):
        return "GAS_THRESHOLD"

    return "SAFETY_EVENT"


def determine_event_type(sensor_data, safety_result):
    if sensor_data.sos:
        return "SOS"

    if sensor_data.fall_detected:
        return "FALL_DETECTED"

    return determine_event_type_from_alerts(safety_result.alerts)


def determine_priority(severity, risk_score, event_type, source="SENSOR"):
    severity = str(severity).upper()
    event_type = str(event_type).upper()
    source = str(source).upper()

    if event_type in DIRECT_CRITICAL_EVENTS:
        return "P1"

    if source == "SENSOR" and severity == "CRITICAL":
        return "P1"

    if severity == "HIGH":
        return "P2"

    if severity == "WARNING":
        return "P2" if risk_score is not None and risk_score >= 50 else "P3"

    if severity == "MODERATE":
        return "P3"

    if source in {"PREDICTION", "ANOMALY", "INTELLIGENCE"}:
        return "P2" if risk_score is not None and risk_score >= 70 else "P3"

    return "P4"
