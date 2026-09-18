import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Siren,
} from "lucide-react"

import StatCard from "../components/dashboard/StatCard"
import WorkerCard from "../components/dashboard/WorkerCard"
import MineMap from "../components/dashboard/MineMap"
import EmergencyBanner from "../components/dashboard/EmergencyBanner"
import IncidentCenter from "../components/dashboard/IncidentCenter"
import WorkerDetails from "../components/dashboard/WorkerDetails"
import IntelligenceCenter from "../components/intelligence/IntelligenceCenter"
import SupervisorResponseDashboard from "../components/alerts/SupervisorResponseDashboard"
import IncidentResponsePanel from "../components/alerts/IncidentResponsePanel"
import { useEffect, useRef, useState } from "react"

import { useSocket } from "../context/SocketContext"


// A worker is OFFLINE only after 10 full seconds with no reading.
// Workers report every ~5s, so this tolerates a couple of missed cycles
// without flapping, and still detects genuine 10s+ silence.
const OFFLINE_AFTER_MS = 10000


export default function Dashboard() {

  const [workers, setWorkers] = useState([])
  const [incidents, setIncidents] = useState([])
  const { connected: socketConnected, subscribe } = useSocket()
  const [emergency, setEmergency] = useState(null)
  const [predictionAlert, setPredictionAlert] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [predictionData, setPredictionData] = useState(null)
  const [intelligenceRefreshToken, setIntelligenceRefreshToken] = useState(0)
  const selectedWorkerRef = useRef(null)

  useEffect(() => {
    selectedWorkerRef.current = selectedWorker
  }, [selectedWorker])

  useEffect(() => {
    if (!selectedWorker) {
      return
    }

    const updatedWorker = workers.find(
      worker => worker.worker_id === selectedWorker.worker_id
    )

    if (updatedWorker && updatedWorker !== selectedWorker) {
      setSelectedWorker(updatedWorker)
    }
  }, [workers, selectedWorker])

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [])

  // data_age_seconds is computed by the backend on its own clock each
  // request, so freshness never depends on browser/server clock sync.
  const isWorkerActive = (worker) => {
    return (
      typeof worker.data_age_seconds === "number" &&
      worker.data_age_seconds < OFFLINE_AFTER_MS / 1000
    )
  }

  const displayWorkers = workers.map((worker) => {
    const active = isWorkerActive(worker)
    return {
      ...worker,
      isActive: active,
      status: active ? worker.status : "OFFLINE",
    }
  })

  const activeWorkers = displayWorkers.filter(worker => worker.isActive)

  const totalWorkers = activeWorkers.length

  const safeWorkers =
    activeWorkers.filter(
      worker => worker.status === "SAFE"
    ).length

  const warningWorkers =
    activeWorkers.filter(
      worker => worker.status === "WARNING"
    ).length

  const criticalWorkers =
    activeWorkers.filter(
      worker => worker.status === "CRITICAL"
    ).length

  const workerActiveRef = useRef({})

  useEffect(() => {

    displayWorkers.forEach((worker) => {

      const wasActive = workerActiveRef.current[worker.worker_id]
      const offlineId = `offline-${worker.worker_id}`

      if (wasActive === undefined) {
        workerActiveRef.current[worker.worker_id] = worker.isActive
        return
      }

      if (wasActive && !worker.isActive) {

        const lastSeen = worker.timestamp || worker.last_updated

        setIncidents((current) => [
          {
            id: offlineId,
            worker_id: worker.worker_id,
            alert_type: "SYSTEM_EVENT",
            event_type: "DEVICE_OFFLINE",
            source: "SYSTEM",
            priority: "P2",
            severity: "WARNING",
            risk_score: 0,
            message: `Worker ${worker.worker_id} has gone offline — no data received for over ${OFFLINE_AFTER_MS / 1000} seconds. Last seen in ${worker.zone || "an unknown zone"}${lastSeen ? ` at ${new Date(lastSeen).toLocaleTimeString()}` : ""}.`,
            zone: worker.zone,
            timestamp: new Date().toISOString(),
            resolved: false,
            synthetic: true,
          },
          ...current.filter(incident => incident.id !== offlineId),
        ])

      } else if (!wasActive && worker.isActive) {

        setIncidents((current) =>
          current.map(incident =>
            incident.id === offlineId && incident.synthetic
              ? { ...incident, resolved: true }
              : incident
          )
        )

      }

      workerActiveRef.current[worker.worker_id] = worker.isActive

    })

  }, [displayWorkers])

  const loadIncidents = async () => {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/api/alerts/"
      )

      const data = await response.json()

      setIncidents((current) => {
        const synthetic = current.filter(incident => incident.synthetic)
        return [...synthetic, ...data]
      })

    } catch (error) {

      console.error(
        "Failed to load incidents:",
        error
      )

    }

  }

  const loadWorkers = async () => {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/api/workers/"
      )

      const data = await response.json()

      setWorkers((currentWorkers) => {
        const workersById = new Map(
          currentWorkers.map(worker => [worker.worker_id, worker])
        )

        data.forEach(worker => {
          const liveWorker = workersById.get(worker.worker_id)

          // REST data is always the freshest snapshot; only keep
          // websocket-only fields (e.g. risk_score) that REST omits.
          workersById.set(worker.worker_id, {
            ...liveWorker,
            ...worker,
          })
        })

        return Array.from(workersById.values())
      })

    } catch (error) {

      console.error(
        "Failed to load workers:",
        error
      )

    }

  }

  useEffect(() => {

    loadIncidents()
    loadWorkers()

    const refreshTimer = setInterval(() => {
      loadIncidents()
      loadWorkers()
    }, 1000)

    return () => {
      clearInterval(refreshTimer)
    }

  }, [])

  async function acknowledgeIncident(incident) {

    if (incident.synthetic) {
      setIncidents((current) =>
        current.map(item =>
          item.id === incident.id
            ? { ...item, event_state: "ACKNOWLEDGED" }
            : item
        )
      )
      return
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/api/alerts/${incident.id}/acknowledge`,
        {
          method: "PATCH",
        }
      )

      if (!response.ok) {

        throw new Error(
          "Failed to acknowledge incident"
        )

      }

      await loadIncidents()

    } catch (error) {

      console.error(
        "Failed to acknowledge incident:",
        error
      )

    }

  }

  async function resolveIncident(incident) {

    if (incident.synthetic) {
      setIncidents((current) =>
        current.map(item =>
          item.id === incident.id
            ? { ...item, resolved: true }
            : item
        )
      )
      return
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/api/alerts/${incident.id}/resolve`,
        {
          method: "PATCH",
        }
      )

      if (!response.ok) {

        throw new Error(
          "Failed to resolve incident"
        )

      }

      await loadIncidents()

      if (
        emergency &&
        emergency.worker_id === incident.worker_id
      ) {

        setEmergency(null)

      }

    } catch (error) {

      console.error(
        "Failed to resolve incident:",
        error
      )

    }

  }

  async function markIncidentUnderReview(incident) {

    if (incident.synthetic) {
      setIncidents((current) =>
        current.map(item =>
          item.id === incident.id
            ? { ...item, event_state: "UNDER_REVIEW" }
            : item
        )
      )
      return
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/api/alerts/${incident.id}/under-review`,
        {
          method: "PATCH",
        }
      )

      if (!response.ok) {

        throw new Error(
          "Failed to move incident under review"
        )

      }

      await loadIncidents()

    } catch (error) {

      console.error(
        "Failed to move incident under review:",
        error
      )

    }

  }

  useEffect(() => {

    if (!selectedWorker || !predictionData) {
      setPredictionAlert(null)
      return
    }

    if (predictionData.predicted_risk >= 55) {

      setPredictionAlert({
        worker_id: selectedWorker.worker_id,
        message: `Predictive escalation: ${predictionData.status} risk trajectory detected`,
        risk_score: predictionData.predicted_risk,
        zone: selectedWorker.zone || "Unknown",
        label: "Predictive Escalation",
        source: "prediction",
        timestamp: new Date().toISOString(),
      })

      return
    }

    setPredictionAlert(null)

  }, [selectedWorker, predictionData])

  useEffect(() => {

    const unsubscribe = subscribe(

      (event) => {

        if (event.type === "alert") {

          const newIncident = {
            id: event.id ?? `live-${Date.now()}`,

            worker_id: event.worker_id,

            alert_type: "SAFETY_EVENT",

            event_type: event.event_type,

            source: event.source,

            priority: event.priority,

            severity: event.severity,

            risk_score: event.risk_score,

            message: event.message,

            zone: event.zone,

            timestamp: event.timestamp,

            resolved: false,
          }

          setIncidents((current) => {

            const existing =
              current.find(
                incident =>
                  incident.worker_id ===
                  event.worker_id &&
                  !incident.resolved &&
                  !incident.synthetic
              )

            if (existing) {

              return current.map(
                incident =>
                  incident.id === existing.id
                    ? {
                        ...incident,
                        severity: event.severity,
                        risk_score: event.risk_score,
                        message: event.message,
                        zone: event.zone,
                        timestamp: event.timestamp,
                      }
                    : incident
              )

            }

            return [
              newIncident,
              ...current,
            ]

          })

          if (event.severity === "CRITICAL") {

            setEmergency(event)

          }

          return
        }

        if (event.type !== "sensor_update") {
          return
        }

        const worker = selectedWorkerRef.current

        if (
          worker &&
          event.worker_id === worker.worker_id
        ) {

          setIntelligenceRefreshToken(current => current + 1)
        }

        setWorkers((currentWorkers) => {

          const existing = currentWorkers.find(
            worker =>
              worker.worker_id === event.worker_id
          )

          const nextWorker = {

            worker_id: event.worker_id,

            name: existing?.name || `Worker ${event.worker_id}`,

            status: event.status,

            heart_rate: event.heart_rate,

            spo2: event.spo2,

            temperature: event.temperature,

            zone: event.zone,

            methane: event.methane,

            co: event.co,

            h2s: event.h2s,

            battery: event.battery,

            risk_score: event.risk_score,

            last_updated: event.timestamp,

            data_age_seconds: event.data_age_seconds ?? 0,

            latitude: event.gps?.latitude ?? existing?.latitude ?? null,

            longitude: event.gps?.longitude ?? existing?.longitude ?? null,

            gps_altitude: event.gps?.altitude ?? existing?.gps_altitude ?? null,

            gps_satellites: event.gps?.satellites ?? existing?.gps_satellites ?? null,

            gps_valid: event.gps?.valid ?? existing?.gps_valid ?? false,
          }

          if (!existing) {

            return [
              ...currentWorkers,
              nextWorker
            ]

          }

          return currentWorkers.map(
            current =>
              current.worker_id === event.worker_id
                ? nextWorker
                : current
          )

        })

      }

    )

    return () => {

      unsubscribe()

    }

  }, [subscribe])


  const activeAlert = emergency ?? predictionAlert

  return (

    <main className="p-4 sm:p-6 lg:p-8">

      {/* Page header */}

      <div className="mb-7">

        <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
          Live Operations
        </p>

        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

          <div>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              Mine Safety Overview
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Real-time visibility across workers and mine zones.
            </p>

          </div>

          <div className="flex items-center gap-2">

            <span
              className={`h-2 w-2 rounded-full ${
                socketConnected
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-red-400"
              }`}
            />

            <span
              className={`text-xs ${
                socketConnected
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >

              {socketConnected
                ? "Live data connected"
                : "Live data disconnected"}

            </span>

          </div>

        </div>

      </div>


      <EmergencyBanner
        alert={activeAlert}
        onClose={() => {
          setEmergency(null)
          setPredictionAlert(null)
        }}
      />

      <div className="mt-6">
        <SupervisorResponseDashboard />
      </div>

      <div className="mt-6">
        <IncidentResponsePanel />
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Total Workers"
          value={totalWorkers}
          description="Live helmet devices"
          icon={Users}
        />

        <StatCard
          label="Safe"
          value={safeWorkers}
          description="No immediate risk detected"
          icon={ShieldCheck}
          type="safe"
        />

        <StatCard
          label="Warning"
          value={warningWorkers}
          description="Requires monitoring"
          icon={AlertTriangle}
          type="warning"
        />

        <StatCard
          label="Critical"
          value={criticalWorkers}
          description="Immediate attention required"
          icon={Siren}
          type="critical"
        />

      </div>


      {/* Main monitoring area */}

      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(520px,1fr)]">

        <div className="space-y-6">

          <MineMap
            workers={activeWorkers}
            connected={socketConnected}
            onWorkerClick={(worker) => {
              setSelectedWorker(worker)
            }}
          />

          <WorkerDetails
            worker={selectedWorker}
            onClose={() => {
              setSelectedWorker(null)
            }}
          />

        </div>

        <div className="space-y-6">

          <IntelligenceCenter
            worker={selectedWorker}
            onPredictionChange={setPredictionData}
            refreshToken={intelligenceRefreshToken}
          />

          <IncidentCenter
            incidents={incidents}
            onAcknowledge={acknowledgeIncident}
            onUnderReview={markIncidentUnderReview}
            onResolve={resolveIncident}
          />

        </div>

      </div>


      {/* Worker section */}

      <div className="mt-8">

        <div className="mb-4 flex items-end justify-between">

          <div>

            <h2 className="text-sm font-semibold text-white">
              Worker Monitoring
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Live health and safety status
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          {displayWorkers.map((worker) => (

            <WorkerCard
              key={worker.worker_id}
              worker={worker}
            />

          ))}

        </div>

      </div>

    </main>
  )
}
