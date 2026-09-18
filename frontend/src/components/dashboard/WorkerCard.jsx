import {
  HeartPulse,
  Wind,
  Thermometer,
  MapPin,
} from "lucide-react"

import StatusBadge from "../common/StatusBadge"

export default function WorkerCard({ worker }) {

  const offline = worker.status === "OFFLINE"

  return (

    <div
      className={`rounded-xl border border-slate-800 bg-[#111820] p-5 transition hover:-translate-y-0.5 hover:border-slate-700 ${
        offline ? "opacity-50" : ""
      }`}
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-semibold text-white">
            {worker.worker_id}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            {worker.name}
          </p>

        </div>

        <StatusBadge status={worker.status} />

      </div>


      <div className="mt-5 grid grid-cols-3 gap-3">

        <div className="rounded-lg bg-slate-900/60 p-3">

          <HeartPulse
            size={15}
            className="text-slate-500"
          />

          <p className="mt-2 text-sm font-semibold text-white">
            {worker.heart_rate}
          </p>

          <p className="text-[10px] text-slate-600">
            BPM
          </p>

        </div>


        <div className="rounded-lg bg-slate-900/60 p-3">

          <Wind
            size={15}
            className="text-slate-500"
          />

          <p className="mt-2 text-sm font-semibold text-white">
            {worker.spo2}%
          </p>

          <p className="text-[10px] text-slate-600">
            SpO₂
          </p>

        </div>


        <div className="rounded-lg bg-slate-900/60 p-3">

          <Thermometer
            size={15}
            className="text-slate-500"
          />

          <p className="mt-2 text-sm font-semibold text-white">
            {worker.temperature}°
          </p>

          <p className="text-[10px] text-slate-600">
            TEMP
          </p>

        </div>

      </div>


      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">

        <MapPin size={13} />

        {offline ? "No signal" : worker.zone}

      </div>

    </div>
  )
}