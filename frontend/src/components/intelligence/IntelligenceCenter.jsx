import {
  useEffect,
  useState,
} from "react"

import {
  BrainCircuit,
  RefreshCw,
  Wifi,
} from "lucide-react"

import {
  getWorkerIntelligence,
} from "../../services/intelligence"

import RiskTrendCard from "./RiskTrendCard"
import AnomalyCard from "./AnomalyCard"
import PredictionCard from "./PredictionCard"

export default function IntelligenceCenter({
  worker,
  onPredictionChange,
  refreshToken = 0,
}) {

  const [data, setData] =
    useState(null)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState(null)

  async function loadIntelligence() {

    if (!worker?.worker_id) {

      setData(null)

      return

    }

    try {

      setLoading(true)

      setError(null)

      const result =
        await getWorkerIntelligence(
          worker.worker_id
        )

      setData(result)

      onPredictionChange?.(result.prediction)

    } catch (err) {

      console.error(
        "Intelligence loading failed:",
        err
      )

      setError(
        "Unable to load intelligence data."
      )

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {

    loadIntelligence()

  }, [worker?.worker_id, onPredictionChange, refreshToken])

  if (!worker) {

    return (

      <section className="rounded-xl border border-slate-800 bg-[#111820] p-6">

        <div className="flex items-center gap-3">

          <BrainCircuit
            size={20}
            className="text-slate-500"
          />

          <div>

            <h2 className="text-sm font-semibold text-slate-300">
              Safety Intelligence
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              Select a worker to view analysis.
            </p>

          </div>

        </div>

      </section>

    )

  }

  return (

    <section className="space-y-4">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#111820]">

            <BrainCircuit
              size={18}
              className="text-slate-400"
            />

          </div>

          <div>

            <h2 className="text-sm font-semibold text-white">
              Safety Intelligence
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-600">
              Risk trajectory and decision support
            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-1.5">

            <Wifi
              size={12}
              className="text-emerald-400"
            />

            <span className="text-[10px] text-slate-500">
              Live telemetry
            </span>

          </div>

          <button
            onClick={loadIntelligence}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40"
            title="Refresh intelligence"
          >

            <RefreshCw
              size={14}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

          </button>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3">

          <p className="text-xs text-red-400">
            {error}
          </p>

        </div>

      )}

      {/* =================================================
          CONTENT
      ================================================= */}

      {data && (

        <div className="grid gap-4 xl:grid-cols-2 xl:items-start">

          <div className="space-y-4">

            <RiskTrendCard
              trend={data.risk.trend}
              riskScores={data.risk.risk_scores}
            />

            <PredictionCard
              data={data.prediction}
            />

          </div>

          <div className="space-y-4">

            <AnomalyCard
              data={data.anomalies}
            />

          </div>

        </div>

      )}

    </section>

  )
}
