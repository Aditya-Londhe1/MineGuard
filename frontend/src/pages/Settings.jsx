import { useState } from "react"

export default function Settings() {
  const [notifications, setNotifications] = useState(true)
  const [compact, setCompact] = useState(false)

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mb-7">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Configuration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Control local supervisor display preferences.</p>
      </div>
      <section className="max-w-2xl divide-y divide-slate-800 rounded-xl border border-slate-800 bg-[#111820]">
        <label className="flex cursor-pointer items-center justify-between gap-6 p-5">
          <span><span className="block text-sm font-medium text-white">Critical alert notifications</span><span className="mt-1 block text-xs text-slate-500">Keep direct safety events prominent.</span></span>
          <input type="checkbox" checked={notifications} onChange={event => setNotifications(event.target.checked)} className="h-4 w-4 accent-emerald-500" />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-6 p-5">
          <span><span className="block text-sm font-medium text-white">Compact worker cards</span><span className="mt-1 block text-xs text-slate-500">Use a denser worker monitoring layout.</span></span>
          <input type="checkbox" checked={compact} onChange={event => setCompact(event.target.checked)} className="h-4 w-4 accent-emerald-500" />
        </label>
      </section>
    </main>
  )
}
