import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"

export default function AnomalyCard({
  data,
}) {

  if (!data) {

    return (

      <div className="rounded-xl border border-slate-800 bg-[#111820] p-5">

        <p className="text-xs text-slate-500">
          Anomaly Detection
        </p>

        <p className="mt-3 text-sm text-slate-600">
          Waiting for telemetry...
        </p>

      </div>

    )

  }

  const hasAnomaly =
    data.anomalies?.length > 0

  return (

    <div className="min-w-0 rounded-xl border border-slate-800 bg-[#111820]">

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

        <div>

          <p className="text-xs font-medium text-slate-400">
            Anomaly Detection
          </p>

          <p className="mt-1 text-[10px] text-slate-600">
            Behavioral deviation analysis
          </p>

        </div>

        {hasAnomaly ? (

          <AlertTriangle
            size={19}
            className="text-amber-400"
          />

        ) : (

          <CheckCircle2
            size={19}
            className="text-emerald-400"
          />

        )}

      </div>

      <div className="px-5 py-5">

        <div className="flex flex-wrap items-end justify-between gap-4">

          <div>

            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Overall Status
            </p>

            <p
              className={`mt-1 text-lg font-bold ${
                data.status === "SEVERE"
                  ? "text-red-400"
                  : data.status === "HIGH"
                    ? "text-amber-400"
                    : data.status === "MODERATE"
                      ? "text-yellow-400"
                      : "text-emerald-400"
              }`}
            >
              {data.status}
            </p>

          </div>

          <div className="text-right">

            <p className="text-[10px] text-slate-600">
              Anomaly Score
            </p>

            <p className="mt-1 text-lg font-bold text-white">
              {data.score}/100
            </p>

          </div>

        </div>

        {!hasAnomaly && (

          <div className="mt-5 rounded-lg bg-emerald-500/5 p-3">

            <p className="text-xs text-emerald-400">
              No unusual sensor behavior detected.
            </p>

          </div>

        )}

        {hasAnomaly && (

          <div className="mt-5 space-y-2">

            {data.anomalies.map(
              (anomaly) => (

                <div
                  key={anomaly.sensor}
                  className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
                >

                  <div className="flex min-w-0 items-center justify-between gap-3">

                    <div className="flex items-center gap-2">

                      <TrendingUp
                        size={14}
                        className="text-amber-400"
                      />

                      <span className="truncate text-xs font-semibold text-white">
                        {anomaly.sensor}
                      </span>

                    </div>

                    <span className="shrink-0 text-[9px] font-bold uppercase text-amber-400">
                      {anomaly.severity}
                    </span>

                  </div>

                  <p className="mt-2 text-[10px] leading-4 text-slate-500">
                    {anomaly.message}
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-3">

                    <div>

                      <p className="text-[9px] text-slate-600">
                        Current
                      </p>

                      <p className="text-xs font-semibold text-white">
                        {anomaly.current}
                      </p>

                    </div>

                    <div>

                      <p className="text-[9px] text-slate-600">
                        Baseline
                      </p>

                      <p className="text-xs font-semibold text-white">
                        {anomaly.baseline}
                      </p>

                    </div>

                    <div>

                      <p className="text-[9px] text-slate-600">
                        Change
                      </p>

                      <p className="text-xs font-semibold text-white">
                        {anomaly.change_percent > 0
                          ? "+"
                          : ""}
                        {anomaly.change_percent}%
                      </p>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  )
}
