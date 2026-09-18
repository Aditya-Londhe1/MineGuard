import {
  LayoutDashboard,
  Users,
  Map,
  AlertTriangle,
  Activity,
  ChartNoAxesCombined,
  Brain,
  Settings,
  ShieldCheck,
} from "lucide-react"

const menuItems = [
  {
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    label: "Workers",
    icon: Users,
  },
  {
    label: "Mine Map",
    icon: Map,
  },
  {
    label: "Alerts",
    icon: AlertTriangle,
  },
  {
    label: "Environment",
    icon: Activity,
  },
  {
    label: "Analytics",
    icon: ChartNoAxesCombined,
  },
  {
    label: "AI Insights",
    icon: Brain,
  },
  {
    label: "Settings",
    icon: Settings,
  },
]

export default function Sidebar({
  activePage,
  onNavigate,
}) {
  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-[#0c1219]/95 backdrop-blur lg:static lg:flex lg:w-64 lg:min-h-screen lg:flex-col lg:border-r lg:border-t-0 lg:bg-[#0c1219]">

      {/* Logo */}

      <div className="hidden items-center gap-3 border-b border-slate-800 px-6 py-6 lg:flex">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">

          <ShieldCheck
            size={23}
            className="text-emerald-400"
          />

        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            MineGuard
          </h1>

          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Safety Intelligence
          </p>
        </div>

      </div>


      {/* Navigation */}

      <nav className="px-2 py-2 lg:flex-1 lg:px-3 lg:py-5">

        <p className="mb-3 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 lg:block">
          Command Center
        </p>

        <div className="flex items-center gap-1 overflow-x-auto lg:block lg:space-y-1 lg:overflow-visible">

          {menuItems.map((item) => {

            const Icon = item.icon

            const active = activePage === item.label

            return (
              <button
                key={item.label}
                onClick={() => onNavigate?.(item.label)}
                type="button"
                className={`flex w-16 shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] transition lg:w-full lg:flex-none lg:flex-row lg:gap-3 lg:px-3 lg:py-3 lg:text-sm ${
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >

                <Icon size={18} />

                <span className="truncate">
                  {item.label}
                </span>

              </button>
            )

          })}

        </div>

      </nav>
    </aside>
  )
}
