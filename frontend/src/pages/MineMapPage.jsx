import { useEffect, useState } from "react"

import MineMap from "../components/dashboard/MineMap"
import GeoWorkerMap from "../components/dashboard/GeoWorkerMap"

const API_BASE_URL = "http://127.0.0.1:8000"

export default function MineMapPage() {
  const [workers, setWorkers] = useState([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let active = true

    async function loadWorkers() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/monitoring/workers`
        )

        if (!response.ok) {
          throw new Error("Failed to load worker monitoring data")
        }

        const data = await response.json()

        if (active) {
          setWorkers(data.workers || [])
          setConnected(true)
        }
      } catch (error) {
        console.error("Mine map error:", error)

        if (active) {
          setConnected(false)
        }
      }
    }

    loadWorkers()

    const timer = setInterval(loadWorkers, 2000)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const schematicWorkers = workers.map(worker => ({
    ...worker,
    status: worker.safety_status,
    gps_valid: worker.gps?.valid ?? false,
    latitude: worker.gps?.latitude ?? null,
    longitude: worker.gps?.longitude ?? null,
    gps_altitude: worker.gps?.altitude ?? null,
    gps_satellites: worker.gps?.satellites ?? null,
  }))

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mb-7">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
          Operations
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
          Mine Map
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Geographic worker tracking and mine-zone status.
        </p>
      </div>

      <GeoWorkerMap workers={workers} />

      <div className="mt-6">
        <MineMap
          workers={schematicWorkers}
          connected={connected}
        />
      </div>
    </main>
  )
}
