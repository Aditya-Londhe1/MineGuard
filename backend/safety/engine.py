from dataclasses import dataclass


@dataclass
class SafetyResult:

    status: str
    risk_score: int
    alerts: list[str]


def evaluate_safety(data) -> SafetyResult:

    risk_score = 0
    alerts = []

    # -------------------------
    # GAS CONDITIONS
    # -------------------------
    # IMPORTANT:
    # data.methane currently contains MQ-4 SENSOR VOLTAGE,
    # NOT calibrated methane concentration in ppm.
    #
    # These are prototype voltage thresholds and must not
    # be presented as certified methane ppm limits.
    MQ4_WARNING_VOLTAGE = 1.50
    MQ4_CRITICAL_VOLTAGE = 2.00

    if data.methane >= MQ4_CRITICAL_VOLTAGE:
        risk_score += 70
        alerts.append("CRITICAL METHANE/GAS LEVEL")

    elif data.methane >= MQ4_WARNING_VOLTAGE:
        risk_score += 35
        alerts.append("HIGH METHANE/GAS LEVEL")


    if data.co is not None:
        if data.co >= 50:
            risk_score += 30
            alerts.append("CRITICAL CO LEVEL")

        elif data.co >= 35:
            risk_score += 20
            alerts.append("HIGH CO LEVEL")

        elif data.co >= 25:
            risk_score += 10
            alerts.append("ELEVATED CO")


    if data.h2s is not None:
        if data.h2s >= 15:
            risk_score += 35
            alerts.append("CRITICAL H2S LEVEL")

        elif data.h2s >= 10:
            risk_score += 20
            alerts.append("HIGH H2S LEVEL")

        elif data.h2s >= 5:
            risk_score += 10
            alerts.append("ELEVATED H2S")


    # -------------------------
    # HEALTH CONDITIONS
    # -------------------------

    if data.heart_rate is not None:
        if data.heart_rate >= 120:
            risk_score += 20
            alerts.append("HIGH HEART RATE")

        elif data.heart_rate >= 110:
            risk_score += 10
            alerts.append("ELEVATED HEART RATE")


    if data.spo2 is not None:
        if data.spo2 < 90:
            risk_score += 25
            alerts.append("CRITICAL SpO2")

        elif data.spo2 < 94:
            risk_score += 15
            alerts.append("LOW SpO2")


    # -------------------------
    # TEMPERATURE
    # -------------------------

    if data.temperature >= 40:
        risk_score += 20
        alerts.append("CRITICAL TEMPERATURE")

    elif data.temperature >= 35:
        risk_score += 10
        alerts.append("HIGH TEMPERATURE")


    # -------------------------
    # FALL
    # -------------------------

    if data.fall_detected:

        risk_score += 40
        alerts.append("FALL DETECTED")


    # -------------------------
    # SOS
    # -------------------------

    if data.sos:

        risk_score = 100
        alerts.append("MANUAL SOS ACTIVATED")


    # -------------------------
    # LIMIT SCORE
    # -------------------------

    risk_score = min(risk_score, 100)


    # -------------------------
    # FINAL STATUS
    # -------------------------

    if risk_score >= 70:

        status = "CRITICAL"

    elif risk_score >= 30:

        status = "WARNING"

    else:

        status = "SAFE"


    return SafetyResult(
        status=status,
        risk_score=risk_score,
        alerts=alerts
    )