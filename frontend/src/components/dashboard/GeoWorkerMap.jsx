import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet"

import { useEffect } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

function getMarkerColor(status) {
  if (status === "CRITICAL") {
    return "#ef4444"
  }

  if (status === "WARNING") {
    return "#f59e0b"
  }

  return "#34d399"
}

function createWorkerIcon(worker) {
  const color = getMarkerColor(worker.safety_status || worker.status)

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid #0f172a;
        box-shadow: 0 0 0 5px ${color}33;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #020617;
        font-size: 13px;
        font-weight: 700;
      ">
        ${worker.worker_id?.replace("W", "") || "?"}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
}

function MapViewport({ workers }) {
  const map = useMap()

  useEffect(() => {
    const validWorkers = workers.filter(
      worker =>
        worker.gps?.valid &&
        worker.gps?.latitude != null &&
        worker.gps?.longitude != null
    )

    if (validWorkers.length === 0) {
      return
    }

    if (validWorkers.length === 1) {
      const worker = validWorkers[0]

      map.setView(
        [worker.gps.latitude, worker.gps.longitude],
        16
      )

      return
    }

    const bounds = validWorkers.map(worker => [
      worker.gps.latitude,
      worker.gps.longitude,
    ])

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 17,
    })
  }, [workers, map])

  return null
}

export default function GeoWorkerMap({ workers = [] }) {
  const validWorkers = workers.filter(
    worker =>
      worker.gps?.valid &&
      worker.gps?.latitude != null &&
      worker.gps?.longitude != null
  )

  const initialPosition =
    validWorkers.length > 0
      ? [
          validWorkers[0].gps.latitude,
          validWorkers[0].gps.longitude,
        ]
      : [20.5937, 78.9629]

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#111820]">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              Geographic Worker Map
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Actual GPS positions reported by worker helmets
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              GPS FIXED
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-400">
              {validWorkers.length}
            </p>
          </div>
        </div>
      </div>

      <div className="h-[560px]">
        <MapContainer
          center={initialPosition}
          zoom={16}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewport workers={workers} />

          {validWorkers.map(worker => (
            <Marker
              key={worker.worker_id}
              position={[
                worker.gps.latitude,
                worker.gps.longitude,
              ]}
              icon={createWorkerIcon(worker)}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-semibold">
                    {worker.worker_id}
                  </p>
                  <p>{worker.name}</p>
                  <hr className="my-2" />
                  <p>
                    Safety: <strong>{worker.safety_status}</strong>
                  </p>
                  <p>Zone: {worker.zone || "Unknown"}</p>
                  <p>
                    Latitude: {Number(worker.gps.latitude).toFixed(6)}
                  </p>
                  <p>
                    Longitude: {Number(worker.gps.longitude).toFixed(6)}
                  </p>
                  <p>
                    Altitude: {worker.gps.altitude != null
                      ? `${Number(worker.gps.altitude).toFixed(1)} m`
                      : "-"}
                  </p>
                  <p>Satellites: {worker.gps.satellites ?? "-"}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="border-t border-slate-800 px-5 py-4">
        <div className="flex flex-wrap gap-5 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-slate-500">SAFE</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-slate-500">WARNING</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-slate-500">CRITICAL</span>
          </div>

          <div className="ml-auto text-slate-600">
            {workers.length - validWorkers.length} worker(s) without GPS fix
          </div>
        </div>
      </div>
    </div>
  )
}
