export default function StatCard({
  label,
  value,
  description,
  icon: Icon,
  type = "default",
}) {

  const styles = {

    default: "text-white",

    safe: "text-emerald-400",

    warning: "text-amber-400",

    critical: "text-red-400",
  }

  return (

    <div className="rounded-xl border border-slate-800 bg-[#111820] p-5 transition hover:border-slate-700">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className={`mt-2 text-3xl font-bold tracking-tight ${styles[type]}`}>
            {value}
          </p>

        </div>

        {Icon && (

          <div className="rounded-lg bg-slate-800/70 p-2.5 text-slate-400">

            <Icon size={18} />

          </div>

        )}

      </div>

      <p className="mt-3 text-xs text-slate-600">
        {description}
      </p>

    </div>
  )
}