import { useEffect, useState } from "react"
import WorkerCard from "../components/dashboard/WorkerCard"
import WorkerSafetyAnalytics from "../components/analytics/WorkerSafetyAnalytics"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

export default function Workers() {
  const [workers, setWorkers] = useState([])
  const [workerId, setWorkerId] = useState("")

  useEffect(() => {
    let active = true

    async function loadWorkers() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/workers/`)
        if (!response.ok) throw new Error("Failed to load workers")
        const data = await response.json()
        if (active) {
          setWorkers(data)
          setWorkerId(current => current || data[0]?.worker_id || "")
        }
      } catch (error) {
        console.error("Workers page error:", error)
      }
    }

    loadWorkers()
    const timer = setInterval(loadWorkers, 2000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mb-7">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Personnel</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Workers</h1>
        <p className="mt-1 text-sm text-slate-500">Review worker status and latest assigned zones.</p>
      </div>
      {workers.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#111820] p-8 text-sm text-slate-500">Waiting for worker telemetry.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workers.map(worker => <WorkerCard key={worker.worker_id} worker={worker} />)}
          </div>

          <section className="mt-8">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-lg font-semibold text-white">Worker Safety Analytics</h2>
                <p className="mt-1 text-sm text-slate-500">Inspect the selected worker’s recorded safety history.</p>
              </div>
              <select
                value={workerId}
                onChange={event => setWorkerId(event.target.value)}
                className="rounded-lg border border-slate-700 bg-[#111820] px-3 py-2 text-sm text-slate-300 outline-none"
              >
                {workers.map(worker => (
                  <option key={worker.worker_id} value={worker.worker_id}>
                    {worker.worker_id}
                  </option>
                ))}
              </select>
            </div>

            <WorkerSafetyAnalytics workerId={workerId} />
          </section>
        </>
      )}
    </main>
  )
}
