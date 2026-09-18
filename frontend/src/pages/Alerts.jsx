import IncidentHistory from "../components/analytics/IncidentHistory"

export default function Alerts() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mb-7">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Response</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Alerts</h1>
        <p className="mt-1 text-sm text-slate-500">Review, filter, and resolve recorded safety incidents.</p>
      </div>
      <IncidentHistory />
    </main>
  )
}
