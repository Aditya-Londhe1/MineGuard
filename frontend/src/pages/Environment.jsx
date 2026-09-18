import { useState } from "react"
import ZoneSafetyAnalytics from "../components/analytics/ZoneSafetyAnalytics"

const zones = ["A-03", "Zone A", "Zone B", "Zone C", "Shaft", "Entry"]

export default function Environment() {
  const [zone, setZone] = useState("A-03")

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Conditions</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Environment</h1>
          <p className="mt-1 text-sm text-slate-500">Historical conditions and risk by zone.</p>
        </div>
        <select value={zone} onChange={event => setZone(event.target.value)} className="rounded-lg border border-slate-700 bg-[#111820] px-3 py-2 text-sm text-slate-300 outline-none">
          {zones.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <ZoneSafetyAnalytics zoneId={zone} />
    </main>
  )
}
