import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  Clock,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react"

import { getResponseQueue } from "../../services/alerts"

function priorityRank(priority) {
  return {P1: 1, P2: 2, P3: 3, P4: 4}[priority] || 99
}

function getPriorityLabel(priority) {
  return {P1: "Immediate", P2: "High", P3: "Moderate", P4: "Low"}[priority] || priority
}

function getStateLabel(state) {
  return {
    ACTIVE: "Awaiting acknowledgement",
    ACKNOWLEDGED: "Acknowledged",
    UNDER_REVIEW: "Under review",
    RESOLVED: "Resolved",
  }[state] || state
}

function getEventIcon(eventType) {
  if (eventType === "SOS") return <ShieldAlert size={18} />
  if (eventType === "FALL_DETECTED") return <AlertTriangle size={18} />
  return <AlertTriangle size={18} />
}

function formatTime(timestamp) {
  if (!timestamp) return "Unknown"
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString()
}

export default function SupervisorResponseDashboard() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadQueue() {
    try {
      setLoading(true)
      setError(null)
      const data = await getResponseQueue()
      setIncidents(Array.isArray(data) ? data : data.incidents || data.alerts || [])
    } catch (err) {
      console.error("Supervisor dashboard error:", err)
      setError(err.message || "Unable to load response queue")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()

    const interval = setInterval(() => {
      loadQueue()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const sortedIncidents = useMemo(() => (
    [...incidents].sort((first, second) => {
      const priorityDifference = priorityRank(first.priority) - priorityRank(second.priority)
      if (priorityDifference) return priorityDifference
      return Number(second.risk_score || 0) - Number(first.risk_score || 0)
    })
  ), [incidents])

  const statistics = useMemo(() => ({
    p1: incidents.filter(incident => incident.priority === "P1").length,
    p2: incidents.filter(incident => incident.priority === "P2").length,
    active: incidents.filter(incident => incident.event_state === "ACTIVE").length,
    acknowledged: incidents.filter(incident => incident.event_state === "ACKNOWLEDGED").length,
    underReview: incidents.filter(incident => incident.event_state === "UNDER_REVIEW").length,
  }), [incidents])

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert size={22} className="text-red-300" />
            <h2 className="text-xl font-semibold text-white">Supervisor Response Center</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Operational safety incidents requiring attention</p>
        </div>
        <button type="button" onClick={loadQueue} disabled={loading} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<ShieldAlert size={20} />} label="P1 Immediate" value={statistics.p1} />
        <StatCard icon={<AlertTriangle size={20} />} label="P2 High" value={statistics.p2} />
        <StatCard icon={<Clock size={20} />} label="Awaiting Acknowledgement" value={statistics.active} />
        <StatCard icon={<ClipboardCheck size={20} />} label="Acknowledged" value={statistics.acknowledged} />
        <StatCard icon={<Search size={20} />} label="Under Review" value={statistics.underReview} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#111820]">
        <div className="border-b border-slate-800 p-5">
          <h3 className="text-lg font-semibold text-white">Priority Incident Queue</h3>
          <p className="mt-1 text-sm text-slate-500">Unresolved safety incidents ordered by operational priority</p>
        </div>

        {loading && <div className="p-8 text-center text-slate-500">Loading active incidents...</div>}

        {!loading && sortedIncidents.length === 0 && (
          <div className="p-10 text-center">
            <CheckCircle size={32} className="mx-auto mb-3 text-emerald-400" />
            <div className="font-medium text-white">No unresolved incidents</div>
            <div className="mt-1 text-sm text-slate-500">The active response queue is clear.</div>
          </div>
        )}

        {!loading && sortedIncidents.length > 0 && (
          <div className="divide-y divide-slate-800">
            {sortedIncidents.map(incident => (
              <div key={incident.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-amber-300">{getEventIcon(incident.event_type)}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">{incident.event_type || "SAFETY_EVENT"}</span>
                        <span className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300">{incident.priority || "P4"}</span>
                        <span className="text-xs text-slate-500">{getPriorityLabel(incident.priority)}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-400">Worker: <strong className="text-slate-200">{incident.worker_id || "Unknown"}</strong> <span className="mx-1">•</span> Zone: <strong className="text-slate-200">{incident.zone || "Unknown"}</strong></div>
                      <div className="mt-1 text-sm text-slate-500">{incident.message || "Safety incident detected"}</div>
                    </div>
                  </div>
                  <div className="lg:text-right">
                    <div className="font-medium text-white">{getStateLabel(incident.event_state)}</div>
                    <div className="mt-1 text-sm text-slate-400">Risk: <strong>{incident.risk_score ?? "-"}</strong></div>
                    <div className="mt-1 text-xs text-slate-500">Detected: {formatTime(incident.timestamp)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <WorkloadCard icon={<Clock size={20} />} title="Awaiting Acknowledgement" value={statistics.active} description="Incidents that have not yet been acknowledged." />
        <WorkloadCard icon={<Search size={20} />} title="Under Review" value={statistics.underReview} description="Incidents currently requiring investigation." />
      </div>
    </section>
  )
}

function StatCard({icon, label, value}) {
  return <div className="rounded-xl border border-slate-800 bg-[#111820] p-4"><div className="flex items-center gap-2 text-sm text-slate-400">{icon}<span>{label}</span></div><div className="mt-3 text-2xl font-semibold text-white">{value}</div></div>
}

function WorkloadCard({icon, title, value, description}) {
  return <div className="rounded-xl border border-slate-800 bg-[#111820] p-5"><div className="flex items-center gap-2 text-slate-300">{icon}<h3 className="font-semibold">{title}</h3></div><div className="mt-3 text-3xl font-semibold text-white">{value}</div><p className="mt-1 text-sm text-slate-500">{description}</p></div>
}
