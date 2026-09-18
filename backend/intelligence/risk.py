from statistics import mean


def calculate_risk_trend(
    risk_scores: list[float]
):

    if not risk_scores:

        return {
            "trend": "STABLE",
            "change": 0,
            "average": 0,
            "direction": "neutral"
        }

    if len(risk_scores) == 1:

        return {
            "trend": "STABLE",
            "change": 0,
            "average": risk_scores[0],
            "direction": "neutral"
        }

    current = risk_scores[-1]

    previous = risk_scores[-2]

    change = current - previous

    average = mean(risk_scores)

    # ---------------------------------------------
    # RAPIDLY INCREASING
    # ---------------------------------------------

    if change >= 15:

        trend = "RAPIDLY_INCREASING"

        direction = "up"

    # ---------------------------------------------
    # INCREASING
    # ---------------------------------------------

    elif change >= 5:

        trend = "INCREASING"

        direction = "up"

    # ---------------------------------------------
    # DECREASING
    # ---------------------------------------------

    elif change <= -5:

        trend = "DECREASING"

        direction = "down"

    # ---------------------------------------------
    # STABLE
    # ---------------------------------------------

    else:

        trend = "STABLE"

        direction = "neutral"

    return {

        "trend": trend,

        "change": round(change, 2),

        "average": round(average, 2),

        "direction": direction
    }
