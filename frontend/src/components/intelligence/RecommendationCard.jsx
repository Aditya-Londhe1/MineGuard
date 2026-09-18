import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react"

export default function RecommendationCard({
  data,
}) {

  if (!data) {

    return (

      <div className="rounded-xl border border-slate-800 bg-[#111820] p-5">

        <p className="text-xs text-slate-500">
          Safety Recommendation
        </p>

        <p className="mt-3 text-sm text-slate-600">
          Waiting for intelligence data...
        </p>

      </div>

    )

  }

  const priority =
    data.priority

  const critical =
    priority === "CRITICAL"

  const high =
    priority === "HIGH"

  const moderate =
    priority === "MODERATE"

  let Icon = CheckCircle2

  if (critical) {

    Icon = ShieldAlert

  } else if (high || moderate) {

    Icon = AlertTriangle

  }

  return (

    <div className="rounded-xl border border-slate-800 bg-[#111820]">

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

        <div className="flex items-center gap-2">

          <BrainCircuit
            size={17}
            className="text-slate-400"
          />

          <div>

            <p className="text-xs font-semibold text-slate-300">
              Recommended Action
            </p>

            <p className="mt-0.5 text-[10px] text-slate-600">
              Explainable safety decision support
            </p>

          </div>

        </div>

        <Icon
          size={19}
          className={
            critical
              ? "text-red-400"
              : high
                ? "text-amber-400"
                : moderate
                  ? "text-yellow-400"
                  : "text-emerald-400"
          }
        />

      </div>

      <div className="p-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Priority
            </p>

            <p
              className={`mt-1 text-xl font-bold ${
                critical
                  ? "text-red-400"
                  : high
                    ? "text-amber-400"
                    : moderate
                      ? "text-yellow-400"
                      : "text-emerald-400"
              }`}
            >
              {priority}
            </p>

          </div>

          <div className="text-right">

            <p className="text-[10px] text-slate-600">
              Zone
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {data.zone}
            </p>

          </div>

        </div>

        <div
          className={`mt-5 rounded-lg p-4 ${
            critical
              ? "bg-red-500/5"
              : high
                ? "bg-amber-500/5"
                : "bg-slate-900/50"
          }`}
        >

          <p className="text-xs leading-5 text-slate-300">
            {data.summary}
          </p>

        </div>

        <div className="mt-5">

          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Suggested Actions
          </p>

          <div className="space-y-2">

            {data.actions.map(
              (action, index) => (

                <div
                  key={index}
                  className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900/30 p-3"
                >

                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[9px] text-slate-400">
                    {index + 1}
                  </div>

                  <p className="text-[11px] leading-4 text-slate-400">
                    {action}
                  </p>

                </div>

              )
            )}

          </div>

        </div>

        <div className="mt-5 border-t border-slate-800 pt-4">

          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Why this recommendation?
          </p>

          <div className="space-y-2">

            {data.reasons.map(
              (reason, index) => (

                <div
                  key={index}
                  className="flex items-start gap-2"
                >

                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />

                  <p className="text-[10px] leading-4 text-slate-500">
                    {reason}
                  </p>

                </div>

              )
            )}

          </div>

        </div>

        {data.evidence?.length > 0 && (

          <div className="mt-5 border-t border-slate-800 pt-4">

            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              Evidence
            </p>

            <div className="space-y-2">

              {data.evidence.map(
                (item, index) => (

                  <p
                    key={index}
                    className="text-[10px] leading-4 text-slate-500"
                  >
                    {item}
                  </p>

                )
              )}

            </div>

          </div>

        )}

      </div>

    </div>
  )
}
