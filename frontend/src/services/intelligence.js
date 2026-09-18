const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000") + "/api/intelligence"

async function request(endpoint) {

  const response = await fetch(
    `${API_BASE}${endpoint}`
  )

  if (!response.ok) {

    throw new Error(
      `Intelligence API error: ${response.status}`
    )

  }

  return response.json()
}

// ======================================================
// RISK
// ======================================================

export function getRiskHistory(workerId) {

  return request(
    `/risk/${encodeURIComponent(workerId)}`
  )
}

// ======================================================
// ANOMALIES
// ======================================================

export function getAnomalies(workerId) {

  return request(
    `/anomalies/${encodeURIComponent(workerId)}`
  )
}

// ======================================================
// PREDICTION
// ======================================================

export function getPrediction(workerId) {

  return request(
    `/prediction/${encodeURIComponent(workerId)}`
  )
}

// ======================================================
// RECOMMENDATION
// ======================================================

export function getRecommendation(workerId) {

  return request(
    `/recommendation/${encodeURIComponent(workerId)}`
  )
}

// ======================================================
// ALL INTELLIGENCE
// ======================================================

export async function getWorkerIntelligence(
  workerId
) {

  return request(
    `/worker/${encodeURIComponent(workerId)}`
  )
}
