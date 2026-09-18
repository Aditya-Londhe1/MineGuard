import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react"

export default function PredictionCard({
  data,
}) {

  if (!data) {

    return (

      <div className="rounded-xl border border-slate-800 bg-[#111820] p-5">

        <div className="flex items-center gap-2">

          <BrainCircuit
            size={17}
            className="text-slate-500"
          />

          <p className="text-xs font-medium text-slate-400">
            Predictive Risk
          </p>

        </div>

        <p className="mt-4 text-sm text-slate-600">
          Select a worker to view prediction.
        </p>

      </div>

    )

  }

  const critical =
    data.status === "CRITICAL"

  const high =
    data.status === "HIGH"

  return (

    <div className="rounded-xl border border-slate-800 bg-[#111820]">

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

        <div className="flex items-center gap-2">

          <BrainCircuit
            size={17}
            className="text-slate-400"
          />

          <div>

            <p className="text-xs font-medium text-slate-300">
              Predictive Risk
            </p>

            <p className="mt-0.5 text-[10px] text-slate-600">
              Near-term risk trajectory
            </p>

          </div>

        </div>

        {critical || high ? (

          <AlertTriangle
            size={18}
            className={
              critical
                ? "text-red-400"
                : "text-amber-400"
            }
          />

        ) : (

          <ShieldCheck
            size={18}
            className="text-emerald-400"
          />

        )}

      </div>

      <div className="grid grid-cols-2 gap-4 p-5">

        <div>

          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Current
          </p>

          <p className="mt-1 text-3xl font-bold text-white">
            {data.current_risk}
          </p>

          <p className="text-[10px] text-slate-600">
            / 100
          </p>

        </div>

        <div>

          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Predicted
          </p>

          <p
            className={`mt-1 text-3xl font-bold ${
              critical
                ? "text-red-400"
                : high
                  ? "text-amber-400"
                  : "text-emerald-400"
            }`}
          >
            {data.predicted_risk}
          </p>

          <p className="text-[10px] text-slate-600">
            / 100
          </p>

        </div>

      </div>

      <div className="px-5">

        <div className="flex items-center justify-between">

          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Trajectory
          </p>

          <div className="flex items-center gap-1">

            <TrendingUp
              size={12}
              className={
                data.trend_change > 0
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            />

            <span className="text-[10px] font-semibold text-slate-400">
              {data.trend_change > 0
                ? "+"
                : ""}
              {data.trend_change}
            </span>

          </div>

        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">

          <div
            className={`h-full rounded-full transition-all ${
              critical
                ? "bg-red-500"
                : high
                  ? "bg-amber-400"
                  : "bg-emerald-400"
            }`}
            style={{
              width: `${data.predicted_risk}%`,
            }}
          />

        </div>

      </div>

      <div className="p-5">

        <div
          className={`rounded-lg p-3 ${
            critical
              ? "bg-red-500/5"
              : high
                ? "bg-amber-500/5"
                : "bg-emerald-500/5"
          }`}
        >

          <p
            className={`text-xs font-medium ${
              critical
                ? "text-red-400"
                : high
                  ? "text-amber-400"
                  : "text-emerald-400"
            }`}
          >
            {data.message}
          </p>

        </div>

      </div>

      {data.factors?.length > 0 && (

        <div className="border-t border-slate-800 px-5 py-4">

          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Contributing Factors
          </p>

          <div className="space-y-2">

            {data.factors
              .slice(0, 5)
              .map((factor, index) => (

                <div
                  key={index}
                  className="flex items-center gap-2"
                >

                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />

                  <p className="text-[10px] text-slate-500">
                    {factor.message}
                  </p>

                </div>

              ))}

          </div>

        </div>

      )}

    </div>
  )
}
