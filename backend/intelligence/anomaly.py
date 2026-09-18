from statistics import mean, stdev

# =========================================================
# SINGLE SENSOR ANOMALY
# =========================================================

def detect_sensor_anomaly(
    values: list[float | None],
    current_value: float | None,
    sensor_name: str,
):
    """
    Detect whether the current reading is unusual
    compared with recent historical readings.
    """

    if current_value is None:
        return {
            "sensor": sensor_name,
            "anomaly": False,
            "severity": "NORMAL",
            "score": 0,
            "message": "No current reading",
        }

    baseline = [value for value in values if value is not None][-10:]

    # Need enough numeric history to establish a baseline.
    if len(baseline) < 5:

        return {
            "sensor": sensor_name,
            "anomaly": False,
            "severity": "NORMAL",
            "score": 0,
            "message": "Insufficient history"
        }

    average = mean(baseline)

    deviation = stdev(baseline)

    # Avoid division by zero
    if deviation == 0:

        deviation = max(
            abs(average) * 0.05,
            1
        )

    z_score = (
        current_value - average
    ) / deviation

    absolute_change = (
        current_value - average
    )

    percentage_change = (
        absolute_change /
        max(abs(average), 1)
    ) * 100

    # =====================================================
    # SEVERITY
    # =====================================================

    if abs(z_score) >= 3:

        severity = "SEVERE"

        anomaly = True

        score = 90

    elif abs(z_score) >= 2:

        severity = "HIGH"

        anomaly = True

        score = 70

    elif abs(z_score) >= 1.5:

        severity = "MODERATE"

        anomaly = True

        score = 45

    else:

        severity = "NORMAL"

        anomaly = False

        score = 0

    if anomaly:

        direction = (
            "increased"
            if current_value > average
            else "decreased"
        )

        message = (
            f"{sensor_name} {direction} "
            f"abnormally compared with recent readings"
        )

    else:

        message = (
            f"{sensor_name} is within "
            f"its normal variation"
        )

    return {

        "sensor": sensor_name,

        "anomaly": anomaly,

        "severity": severity,

        "score": score,

        "current": round(
            current_value,
            2
        ),

        "baseline": round(
            average,
            2
        ),

        "change_percent": round(
            percentage_change,
            2
        ),

        "z_score": round(
            z_score,
            2
        ),

        "message": message
    }

# =========================================================
# WORKER ANOMALY ANALYSIS
# =========================================================

def analyze_worker_anomalies(
    history: list,
    current
):
    """
    Analyze multiple sensor dimensions
    for a worker.
    """

    results = []

    sensors = {

        "methane": [
            row.methane
            for row in history
        ],

        "co": [
            row.co
            for row in history
        ],

        "h2s": [
            row.h2s
            for row in history
        ],

        "heart_rate": [
            row.heart_rate
            for row in history
        ],

        "spo2": [
            row.spo2
            for row in history
        ],

        "temperature": [
            row.temperature
            for row in history
        ],
    }

    current_values = {

        "methane":
            current.methane,

        "co":
            current.co,

        "h2s":
            current.h2s,

        "heart_rate":
            current.heart_rate,

        "spo2":
            current.spo2,

        "temperature":
            current.temperature,
    }

    for sensor_name, values in sensors.items():

        result = detect_sensor_anomaly(

            values,

            current_values[
                sensor_name
            ],

            sensor_name
        )

        results.append(result)

    anomalies = [
        result
        for result in results
        if result["anomaly"]
    ]

    # Overall anomaly score
    if anomalies:

        overall_score = max(
            result["score"]
            for result in anomalies
        )

    else:

        overall_score = 0

    if overall_score >= 90:

        overall_status = "SEVERE"

    elif overall_score >= 70:

        overall_status = "HIGH"

    elif overall_score >= 45:

        overall_status = "MODERATE"

    else:

        overall_status = "NORMAL"

    return {

        "status": overall_status,

        "score": overall_score,

        "anomalies": anomalies,

        "sensor_results": results
    }
