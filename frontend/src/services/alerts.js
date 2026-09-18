const API_BASE = "http://127.0.0.1:8000"

async function request(endpoint, options = {}) {
    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
            ...options,
        }
    )

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({}))

        throw new Error(
            error.detail || `Request failed: ${response.status}`
        )
    }

    return response.json()
}


// =========================================================
// RESPONSE QUEUE
// =========================================================

export function getResponseQueue() {
    return request("/api/alerts/response/queue")
}


// =========================================================
// INCIDENT
// =========================================================

export function getIncident(alertId) {
    return request(`/api/alerts/${alertId}`)
}


// =========================================================
// ACKNOWLEDGE
// =========================================================

export function acknowledgeIncident(alertId) {
    return request(
        `/api/alerts/${alertId}/acknowledge`,
        { method: "PATCH" }
    )
}


// =========================================================
// UNDER REVIEW
// =========================================================

export function reviewIncident(alertId) {
    return request(
        `/api/alerts/${alertId}/under-review`,
        { method: "PATCH" }
    )
}


// =========================================================
// RESOLVE
// =========================================================

export function resolveIncident(
    alertId,
    resolutionNote,
    resolvedBy = "supervisor"
) {
    return request(
        `/api/alerts/${alertId}/resolve`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                resolved_by: resolvedBy,
                resolution_note: resolutionNote,
            }),
        }
    )
}
