import { useEffect, useState } from "react"
import {
    Activity,
    CheckCircle,
    ClipboardCheck,
    Clock,
    Search,
    ShieldAlert,
} from "lucide-react"

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000"

function getActionIcon(action) {
    switch (action) {
        case "INCIDENT_DETECTED":
            return <ShieldAlert size={18} />
        case "INCIDENT_ACKNOWLEDGED":
            return <ClipboardCheck size={18} />
        case "INCIDENT_REVIEW_STARTED":
            return <Search size={18} />
        case "INCIDENT_RESOLVED":
            return <CheckCircle size={18} />
        default:
            return <Activity size={18} />
    }
}

function getActionLabel(action) {
    const labels = {
        INCIDENT_DETECTED: "Incident Detected",
        INCIDENT_ACKNOWLEDGED: "Incident Acknowledged",
        INCIDENT_REVIEW_STARTED: "Incident Review Started",
        INCIDENT_RESOLVED: "Incident Resolved",
    }

    return labels[action] || action
}

function formatDate(timestamp) {
    if (!timestamp) return "Unknown time"

    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return "Unknown time"

    return date.toLocaleString()
}

export default function IncidentAuditTrail({ alertId }) {
    const [audit, setAudit] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    async function loadAudit() {
        if (!alertId) return

        try {
            setLoading(true)
            setError(null)

            const response = await fetch(
                `${API_BASE}/api/audit/incident/${alertId}`
            )

            if (!response.ok) {
                throw new Error("Failed to load audit trail")
            }

            const data = await response.json()
            setAudit(data.audit || [])
        } catch (err) {
            console.error("Audit trail error:", err)
            setError(err.message || "Unable to load audit trail")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAudit()
    }, [alertId])

    if (!alertId) return null

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Safety Event Audit Trail</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Chronological record of incident actions
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadAudit}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                    Refresh
                </button>
            </div>

            {loading && (
                <div className="py-8 text-center text-slate-500">
                    Loading audit history...
                </div>
            )}

            {!loading && error && (
                <div className="py-8 text-center">
                    <div className="font-medium text-red-600">
                        Unable to load audit trail
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{error}</div>
                </div>
            )}

            {!loading && !error && audit.length === 0 && (
                <div className="py-8 text-center">
                    <Clock size={28} className="mx-auto mb-2 text-slate-400" />
                    <div className="text-sm text-slate-500">
                        No audit events recorded
                    </div>
                </div>
            )}

            {!loading && !error && audit.length > 0 && (
                <div className="space-y-0">
                    {audit.map((event, index) => (
                        <div key={event.id} className="relative flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700">
                                    {getActionIcon(event.action)}
                                </div>
                                {index < audit.length - 1 && (
                                    <div className="min-h-[60px] w-px flex-1 bg-slate-300" />
                                )}
                            </div>

                            <div className="flex-1 pb-7">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="font-medium text-slate-900">
                                        {getActionLabel(event.action)}
                                    </h3>
                                    <span className="whitespace-nowrap text-xs text-slate-500">
                                        {formatDate(event.timestamp)}
                                    </span>
                                </div>

                                <div className="mt-1 text-sm text-slate-600">
                                    Actor: <span className="font-medium">{event.actor || "Unknown"}</span>
                                </div>

                                {(event.previous_state || event.new_state) && (
                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                        {event.previous_state && (
                                            <span className="rounded border border-slate-300 px-2 py-1">
                                                {event.previous_state}
                                            </span>
                                        )}
                                        {event.previous_state && <span>→</span>}
                                        {event.new_state && (
                                            <span className="rounded border border-slate-300 px-2 py-1">
                                                {event.new_state}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {event.details && (
                                    <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                        {event.details}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
