import {
  AlertOctagon,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldAlert,
  User,
} from "lucide-react"

const priorityRank = {
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
}

const severityRank = {
  CRITICAL: 4,
  HIGH: 3,
  WARNING: 2,
  MODERATE: 1,
}

function sortIncidents(incidents) {
  return [...incidents].sort((first, second) => {
    const priorityDifference =
      (priorityRank[first.priority] ?? 5) -
      (priorityRank[second.priority] ?? 5)

    if (priorityDifference) return priorityDifference

    const severityDifference =
      (severityRank[second.severity] ?? 0) -
      (severityRank[first.severity] ?? 0)

    if (severityDifference) return severityDifference

    const riskDifference =
      Number(second.risk_score ?? 0) - Number(first.risk_score ?? 0)

    if (riskDifference) return riskDifference

    return new Date(second.timestamp) - new Date(first.timestamp)
  })
}

function priorityClass(priority) {
  if (priority === "P1") return "bg-red-500/15 text-red-300"
  if (priority === "P2") return "bg-orange-500/15 text-orange-300"
  if (priority === "P3") return "bg-amber-500/15 text-amber-300"
  return "bg-slate-800 text-slate-300"
}

export default function IncidentCenter({
  incidents = [],
  onAcknowledge,
  onUnderReview,
  onResolve,
}) {

  const activeIncidents = sortIncidents(
    incidents.filter(incident => !incident.resolved)
  )

  return (

    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#111820]">

      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

        <div>

          <div className="flex items-center gap-2">

            <h3 className="text-sm font-semibold text-white">
              Incident Command Center
            </h3>

            {activeIncidents.length > 0 && (

              <span className="rounded-full bg-red-500/10 px-2 py-1 text-[9px] font-bold text-red-400">

                {activeIncidents.length} ACTIVE

              </span>

            )}

          </div>

          <p className="mt-1 text-xs text-slate-500">
            Monitor and respond to active safety incidents
          </p>

        </div>

        <ShieldAlert
          size={19}
          className="text-slate-500"
        />

      </div>

      {/* INCIDENTS */}

      <div className="divide-y divide-slate-800">

        {activeIncidents.length === 0 && (

          <div className="px-5 py-10 text-center">

            <CheckCircle2
              size={30}
              className="mx-auto text-emerald-400"
            />

            <p className="mt-3 text-sm font-medium text-white">
              No active incidents
            </p>

            <p className="mt-1 text-xs text-slate-600">
              All monitored workers are currently safe
            </p>

          </div>

        )}

        {activeIncidents.map((incident) => (

          <IncidentCard
            key={incident.id}
            incident={incident}
            onAcknowledge={onAcknowledge}
            onUnderReview={onUnderReview}
            onResolve={onResolve}
          />

        ))}

      </div>

    </div>
  )
}

function IncidentCard({
  incident,
  onAcknowledge,
  onUnderReview,
  onResolve,
}) {

  const critical =
    incident.severity === "CRITICAL"

  const eventState = incident.event_state ?? "ACTIVE"

  return (

    <div className="p-5">

      <div className="flex gap-4">

        {/* ICON */}

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            critical
              ? "bg-red-500/10"
              : "bg-amber-500/10"
          }`}
        >

          <AlertOctagon
            size={20}
            className={
              critical
                ? "text-red-400"
                : "text-amber-400"
            }
          />

        </div>

        {/* CONTENT */}

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                critical
                  ? "text-red-400"
                  : "text-amber-400"
              }`}
            >
              {incident.severity}
            </span>

            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityClass(incident.priority)}`}>
              {incident.priority ?? "P4"}
            </span>

            <span className="text-slate-700">
              •
            </span>

            <span className="text-xs font-semibold text-white">
              {incident.worker_id}
            </span>

          </div>

          <p className="mt-2 text-sm font-medium text-slate-200">
            {incident.message}
          </p>

          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {incident.event_type ?? incident.alert_type} · {eventState.replace("_", " ")}
          </p>

          <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-slate-500">

            <span className="flex items-center gap-1">

              <MapPin size={11} />

              {incident.zone}

            </span>

            <span className="flex items-center gap-1">

              <User size={11} />

              {incident.worker_id}

            </span>

            <span className="flex items-center gap-1">

              <Clock3 size={11} />

              {new Date(
                incident.timestamp
              ).toLocaleTimeString()}

            </span>

          </div>

          {/* ACTIONS */}

          <div className="mt-4 flex gap-2">

            {eventState === "ACTIVE" && (
              <button
                onClick={() => onAcknowledge?.(incident)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-[10px] font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
              >
                Acknowledge
              </button>
            )}

            {eventState === "ACKNOWLEDGED" && (
              <button
                onClick={() => onUnderReview?.(incident)}
                className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[10px] font-semibold text-sky-300 transition hover:bg-sky-500/20"
              >
                Under Review
              </button>
            )}

            {(eventState === "ACKNOWLEDGED" || eventState === "UNDER_REVIEW") && (
              <button
                onClick={() => onResolve?.(incident)}
                className="rounded-lg bg-emerald-500/10 px-3 py-2 text-[10px] font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
              >
                Resolve Incident
              </button>
            )}

          </div>

        </div>

      </div>

    </div>
  )
}
