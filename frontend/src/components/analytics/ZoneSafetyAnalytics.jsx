import { useEffect, useMemo, useState } from "react"
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Clock,
    Gauge,
    Users,
    CheckCircle2,
    XCircle,
} from "lucide-react"

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
} from "recharts"

import { getZoneAnalytics } from "../../services/analytics"

function RiskStat({ icon: Icon, label, value, suffix = "" }) {
    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <Icon size={17} />
                <span>{label}</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
                {value}{suffix}
            </div>
        </div>
    )
}

function IncidentStat({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
            <div className="text-xs text-slate-400">{label}</div>
            <div className="mt-1 text-xl font-semibold text-white">{value}</div>
        </div>
    )
}

function TrendBadge({ trend }) {
    let className = "text-slate-300 bg-slate-800"

    if (trend === "INCREASING") {
        className = "text-red-300 bg-red-950/40"
    }

    if (trend === "DECREASING") {
        className = "text-emerald-300 bg-emerald-950/40"
    }

    return (
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>
            {trend}
        </span>
    )
}

function formatTime(timestamp) {
    if (!timestamp) return "-"

    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {
        return String(timestamp)
    }

    return date.toLocaleString()
}

export default function ZoneSafetyAnalytics({ zoneId }) {
    const [hours, setHours] = useState(168)
    const [data, setData] = useState(null)
    const [riskTrend, setRiskTrend] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!zoneId) {
            setData(null)
            setRiskTrend([])
            return
        }

        let cancelled = false

        async function loadAnalytics() {
            setLoading(true)
            setError("")

            try {
                const [zoneData, trendResponse] = await Promise.all([
                    getZoneAnalytics(zoneId, hours),
                    fetch(
                        `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api/analytics/risk-trend?zone=${encodeURIComponent(zoneId)}&hours=${hours}`
                    ).then(response => {
                        if (!response.ok) {
                            throw new Error("Failed to load zone risk trend")
                        }
                        return response.json()
                    }),
                ])

                if (cancelled) return

                setData(zoneData)
                setRiskTrend(
                    Array.isArray(trendResponse?.points)
                        ? trendResponse.points
                        : []
                )
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || "Unable to load zone analytics")
                    setData(null)
                    setRiskTrend([])
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadAnalytics()

        return () => {
            cancelled = true
        }
    }, [zoneId, hours])

    const trend = useMemo(() => {
        if (riskTrend.length < 2) return "STABLE"

        const first = Number(riskTrend[0]?.risk_score ?? 0)
        const last = Number(riskTrend[riskTrend.length - 1]?.risk_score ?? 0)

        if (last - first > 5) return "INCREASING"
        if (first - last > 5) return "DECREASING"
        return "STABLE"
    }, [riskTrend])

    const currentRisk = useMemo(() => {
        if (!riskTrend.length) return 0
        return Number(riskTrend[riskTrend.length - 1]?.risk_score ?? 0)
    }, [riskTrend])

    const workers = Array.isArray(data?.workers)
        ? data.workers
        : []

    if (!zoneId) {
        return (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                <div className="flex items-center gap-2">
                    <BarChart3 size={20} />
                    <h2 className="text-lg font-semibold text-white">
                        Zone Safety Analytics
                    </h2>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                    Select a zone to view historical safety analytics.
                </p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                <div className="flex items-center gap-2">
                    <Activity size={20} />
                    <h2 className="text-lg font-semibold text-white">
                        Zone Safety Analytics
                    </h2>
                </div>
                <p className="mt-4 text-sm text-slate-400">
                    Loading zone safety data...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-6">
                <div className="flex items-center gap-2 text-red-300">
                    <AlertTriangle size={20} />
                    <h2 className="text-lg font-semibold">Zone Safety Analytics</h2>
                </div>
                <p className="mt-3 text-sm text-red-300">{error}</p>
            </div>
        )
    }

    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Gauge size={21} />
                        <h2 className="text-xl font-semibold text-white">
                            Zone Safety Analytics
                        </h2>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span>
                            Zone: <span className="font-medium text-white">
                                {data?.zone || zoneId}
                            </span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock size={14} />
                            Last {hours >= 24
                                ? `${Math.round(hours / 24)} day${hours >= 48 ? "s" : ""}`
                                : `${hours} hours`}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {[24, 168, 720].map(period => (
                        <button
                            key={period}
                            onClick={() => setHours(period)}
                            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${hours === period
                                ? "bg-slate-700 text-white"
                                : "bg-slate-950 text-slate-400 hover:text-white"
                            }`}
                        >
                            {period === 24 ? "24h" : period === 168 ? "7d" : "30d"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <RiskStat icon={Gauge} label="Current recorded risk" value={currentRisk} />
                <RiskStat icon={Activity} label="Average recorded risk" value={data?.average_risk ?? 0} />
                <RiskStat icon={AlertTriangle} label="Peak recorded risk" value={data?.peak_risk ?? 0} />
                <RiskStat icon={Users} label="Workers observed" value={data?.workers_observed ?? 0} />
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="font-semibold text-white">Zone Risk Trend</h3>
                        <p className="mt-1 text-xs text-slate-400">
                            Risk scores calculated from recorded sensor readings for this zone.
                        </p>
                    </div>
                    <TrendBadge trend={trend} />
                </div>

                {riskTrend.length === 0 ? (
                    <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                        No risk readings available for this period.
                    </div>
                ) : (
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={riskTrend}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={value => new Date(value).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                    minTickGap={35}
                                />
                                <YAxis domain={[0, 100]} />
                                <Tooltip labelFormatter={value => formatTime(value)} />
                                <ReferenceLine y={30} strokeDasharray="4 4" label="Warning" />
                                <ReferenceLine y={70} strokeDasharray="4 4" label="Critical" />
                                <Line type="monotone" dataKey="risk_score" name="Risk Score" dot={false} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                <div className="mb-4">
                    <h3 className="font-semibold text-white">Zone Incident Summary</h3>
                    <p className="mt-1 text-xs text-slate-400">
                        Recorded safety incidents within the selected analysis period.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    <IncidentStat label="Total incidents" value={data?.total_incidents ?? 0} />
                    <IncidentStat label="Critical" value={data?.critical_incidents ?? 0} />
                    <IncidentStat label="High / Warning" value={data?.high_incidents ?? 0} />
                    <IncidentStat label="Active" value={data?.active_incidents ?? 0} />
                    <IncidentStat label="Sensor readings" value={data?.sensor_readings ?? 0} />
                </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                <div className="mb-4 flex items-center gap-2">
                    <Users size={19} />
                    <h3 className="font-semibold text-white">Workers Observed in Zone</h3>
                </div>
                {workers.length === 0 ? (
                    <div className="text-sm text-slate-500">
                        No workers were observed in this zone during the selected period.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {workers.map(workerId => (
                            <span key={workerId} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                                {workerId}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                <div className="mb-4">
                    <h3 className="font-semibold text-white">Recent Zone Safety Events</h3>
                    <p className="mt-1 text-xs text-slate-400">
                        Events recorded for this zone. These are historical records and do not by themselves represent the current safety state.
                    </p>
                </div>
                {!data?.incidents?.length ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <CheckCircle2 size={17} />
                        No recorded incidents in this period.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.incidents.slice(0, 10).map(incident => (
                            <div key={incident.id} className="rounded-lg border border-slate-700 bg-slate-950 p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300">
                                                {incident.severity || "UNKNOWN"}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                Worker: {incident.worker_id || "-"}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-300">
                                            {incident.message || "Safety event recorded."}
                                        </p>
                                    </div>
                                    <div className="text-left text-xs text-slate-500 md:text-right">
                                        <div>Risk: {incident.risk_score ?? "-"}</div>
                                        <div className="mt-1">{formatTime(incident.timestamp)}</div>
                                        <div className="mt-1 flex items-center gap-1 md:justify-end">
                                            {incident.resolved ? <><CheckCircle2 size={13} /> Resolved</> : <><XCircle size={13} /> Active</>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
