import {
  X,
  HeartPulse,
  Droplets,
  Thermometer,
  Battery,
  MapPin,
  Activity,
  Navigation,
} from "lucide-react"

export default function WorkerDetails({
  worker,
  onClose,
}) {

  if (!worker) {
    return null
  }

  return (

    <div className="max-h-[560px] w-full overflow-y-auto rounded-xl border border-slate-800 bg-[#111820] shadow-2xl">

      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

        <div>

          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Worker Profile
          </p>

          <h3 className="mt-1 text-lg font-bold text-white">
            {worker.worker_id}
          </h3>

        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
        >

          <X size={18} />

        </button>

      </div>

      {/* STATUS */}

      <div className="border-b border-slate-800 px-5 py-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs text-slate-500">
              Current Status
            </p>

            <p
              className={`mt-1 text-lg font-bold ${
                worker.status === "CRITICAL"
                  ? "text-red-400"
                  : worker.status === "WARNING"
                    ? "text-amber-400"
                    : "text-emerald-400"
              }`}
            >
              {worker.status}
            </p>

          </div>

          <div className="text-right">

            <p className="text-xs text-slate-500">
              Risk Score
            </p>

            <p className="mt-1 text-lg font-bold text-white">
              {worker.risk_score}/100
            </p>

          </div>

        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">

          <MapPin size={13} />

          {worker.zone}

        </div>

        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Navigation
                size={13}
                className={
                  worker.gps_valid
                    ? "text-emerald-400"
                    : "text-slate-600"
                }
              />

              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                GPS Location
              </span>

            </div>

            <span
              className={`text-[9px] font-medium ${
                worker.gps_valid
                  ? "text-emerald-400"
                  : "text-slate-600"
              }`}
            >
              {worker.gps_valid ? "FIXED" : "NO FIX"}
            </span>

          </div>

          {worker.gps_valid &&
          worker.latitude != null &&
          worker.longitude != null ? (

            <div className="mt-3 grid grid-cols-2 gap-2">

              <div>
                <p className="text-[9px] text-slate-600">
                  LATITUDE
                </p>

                <p className="mt-1 text-xs font-medium text-white">
                  {Number(worker.latitude).toFixed(6)}
                </p>
              </div>

              <div>
                <p className="text-[9px] text-slate-600">
                  LONGITUDE
                </p>

                <p className="mt-1 text-xs font-medium text-white">
                  {Number(worker.longitude).toFixed(6)}
                </p>
              </div>

              <div>
                <p className="text-[9px] text-slate-600">
                  ALTITUDE
                </p>

                <p className="mt-1 text-xs font-medium text-white">
                  {worker.gps_altitude != null
                    ? `${Number(worker.gps_altitude).toFixed(1)} m`
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-[9px] text-slate-600">
                  SATELLITES
                </p>

                <p className="mt-1 text-xs font-medium text-white">
                  {worker.gps_satellites ?? "-"}
                </p>
              </div>

            </div>

          ) : (

            <p className="mt-2 text-[10px] leading-4 text-slate-600">
              GPS fix unavailable. Previously recorded location, if available,
              remains the last known position.
            </p>

          )}

        </div>

      </div>

      {/* VITALS */}

      <div className="p-5">

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Live Telemetry
        </p>

        <div className="grid grid-cols-2 gap-3">

          <Metric
            icon={HeartPulse}
            label="Heart Rate"
            value={`${worker.heart_rate} BPM`}
          />

          <Metric
            icon={Droplets}
            label="SpO₂"
            value={`${worker.spo2}%`}
          />

          <Metric
            icon={Thermometer}
            label="Temperature"
            value={`${worker.temperature}°C`}
          />

          <Metric
            icon={Battery}
            label="Battery"
            value={`${worker.battery}%`}
          />

          <Metric
            icon={Activity}
            label="Methane"
            value={worker.methane}
          />

          <Metric
            icon={Activity}
            label="CO"
            value={worker.co}
          />

          <Metric
            icon={Activity}
            label="H₂S"
            value={worker.h2s}
          />

        </div>

      </div>

      {/* ALERTS */}

      {worker.status !== "SAFE" && (

        <div className="mx-5 rounded-lg border border-red-500/20 bg-red-500/5 p-4">

          <p className="text-xs font-semibold text-red-400">
            Safety Conditions
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-400">

            {worker.fall_detected &&
              "Fall detected. "}

            {worker.sos &&
              "SOS activated. "}

            Elevated environmental or biometric
            readings require attention.

          </p>

        </div>

      )}

    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}) {

  return (

    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">

      <Icon
        size={15}
        className="text-slate-500"
      />

      <p className="mt-2 text-[10px] text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-white">
        {value}
      </p>

    </div>

  )
}
