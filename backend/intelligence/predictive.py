from statistics import mean

# =========================================================
# PREDICTIVE RISK ENGINE
# =========================================================

def predict_risk(
    current_risk: float,
    risk_scores: list[float],
    anomaly_score: float,
    anomaly_results: list[dict],
):
    """
    Estimate near-term risk using:
    - current risk
    - recent risk trajectory
    - anomaly score
    - sensor anomalies

    This is an explainable heuristic model for MVP/demo use.
    """

    factors = []

    predicted_risk = float(current_risk)

    # =====================================================
    # 1. RISK TREND
    # =====================================================

    trend_change = 0

    if len(risk_scores) >= 2:

        recent = risk_scores[-5:]

        if len(recent) >= 2:

            first = recent[0]
            last = recent[-1]

            trend_change = last - first

    if trend_change >= 20:

        predicted_risk += 15

        factors.append({
            "type": "risk_trend",
            "severity": "HIGH",
            "message": "Risk is increasing rapidly"
        })

    elif trend_change >= 10:

        predicted_risk += 10

        factors.append({
            "type": "risk_trend",
            "severity": "MODERATE",
            "message": "Risk is steadily increasing"
        })

    elif trend_change >= 5:

        predicted_risk += 5

        factors.append({
            "type": "risk_trend",
            "severity": "LOW",
            "message": "Risk shows an upward trend"
        })

    elif trend_change <= -10:

        predicted_risk -= 5

        factors.append({
            "type": "risk_trend",
            "severity": "POSITIVE",
            "message": "Risk is decreasing"
        })

    # =====================================================
    # 2. ANOMALY SCORE
    # =====================================================

    if anomaly_score >= 90:

        predicted_risk += 15

        factors.append({
            "type": "anomaly",
            "severity": "SEVERE",
            "message": "Severe sensor anomaly detected"
        })

    elif anomaly_score >= 70:

        predicted_risk += 10

        factors.append({
            "type": "anomaly",
            "severity": "HIGH",
            "message": "Significant sensor anomaly detected"
        })

    elif anomaly_score >= 45:

        predicted_risk += 5

        factors.append({
            "type": "anomaly",
            "severity": "MODERATE",
            "message": "Moderate sensor anomaly detected"
        })

    # =====================================================
    # 3. SPECIFIC SENSOR FACTORS
    # =====================================================

    for anomaly in anomaly_results:

        if not anomaly.get("anomaly"):

            continue

        sensor = anomaly.get(
            "sensor",
            "unknown"
        )

        severity = anomaly.get(
            "severity",
            "MODERATE"
        )

        # Environmental sensors deserve
        # stronger predictive weight.

        if sensor in [
            "methane",
            "co",
            "h2s"
        ]:

            if severity == "SEVERE":

                predicted_risk += 10

            elif severity == "HIGH":

                predicted_risk += 7

            else:

                predicted_risk += 3

            factors.append({
                "type": "environment",
                "sensor": sensor,
                "severity": severity,
                "message":
                    f"{sensor.upper()} is behaving abnormally"
            })

        elif sensor in [
            "heart_rate",
            "spo2"
        ]:

            if severity == "SEVERE":

                predicted_risk += 8

            elif severity == "HIGH":

                predicted_risk += 5

            else:

                predicted_risk += 2

            factors.append({
                "type": "biometric",
                "sensor": sensor,
                "severity": severity,
                "message":
                    f"{sensor.replace('_', ' ').title()} shows abnormal behavior"
            })

        elif sensor == "temperature":

            if severity == "SEVERE":

                predicted_risk += 5

            elif severity == "HIGH":

                predicted_risk += 3

            else:

                predicted_risk += 1

            factors.append({
                "type": "temperature",
                "sensor": sensor,
                "severity": severity,
                "message":
                    "Temperature shows abnormal behavior"
            })

    # =====================================================
    # LIMIT SCORE
    # =====================================================

    predicted_risk = max(
        0,
        min(
            100,
            round(predicted_risk)
        )
    )

    # =====================================================
    # PREDICTION STATUS
    # =====================================================

    if predicted_risk >= 80:

        status = "CRITICAL"

        message = (
            "Worker is showing a strong "
            "trajectory toward a dangerous state."
        )

    elif predicted_risk >= 60:

        status = "HIGH"

        message = (
            "Worker risk is increasing "
            "and may require early intervention."
        )

    elif predicted_risk >= 40:

        status = "MODERATE"

        message = (
            "Worker shows moderate "
            "near-term risk."
        )

    else:

        status = "LOW"

        message = (
            "No significant near-term "
            "risk escalation detected."
        )

    return {

        "current_risk": round(
            current_risk
        ),

        "predicted_risk":
            predicted_risk,

        "status":
            status,

        "trend_change":
            round(
                trend_change,
                2
            ),

        "anomaly_score":
            anomaly_score,

        "factors":
            factors,

        "message":
            message
    }
