import {
  MapPin,
  Users,
  Radio,
  Navigation,
} from "lucide-react"

const zonePositions = {
  "Zone A": {
    left: "70%",
    top: "25%",
  },

  "Zone B": {
    left: "35%",
    top: "48%",
  },

  "Zone C": {
    left: "68%",
    top: "70%",
  },

  "Shaft": {
    left: "48%",
    top: "82%",
  },

  "Entry": {
    left: "12%",
    top: "18%",
  },
}

function getStatusClass(status) {

  if (status === "CRITICAL") {

    return {
      marker: "bg-red-500",
      ring: "ring-red-500/30",
      text: "text-red-400",
    }

  }

  if (status === "WARNING") {

    return {
      marker: "bg-amber-400",
      ring: "ring-amber-400/30",
      text: "text-amber-400",
    }

  }

  return {
    marker: "bg-emerald-400",
    ring: "ring-emerald-400/30",
    text: "text-emerald-400",
  }
}

export default function MineMap({
  workers = [],
  connected = false,
  onWorkerClick,
}) {

  return (

    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#111820]">

      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

        <div>

          <div className="flex items-center gap-2">

            <h3 className="text-sm font-semibold text-white">
              Live Mine Map
            </h3>

            <span
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-medium ${
                connected
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >

              <Radio
                size={10}
                className={connected ? "animate-pulse" : ""}
              />

              {connected ? "LIVE" : "OFFLINE"}

            </span>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            Real-time worker locations and safety status
          </p>

        </div>

        <div className="flex items-center gap-4 text-[10px]">

          <div className="flex items-center gap-1.5">

            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-slate-500">
              Safe
            </span>

          </div>

          <div className="flex items-center gap-1.5">

            <span className="h-2 w-2 rounded-full bg-amber-400" />

            <span className="text-slate-500">
              Warning
            </span>

          </div>

          <div className="flex items-center gap-1.5">

            <span className="h-2 w-2 rounded-full bg-red-500" />

            <span className="text-slate-500">
              Critical
            </span>

          </div>

        </div>

      </div>

      {/* MAP */}

      <div className="relative h-[500px] overflow-hidden bg-[#0b1117]">

        {/* GRID */}

        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* TUNNELS */}

        <div className="absolute left-[10%] top-[18%] h-[12px] w-[72%] rounded-full bg-slate-700/70" />

        <div className="absolute left-[34%] top-[18%] h-[55%] w-[12px] rounded-full bg-slate-700/70" />

        <div className="absolute left-[34%] top-[48%] h-[12px] w-[42%] rounded-full bg-slate-700/70" />

        <div className="absolute left-[68%] top-[25%] h-[48%] w-[12px] rounded-full bg-slate-700/70" />

        <div className="absolute left-[34%] top-[70%] h-[12px] w-[35%] rounded-full bg-slate-700/70" />

        <div className="absolute left-[48%] top-[70%] h-[100px] w-[12px] rounded-full bg-slate-700/70" />

        {/* ZONE LABELS */}

        {Object.entries(zonePositions).map(
          ([zone, position]) => (

            <div
              key={zone}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: position.left,
                top: position.top,
              }}
            >

              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-600">

                <MapPin size={11} />

                {zone}

              </div>

            </div>

          )
        )}

        {/* WORKERS */}

        {workers.map((worker) => {

          const position =
            zonePositions[worker.zone]
            || zonePositions["Entry"]

          const status =
            getStatusClass(worker.status)

          return (

            <button
              key={worker.worker_id}
              onClick={() =>
                onWorkerClick?.(worker)
              }
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: position.left,
                top: position.top,
              }}
            >

              <div className="relative">

                {/* PULSE */}

                <div
                  className={`absolute -inset-3 rounded-full ring-4 ${status.ring} ${
                    worker.status === "CRITICAL"
                      ? "animate-ping"
                      : ""
                  }`}
                />

                {/* MARKER */}

                <div
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full ${status.marker} shadow-lg transition group-hover:scale-110`}
                >

                  <Users
                    size={16}
                    className="text-slate-950"
                  />

                </div>

                {/* LABEL */}

                <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-[#111820] px-3 py-2 shadow-xl">

                  <p className="text-[10px] font-semibold text-white">
                    {worker.worker_id}
                  </p>

                  <p className={`text-[9px] ${status.text}`}>
                    {worker.status}
                  </p>

                  <div className="mt-1 flex items-center justify-center gap-1">

                    <Navigation
                      size={9}
                      className={
                        worker.gps_valid
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }
                    />

                    <span
                      className={`text-[8px] ${
                        worker.gps_valid
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }`}
                    >
                      {worker.gps_valid
                        ? "GPS FIXED"
                        : "GPS NO FIX"}
                    </span>

                  </div>

                </div>

              </div>

            </button>

          )

        })}

        {/* EMPTY STATE */}

        {workers.length === 0 && (

          <div className="absolute inset-0 flex items-center justify-center">

            <div className="text-center">

              <Users
                size={28}
                className="mx-auto text-slate-700"
              />

              <p className="mt-3 text-sm text-slate-500">
                Waiting for worker telemetry
              </p>

              <p className="mt-1 text-xs text-slate-700">
                Connect a helmet to begin live tracking
              </p>

            </div>

          </div>

        )}

      </div>

      {/* GPS STATUS */}

      <div className="border-t border-slate-800 px-5 py-4">

        <div className="mb-3 flex items-center justify-between">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              GPS Tracking
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Latest reported worker positions
            </p>

          </div>

          <Navigation
            size={15}
            className="text-slate-500"
          />

        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

          {workers.map((worker) => (

            <div
              key={`gps-${worker.worker_id}`}
              className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
            >

              <div className="flex items-center justify-between">

                <span className="text-xs font-semibold text-white">
                  {worker.worker_id}
                </span>

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

                <div className="mt-2 space-y-1">

                  <p className="text-[10px] text-slate-500">
                    Lat:{" "}
                    <span className="text-slate-300">
                      {Number(worker.latitude).toFixed(6)}
                    </span>
                  </p>

                  <p className="text-[10px] text-slate-500">
                    Lon:{" "}
                    <span className="text-slate-300">
                      {Number(worker.longitude).toFixed(6)}
                    </span>
                  </p>

                  <div className="flex gap-3">

                    <p className="text-[10px] text-slate-500">
                      Alt:{" "}
                      <span className="text-slate-300">
                        {worker.gps_altitude != null
                          ? `${Number(worker.gps_altitude).toFixed(1)} m`
                          : "-"}
                      </span>
                    </p>

                    <p className="text-[10px] text-slate-500">
                      SAT:{" "}
                      <span className="text-slate-300">
                        {worker.gps_satellites ?? "-"}
                      </span>
                    </p>

                  </div>

                </div>

              ) : (

                <p className="mt-2 text-[10px] text-slate-600">
                  No valid GPS fix. Last known location may be available.
                </p>

              )}

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}