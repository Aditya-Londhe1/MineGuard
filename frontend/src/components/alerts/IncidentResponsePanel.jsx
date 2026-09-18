import { useEffect, useMemo, useState } from "react"
import {
    AlertTriangle,
    CheckCircle,
    ClipboardCheck,
    Search,
    RefreshCw,
} from "lucide-react"

import {
    getResponseQueue,
    acknowledgeIncident,
    reviewIncident,
    resolveIncident,
} from "../../services/alerts"
import IncidentAuditTrail from "./IncidentAuditTrail"


function priorityRank(priority) {
    const ranks = {
        P1: 1,
        P2: 2,
        P3: 3,
        P4: 4,
    }

    return ranks[priority] || 99
}


function priorityLabel(priority) {
    const labels = {
        P1: "IMMEDIATE",
        P2: "URGENT",
        P3: "ATTENTION",
        P4: "INFORMATIONAL",
    }

    return labels[priority] || "UNKNOWN"
}


function priorityClass(priority) {
    if (priority === "P1") return "border-red-500/30 bg-red-500/10 text-red-300"
    if (priority === "P2") return "border-orange-500/30 bg-orange-500/10 text-orange-300"
    if (priority === "P3") return "border-amber-500/30 bg-amber-500/10 text-amber-300"
    return "border-slate-700 bg-slate-800 text-slate-300"
}


function stateDescription(state) {
    const descriptions = {
        ACTIVE: "Awaiting supervisor acknowledgement",
        ACKNOWLEDGED: "Supervisor has acknowledged the incident",
        UNDER_REVIEW: "Incident is currently being investigated",
        RESOLVED: "Incident has been resolved",
    }

    return descriptions[state] || "Unknown incident state"
}


