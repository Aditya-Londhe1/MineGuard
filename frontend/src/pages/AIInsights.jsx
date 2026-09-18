import { useEffect, useState } from "react"
import IntelligenceCenter from "../components/intelligence/IntelligenceCenter"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

export default function AIInsights() {
  const [workers, setWorkers] = useState([])
  const [workerId, setWorkerId] = useState("")

  useEffect(() => {
    async function loadWorkers() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/workers/`)
        if (!response.ok) throw new Error("Failed to load workers")
        const data = await response.json()
        setWorkers(data)
        setWorkerId(current => current || data[0]?.worker_id || "")
      } catch (error) {
        console.error("AI insights error:", error)
      }
    }
    loadWorkers()
  }, [])

  const worker = workers.find(item => item.worker_id === workerId) || (workerId ? {worker_id: workerId} : null)

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Decision support</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">AI Insights</h1>
          <p className="mt-1 text-sm text-slate-500">Detection, prediction, recommendation, and evidence.</p>
        </div>
        <select value={workerId} onChange={event => setWorkerId(event.target.value)} className="rounded-lg border border-slate-700 bg-[#111820] px-3 py-2 text-sm text-slate-300 outline-none">
          <option value="">Select worker</option>
          {workers.map(item => <option key={item.worker_id} value={item.worker_id}>{item.worker_id}</option>)}
        </select>
      </div>
      <IntelligenceCenter worker={worker} />
    </main>
  )
}
