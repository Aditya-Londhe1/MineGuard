# =========================================================
# MINEGUARD SAFETY RECOMMENDATION ENGINE
# =========================================================

def generate_recommendation(
    current_risk: float,
    predicted_risk: float,
    anomaly_score: float,
    status: str,
    factors: list[dict],
    worker_id: str,
    zone: str,
    latest_reading: str = "",
):
    """
    Generate an explainable recommended action
    based on current and predicted safety conditions.

    This engine provides decision support.
    It does not automatically control equipment
    or initiate evacuation.
    """

    reasons = []

    actions = []

    # =====================================================
    # 1. CRITICAL PREDICTED RISK
    # =====================================================

    if status == "CRITICAL" or predicted_risk >= 80:

        priority = "CRITICAL"

        actions.extend([
            "Immediately assess the worker's condition.",
            "Verify environmental conditions in the worker's zone.",
            "Maintain direct supervisor communication.",
        ])

        reasons.append(
            f"Predicted risk is {predicted_risk}/100."
        )

    # =====================================================
    # 2. HIGH PREDICTED RISK
    # =====================================================

    elif predicted_risk >= 60:

        priority = "HIGH"

        actions.extend([
            "Inspect the worker's current zone.",
            "Verify abnormal sensor readings.",
            "Maintain supervisor awareness of the worker.",
        ])

        reasons.append(
            f"Predicted risk is elevated at "
            f"{predicted_risk}/100."
        )

    # =====================================================
    # 3. MODERATE
    # =====================================================

    elif predicted_risk >= 40:

        priority = "MODERATE"

        actions.extend([
            "Continue monitoring the worker.",
            "Review recent sensor trends.",
        ])

        reasons.append(
            f"Predicted risk is moderate "
            f"at {predicted_risk}/100."
        )

    # =====================================================
    # 4. LOW
    # =====================================================

    else:

        priority = "LOW"

        actions.extend([
            "Continue routine monitoring."
        ])

        reasons.append(
            "No significant near-term risk escalation detected."
        )

    # =====================================================
    # 5. ANOMALY FACTORS
    # =====================================================

    for factor in factors:

        factor_type = factor.get("type")

        sensor = factor.get(
            "sensor",
            ""
        )

        severity = factor.get(
            "severity",
            ""
        )

        # -------------------------------------------------
        # ENVIRONMENTAL
        # -------------------------------------------------

        if factor_type == "environment":

            reasons.append(
                factor.get(
                    "message",
                    "Environmental anomaly detected."
                )
            )

            if sensor in [
                "methane",
                "co",
                "h2s"
            ]:

                actions.append(
                    f"Verify {sensor.upper()} "
                    "conditions in the zone."
                )

        # -------------------------------------------------
        # BIOMETRIC
        # -------------------------------------------------

        elif factor_type == "biometric":

            reasons.append(
                factor.get(
                    "message",
                    "Biometric anomaly detected."
                )
            )

            actions.append(
                "Check the worker's physical condition "
                "and maintain communication."
            )

        # -------------------------------------------------
        # RISK TREND
        # -------------------------------------------------

        elif factor_type == "risk_trend":

            reasons.append(
                factor.get(
                    "message",
                    "Risk trajectory is changing."
                )
            )

    # =====================================================
    # 6. ANOMALY SCORE
    # =====================================================

    if anomaly_score >= 90:

        reasons.append(
            f"Severe anomaly score: "
            f"{anomaly_score}/100."
        )

        if priority == "LOW":

            priority = "HIGH"

    elif anomaly_score >= 70:

        reasons.append(
            f"High anomaly score: "
            f"{anomaly_score}/100."
        )

    # =====================================================
    # 7. REMOVE DUPLICATES
    # =====================================================

    actions = list(
        dict.fromkeys(actions)
    )

    reasons = list(
        dict.fromkeys(reasons)
    )

    risk_change = round(
        predicted_risk - current_risk
    )

    evidence = [
        f"Worker: {worker_id}",
        f"Zone: {zone}",
        f"Risk change: {risk_change:+d} points.",
        f"Predicted risk: {round(predicted_risk)}/100",
    ]

    if latest_reading:

        evidence.append(
            f"Latest reading: {latest_reading}"
        )

    for factor in factors:

        message = factor.get("message")

        if message:

            evidence.append(message)

    # =====================================================
    # 8. LIMIT UI OUTPUT
    # =====================================================

    actions = actions[:5]

    reasons = reasons[:5]

    evidence = list(
        dict.fromkeys(evidence)
    )[:6]

    # =====================================================
    # 9. SUMMARY
    # =====================================================

    if priority == "CRITICAL":

        summary = (
            f"Immediate attention recommended for "
            f"worker {worker_id} in zone {zone}."
        )

    elif priority == "HIGH":

        summary = (
            f"Early intervention recommended for "
            f"worker {worker_id} in zone {zone}."
        )

    elif priority == "MODERATE":

        summary = (
            f"Continue enhanced monitoring of "
            f"worker {worker_id}."
        )

    else:

        summary = (
            f"Worker {worker_id} is currently "
            f"within an acceptable risk trajectory."
        )

    return {

        "worker_id": worker_id,

        "zone": zone,

        "priority": priority,

        "summary": summary,

        "actions": actions,

        "reasons": reasons,

        "evidence": evidence,

        "current_risk": round(
            current_risk
        ),

        "predicted_risk": round(
            predicted_risk
        ),

        "anomaly_score": round(
            anomaly_score
        )
    }
