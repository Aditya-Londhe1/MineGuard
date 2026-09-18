const API_BASE = "http://127.0.0.1:8000/api/analytics"

async function request(endpoint) {

    const response = await fetch(
        `${API_BASE}${endpoint}`
    )

    if (!response.ok) {

        throw new Error(
            `Analytics API error: ${response.status}`
        )
    }

    return response.json()
}

// =========================================================
// OVERVIEW
// =========================================================

export function getAnalyticsOverview(hours = 24) {

    return request(
        `/overview?hours=${hours}`
    )
}

// =========================================================
// INCIDENTS
// =========================================================

export function getIncidents(
    hours = 24,
    filters = {}
) {

    const params = new URLSearchParams()

    params.set(
        "hours",
        hours
    )

    if (filters.severity) {

        params.set(
            "severity",
            filters.severity
        )
    }

    if (filters.worker_id) {

        params.set(
            "worker_id",
            filters.worker_id
        )
    }

    if (filters.zone) {

        params.set(
            "zone",
            filters.zone
        )
    }

    if (
        filters.resolved !== undefined &&
        filters.resolved !== ""
    ) {

        params.set(
            "resolved",
            filters.resolved
        )
    }

    return request(
        `/incidents?${params.toString()}`
    )
}

// =========================================================
// RISK TREND
// =========================================================

export function getRiskTrend(
    hours = 24,
    workerId = "",
    zone = ""
) {

    const params = new URLSearchParams()

    params.set(
        "hours",
        hours
    )

    if (workerId) {

        params.set(
            "worker_id",
            workerId
        )
    }

    if (zone) {

        params.set(
            "zone",
            zone
        )
    }

    return request(
        `/risk-trend?${params.toString()}`
    )
}

// =========================================================
// WORKER ANALYTICS
// =========================================================

export function getWorkerAnalytics(
    workerId,
    hours = 168
) {

    return request(
        `/workers/${encodeURIComponent(workerId)}?hours=${hours}`
    )
}

// =========================================================
// ZONE ANALYTICS
// =========================================================

export function getZoneAnalytics(
    zoneId,
    hours = 168
) {

    return request(
        `/zones/${encodeURIComponent(zoneId)}?hours=${hours}`
    )
}
