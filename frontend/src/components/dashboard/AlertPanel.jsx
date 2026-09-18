import {
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react"

import { useEffect, useState } from "react"

import { getAlerts } from "../../services/api"


export default function AlertPanel() {

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)


  async function loadAlerts() {

    try {

      setError(false)

      const data = await getAlerts()

      setAlerts(data)

    } catch (err) {

      console.error(err)

      setError(true)

    } finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    loadAlerts()

    const interval = setInterval(
      loadAlerts,
      5000
    )

    return () => clearInterval(interval)

  }, [])


  return (

    <div className="rounded-xl border border-slate-800 bg-[#111820]">

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

        <div>

          <h3 className="text-sm font-semibold text-white">
            Active Incidents
          </h3>

          <p className="mt-0.5 text-xs text-slate-500">
            Requires attention
          </p>

        </div>

        <AlertTriangle
          size={17}
          className="text-red-400"
        />

      </div>


      <div className="divide-y divide-slate-800">

        {loading && (

          <div className="px-5 py-8 text-center text-xs text-slate-500">
            Loading alerts...
          </div>

        )}


        {error && (

          <div className="px-5 py-8 text-center text-xs text-red-400">
            Unable to connect to safety server.
          </div>

        )}


        {!loading && !error && alerts.length === 0 && (

          <div className="px-5 py-8 text-center">

            <p className="text-sm text-emerald-400">
              No active incidents
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Mine environment is currently stable.
            </p>

          </div>

        )}


        {!loading && !error && alerts.map((alert) => {

          const critical =
            alert.severity === "CRITICAL"


          return (

            <div
              key={alert.id}
              className="group px-5 py-4 transition hover:bg-slate-800/30"
            >

              <div className="flex items-start gap-3">

                <div
                  className={`mt-1 h-2 w-2 rounded-full ${
                    critical
                      ? "bg-red-500"
                      : "bg-amber-400"
                  }`}
                />

                <div className="min-w-0 flex-1">

                  <div className="flex items-center justify-between">

                    <p className="text-xs font-semibold text-white">
                      {alert.worker_id}
                    </p>

                    <span className="text-[10px] text-slate-600">
                      {new Date(
                        alert.timestamp
                      ).toLocaleTimeString()}
                    </span>

                  </div>


                  <p className="mt-1 text-xs text-slate-400">
                    {alert.message}
                  </p>


                  <p className="mt-1 text-[10px] text-slate-600">
                    {alert.zone}
                  </p>

                </div>


                <ArrowUpRight
                  size={15}
                  className="text-slate-700 transition group-hover:text-slate-400"
                />

              </div>

            </div>

          )

        })}

      </div>

    </div>
  )
}