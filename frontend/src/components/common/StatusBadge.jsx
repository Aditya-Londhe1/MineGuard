export default function StatusBadge({ status }) {

  const styles = {

    SAFE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",

    WARNING: "bg-amber-500/10 text-amber-400 border-amber-500/20",

    CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",

    OFFLINE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  }

  return (

    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status] || styles.OFFLINE}`}
    >

      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "SAFE"
            ? "bg-emerald-400"
            : status === "WARNING"
            ? "bg-amber-400"
            : status === "CRITICAL"
            ? "bg-red-400"
            : "bg-slate-400"
        }`}
      />

      {status}

    </span>
  )
}