export default function IncidentResponsePanel() {
    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [processingId, setProcessingId] = useState(null)
    const [resolutionIncident, setResolutionIncident] = useState(null)
    const [resolutionNote, setResolutionNote] = useState("")
    const [selectedIncident, setSelectedIncident] = useState(null)

    async function loadQueue() {
        try {
            setLoading(true)
            setError("")

            const data = await getResponseQueue()

            setIncidents(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(err.message || "Unable to load incident queue")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadQueue()
    }, [])

    const sortedIncidents = useMemo(
        () => [...incidents].sort((first, second) => {
            const priorityDifference =
                priorityRank(first.priority) - priorityRank(second.priority)

            if (priorityDifference) return priorityDifference

            const riskDifference =
                Number(second.risk_score ?? 0) - Number(first.risk_score ?? 0)

            if (riskDifference) return riskDifference

            return new Date(second.timestamp) - new Date(first.timestamp)
        }),
        [incidents]
    )

    async function handleAction(incident, action, note = "") {
        try {
            setProcessingId(incident.id)
            setError("")

            if (action === "acknowledge") {
                await acknowledgeIncident(incident.id)
            }

            if (action === "review") {
                await reviewIncident(incident.id)
            }

            if (action === "resolve") {
                await resolveIncident(incident.id, note)
            }

            await loadQueue()
        } catch (err) {
            setError(err.message || "Unable to update incident")
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-800 bg-[#111820] p-6 text-sm text-slate-400">
                Loading incident response queue...
            </div>
        )
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">
                        Incident Response
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Prioritized unresolved safety incidents
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadQueue}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {sortedIncidents.length === 0 && (
                <div className="rounded-xl border border-slate-800 bg-[#111820] p-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-emerald-400" />
                        <div>
                            <div className="font-medium text-white">
                                No unresolved incidents
                            </div>
                            <div className="mt-1 text-sm text-slate-500">
                                No operational response is currently pending.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {sortedIncidents.map((incident) => (
                    <div
                        key={incident.id}
                        className="space-y-4 rounded-xl border border-slate-800 bg-[#111820] p-5"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-1 text-amber-400" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${priorityClass(incident.priority)}`}>
                                            {incident.priority}
                                        </span>
                                        <span className="text-xs font-medium text-slate-400">
                                            {priorityLabel(incident.priority)}
                                        </span>
                                    </div>
                                    <div className="mt-2 font-medium text-white">
                                        {incident.event_type}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="font-semibold text-white">
                                    Risk {incident.risk_score}
                                </div>
                                <div className="text-sm text-slate-400">
                                    {incident.severity}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                            <Detail label="Worker" value={incident.worker_id} />
                            <Detail label="Zone" value={incident.zone || "Unknown"} />
                            <div>
                                <div className="text-slate-500">State</div>
                                <div className="mt-1 font-medium text-slate-200">
                                    {incident.event_state}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                    {stateDescription(incident.event_state)}
                                </div>
                            </div>
                            <Detail label="Source" value={incident.source} />
                        </div>

                        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                            <div className="text-sm font-medium text-white">
                                Evidence / Event
                            </div>
                            <div className="mt-1 text-sm text-slate-400">
                                {incident.message}
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
                            <div className="text-sm font-medium text-slate-200">
                                Acknowledgement
                            </div>

                            {incident.acknowledged_at ? (
                                <div className="mt-1 space-y-1 text-sm text-slate-400">
                                    <div>
                                        Status: <strong className="text-emerald-300">ACKNOWLEDGED</strong>
                                    </div>
                                    <div>By: {incident.acknowledged_by || "Unknown"}</div>
                                    <div>
                                        At: {new Date(incident.acknowledged_at).toLocaleString()}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-1 text-sm text-amber-300">
                                    Status: <strong>PENDING</strong>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedIncident(incident)}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                            >
                                View Audit
                            </button>

                            {incident.event_state === "ACTIVE" && (
                                <button
                                    type="button"
                                    disabled={processingId === incident.id}
                                    onClick={() => handleAction(incident, "acknowledge")}
                                    className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
                                >
                                    <ClipboardCheck size={16} />
                                    Acknowledge
                                </button>
                            )}

                            {incident.event_state === "ACKNOWLEDGED" && (
                                <>
                                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300">
                                        ✓ Acknowledged
                                    </div>
                                    <button
                                        type="button"
                                        disabled={processingId === incident.id}
                                        onClick={() => handleAction(incident, "review")}
                                        className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-50"
                                    >
                                        <Search size={16} />
                                        Start Review
                                    </button>
                                </>
                            )}

                            {incident.event_state === "UNDER_REVIEW" && (
                                <button
                                    type="button"
                                    disabled={processingId === incident.id}
                                    onClick={() => {
                                        setResolutionIncident(incident)
                                        setResolutionNote("")
                                    }}
                                    className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                                >
                                    <CheckCircle size={16} />
                                    Resolve
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedIncident && (
                <div className="mt-6">
                    <IncidentAuditTrail
                        alertId={selectedIncident.id}
                    />
                </div>
            )}

            {resolutionIncident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 text-slate-900 shadow-xl">
                        <h2 className="text-lg font-semibold">Resolve Incident</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Record what was done to address this incident.
                        </p>

                        <textarea
                            value={resolutionNote}
                            onChange={event => setResolutionNote(event.target.value)}
                            placeholder="Example: Gas level returned to safe range after ventilation was restored."
                            className="mt-4 min-h-[120px] w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-slate-500"
                        />

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setResolutionIncident(null)
                                    setResolutionNote("")
                                }}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!resolutionNote.trim() || processingId === resolutionIncident.id}
                                onClick={async () => {
                                    await handleAction(resolutionIncident, "resolve", resolutionNote)
                                    setResolutionIncident(null)
                                    setResolutionNote("")
                                }}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
                            >
                                Confirm Resolution
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

function Detail({ label, value }) {
    return (
        <div>
            <div className="text-slate-500">{label}</div>
            <div className="mt-1 font-medium text-slate-200">{value}</div>
        </div>
    )
}
