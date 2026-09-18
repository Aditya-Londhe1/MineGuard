import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from "lucide-react"

export default function RiskTrendCard({
  trend,
  riskScores = [],
}) {

  if (!trend) {

    return (

      <div className="rounded-xl border border-slate-800 bg-[#111820] p-5">

        <p className="text-xs text-slate-500">
          Risk intelligence
        </p>

        <p className="mt-3 text-sm text-slate-600">
          Waiting for telemetry...
        </p>

      </div>

    )

  }

  const increasing =
    trend.direction === "up"

  const decreasing =
    trend.direction === "down"

  const Icon =
    increasing
      ? TrendingUp
      : decreasing
        ? TrendingDown
        : Minus

  return (

    <div className="rounded-xl border border-slate-800 bg-[#111820] p-5">

      <div className="flex items-start justify-between">

        <div>

          <div className="flex items-center gap-2">

            <Activity
              size={16}
              className="text-slate-500"
            />

            <p className="text-xs font-medium text-slate-400">
              Risk Trend
            </p>

          </div>

          <p className="mt-3 text-lg font-bold text-white">
            {trend.trend.replaceAll("_", " ")}
          </p>

        </div>

        <Icon
          size={22}
          className={
            increasing
              ? "text-red-400"
              : decreasing
                ? "text-emerald-400"
                : "text-slate-500"
          }
        />

      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">

        <div>

          <p className="text-[10px] text-slate-600">
            Change
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            {trend.change > 0
              ? "+"
              : ""}
            {trend.change}
          </p>

        </div>

        <div>

          <p className="text-[10px] text-slate-600">
            Average
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            {trend.average}
          </p>

        </div>

      </div>

      {riskScores.length > 1 && (

        <div className="mt-5 flex h-16 items-end gap-1">

          {riskScores.map(
            (score, index) => {

              const height =
                Math.max(
                  4,
                  Math.min(
                    100,
                    score
                  )
                )

              return (

                <div
                  key={index}
                  className="flex-1 rounded-t bg-slate-700/70"
                  style={{
                    height: `${height}%`,
                  }}
                />

              )

            }
          )}

        </div>

      )}

    </div>
  )
}
