const API_BASE_URL = "http://127.0.0.1:8000"

export async function getAlerts() {

  const response = await fetch(
    `${API_BASE_URL}/api/alerts/`
  )

  if (!response.ok) {
    throw new Error("Failed to fetch alerts")
  }

  return response.json()
}