import {
  AlertOctagon,
  X,
} from "lucide-react"

export default function EmergencyBanner({
  alert,
  onClose,
}) {

  if (!alert) {
    return null
  }

  return (

    <div className="mb-6 overflow-hidden rounded-xl border border-red-500/30 bg-red-500/5">

      <div className="flex items-start gap-4 p-5">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10">

          <AlertOctagon
            size={24}
            className="text-red-400"
          />

        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400">
              {alert.label || "Critical Incident"}
            </span>

            <span className="text-xs text-slate-600">
              •
            </span>

            <span className="text-xs font-semibold text-white">
              {alert.worker_id}
            </span>

          </div>

          <h2 className="mt-1 text-lg font-bold text-white">

            {alert.message}

          </h2>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">

            <span>
              Zone: {alert.zone}
            </span>

            <span>
              Risk: {alert.risk_score}/100
            </span>

          </div>

        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-white"
        >

          <X size={18} />

        </button>

      </div>

    </div>
  )
}
