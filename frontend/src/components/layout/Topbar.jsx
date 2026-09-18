import {
  Bell,
  CircleUserRound,
  Wifi,
} from "lucide-react"
import { useEffect, useState } from "react"
import { getResponseQueue } from "../../services/alerts"
import { useSocket } from "../../context/SocketContext"

export default function Topbar({
  activePage = "Overview",
  onNavigate,
}) {

  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const { connected } = useSocket()

  async function loadNotifications() {
    try {
      const data = await getResponseQueue()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Notification loading error:", error)
    }
  }

  useEffect(() => {
    loadNotifications()

    const interval = setInterval(loadNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-[#0c1219]/95 px-4 sm:px-6">

      <div>

        <p className="text-xs text-slate-500">
          Mine Operations
        </p>

        <h2 className="text-sm font-semibold text-white">
          {activePage === "Overview"
            ? "Safety Command Center"
            : activePage}
        </h2>

      </div>


      <div className="flex items-center gap-4">

        {/* Live status */}

        <div
          className={`hidden sm:flex items-center gap-2 rounded-full border px-3 py-1.5 ${
            connected
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-red-500/20 bg-red-500/5"
          }`}
        >

          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
            }`}
          />

          <span
            className={`text-xs font-medium ${
              connected ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {connected ? "SYSTEM LIVE" : "SYSTEM OFFLINE"}
          </span>

          <Wifi
            size={13}
            className={connected ? "text-emerald-400" : "text-red-400"}
          />

        </div>


        <div className="relative">

        <button
          type="button"
          aria-label="Notifications"
          onClick={() => setOpen(value => !value)}
          className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >

          <Bell size={19} />

          {notifications.length > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}

        </button>

        {open && (
          <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-slate-700 bg-[#111820] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Notifications</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Active response incidents</p>
              </div>
              <span className="text-xs text-slate-500">{notifications.length}</span>
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No active safety notifications.
              </div>
            ) : (
              <div className="max-h-80 overflow-auto">
                {notifications.slice(0, 8).map(notification => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onNavigate?.("Alerts")
                    }}
                    className="w-full border-b border-slate-800 px-4 py-3 text-left hover:bg-slate-800/70"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-red-300">
                        {notification.priority || notification.severity || "ALERT"}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {notification.worker_id || "Unknown worker"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-300">
                      {notification.event_type || notification.message || "Safety incident"}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-slate-500">
                      {notification.zone || "Unknown zone"} · {notification.event_state || "ACTIVE"}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onNavigate?.("Alerts")
              }}
              className="w-full border-t border-slate-700 px-4 py-3 text-xs font-medium text-emerald-400 hover:bg-slate-800"
            >
              Open incident response
            </button>
          </div>
        )}

        </div>


        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">

          <CircleUserRound size={20} />

        </button>

      </div>

    </header>
  )
}
