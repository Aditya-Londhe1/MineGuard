import {
    useEffect,
    useMemo,
    useState
} from "react"

import {
    AlertTriangle,
    Activity,
    CheckCircle2,
    Clock,
    RefreshCw,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
    Minus
} from "lucide-react"

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine
} from "recharts"

import {
    getWorkerAnalytics
} from "../../services/analytics"

function formatTime(timestamp) {

    if (!timestamp) {
        return "—"
    }

    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {
        return "—"
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    })
}

function formatDateTime(timestamp) {

    if (!timestamp) {
        return "—"
    }

    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {
        return "—"
    }

    return date.toLocaleString()
}

function calculateTrend(history) {

    if (!history || history.length < 2) {
        return {direction: "STABLE", change: 0}
    }

    const first = Number(history[0]?.risk_score ?? 0)
    const last = Number(history[history.length - 1]?.risk_score ?? 0)
    const change = Math.round(last - first)

    if (change > 5) {
        return {direction: "INCREASING", change}
    }

    if (change < -5) {
        return {direction: "DECREASING", change}
    }

    return {direction: "STABLE", change}
}

function riskClass(score) {

    const value = Number(score ?? 0)

    if (value >= 70) {
        return "text-red-600"
    }

    if (value >= 30) {
        return "text-orange-600"
    }

    return "text-green-600"
}

function severityClass(severity) {

    switch (severity) {
        case "CRITICAL":
            return "bg-red-100 text-red-700 border-red-200"
        case "HIGH":
            return "bg-orange-100 text-orange-700 border-orange-200"
        case "WARNING":
            return "bg-yellow-100 text-yellow-700 border-yellow-200"
        default:
            return "bg-gray-100 text-gray-700 border-gray-200"
    }
}

export default function WorkerSafetyAnalytics({
    workerId
}) {

    const [hours, setHours] = useState(168)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    async function loadWorkerAnalytics() {

        if (!workerId) {
            setData(null)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError("")
            setData(await getWorkerAnalytics(workerId, hours))

        } catch (err) {
            console.error("Worker analytics error:", err)
            setError("Unable to load worker analytics.")

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadWorkerAnalytics()
    }, [workerId, hours])

    const history = useMemo(() => {

        if (!data) {
            return []
        }

        if (data.history || data.risk_history || data.readings) {
            return data.history || data.risk_history || data.readings
        }

        return (data.risk_scores || []).map((risk_score, index) => ({
            risk_score,
            timestamp: index === (data.risk_scores || []).length - 1
                ? data.latest_reading
                : null
        }))

    }, [data])

    const incidents = useMemo(() => {
        return data?.incidents || data?.alerts || []
    }, [data])

    const riskStats = useMemo(() => {

        const scores = history
            .map(item => Number(item.risk_score))
            .filter(score => Number.isFinite(score))

        if (!scores.length) {
            return {current: 0, average: 0, peak: 0}
        }

        return {
            current: scores[scores.length - 1],
            average: Math.round(
                scores.reduce((sum, score) => sum + score, 0) / scores.length
            ),
            peak: Math.max(...scores)
        }

    }, [history])

    const incidentStats = useMemo(() => ({
        total: incidents.length,
        critical: incidents.filter(item => item.severity === "CRITICAL").length,
        high: incidents.filter(item => item.severity === "HIGH").length,
        warning: incidents.filter(item => item.severity === "WARNING").length,
        active: incidents.filter(item => !item.resolved).length,
        resolved: incidents.filter(item => item.resolved).length
    }), [incidents])

    const trend = calculateTrend(history)

    const chartData = history.map((item, index) => ({
        ...item,
        index,
        label: item.timestamp ? formatTime(item.timestamp) : `${index + 1}`
    }))

    if (!workerId) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                <ShieldAlert size={34} className="mx-auto mb-3 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800">Select a worker</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Select a worker to view historical safety analytics.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Activity size={20} className="text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Worker Safety Analytics
                        </h2>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                        Worker: <span className="font-semibold text-gray-700">{workerId}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={hours}
                        onChange={event => setHours(Number(event.target.value))}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                    >
                        <option value={24}>Last 24 Hours</option>
                        <option value={168}>Last 7 Days</option>
                        <option value={720}>Last 30 Days</option>
                    </select>
                    <button
                        type="button"
                        onClick={loadWorkerAnalytics}
                        disabled={loading}
                        className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-16 text-gray-500">
                    <RefreshCw size={24} className="mr-3 animate-spin" />
                    <span className="text-sm">Loading worker safety analytics...</span>
                </div>
            )}

            {!loading && !error && data && (
                <>
                    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-gray-400">Worker</div>
                            <div className="mt-1 text-xl font-bold text-gray-900">
                                {data.worker_id || workerId}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-wide text-gray-400">Zone</div>
                            <div className="mt-1 text-sm font-semibold text-gray-800">
                                {data.zone || data.current_zone || data.worker?.zone || "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-wide text-gray-400">Analysis Period</div>
                            <div className="mt-1 text-sm font-semibold text-gray-800">
                                {hours === 24 ? "24 Hours" : hours === 168 ? "7 Days" : "30 Days"}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <RiskStat label="Current Risk" value={riskStats.current} suffix="/100" icon={ShieldAlert} className={riskClass(riskStats.current)} />
                        <RiskStat label="Average Risk" value={riskStats.average} suffix="/100" icon={Activity} className={riskClass(riskStats.average)} />
                        <RiskStat label="Peak Risk" value={riskStats.peak} suffix="/100" icon={TrendingUp} className={riskClass(riskStats.peak)} />
                        <RiskStat label="Incidents" value={incidentStats.total} icon={AlertTriangle} className="text-gray-900" />
                    </div>

                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
                            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Worker Risk History</h3>
                                    <p className="mt-1 text-xs text-gray-500">Recorded risk over the selected period</p>
                                </div>
                                <TrendBadge trend={trend} />
                            </div>
                            <div className="h-80 p-5">
                                {chartData.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                                        No historical risk readings available.
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{top: 10, right: 10, left: 0, bottom: 5}}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="label" tick={{fontSize: 11}} minTickGap={30} />
                                            <YAxis domain={[0, 100]} tick={{fontSize: 11}} />
                                            <Tooltip formatter={value => [`${value}/100`, "Risk"]} />
                                            <ReferenceLine y={30} strokeDasharray="5 5" label={{value: "Warning", position: "insideTopRight", fontSize: 10}} />
                                            <ReferenceLine y={70} strokeDasharray="5 5" label={{value: "Critical", position: "insideTopRight", fontSize: 10}} />
                                            <Line type="monotone" dataKey="risk_score" strokeWidth={2} dot={false} activeDot={{r: 5}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-5 py-4">
                                <h3 className="font-semibold text-gray-900">Incident Summary</h3>
                                <p className="mt-1 text-xs text-gray-500">Recorded events for this worker</p>
                            </div>
                            <div className="space-y-4 p-5">
                                <IncidentStat label="Critical" value={incidentStats.critical} icon={ShieldAlert} />
                                <IncidentStat label="High" value={incidentStats.high} icon={AlertTriangle} />
                                <IncidentStat label="Warning" value={incidentStats.warning} icon={AlertTriangle} />
                                <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                                    <MiniStat label="Active" value={incidentStats.active} />
                                    <MiniStat label="Resolved" value={incidentStats.resolved} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-gray-700" />
                                <h3 className="font-semibold text-gray-900">Recent Safety Events</h3>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Latest recorded incidents for {workerId}</p>
                        </div>
                        {incidents.length === 0 ? (
                            <div className="py-12 text-center">
                                <CheckCircle2 size={30} className="mx-auto mb-3 text-gray-400" />
                                <div className="text-sm font-medium text-gray-700">No recorded incidents</div>
                            </div>
                        ) : (
                            incidents.slice(0, 10).map(incident => (
                                <IncidentItem key={incident.id} incident={incident} />
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

function RiskStat({label, value, suffix = "", icon: Icon, className}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500"><Icon size={15} />{label}</div>
            <div className="mt-2 flex items-baseline gap-1"><span className={`text-2xl font-bold ${className}`}>{value}</span><span className="text-xs text-gray-400">{suffix}</span></div>
        </div>
    )
}

function IncidentStat({label, value, icon: Icon}) {
    return <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-gray-600"><Icon size={16} />{label}</div><span className="font-bold text-gray-900">{value}</span></div>
}

function MiniStat({label, value}) {
    return <div className="rounded-lg bg-gray-50 p-3"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-lg font-bold text-gray-900">{value}</div></div>
}

function TrendBadge({trend}) {
    if (trend.direction === "INCREASING") {
        return <div className="flex items-center gap-1 text-orange-600 text-xs font-semibold"><TrendingUp size={15} />Increasing +{trend.change}</div>
    }
    if (trend.direction === "DECREASING") {
        return <div className="flex items-center gap-1 text-green-600 text-xs font-semibold"><TrendingDown size={15} />Decreasing {trend.change}</div>
    }
    return <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold"><Minus size={15} />Stable</div>
}

function IncidentItem({incident}) {
    return (
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${incident.severity === "CRITICAL" ? "bg-red-500" : incident.severity === "HIGH" ? "bg-orange-500" : "bg-yellow-500"}`} />
                <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-gray-900">{incident.alert_type || "SAFETY_EVENT"}</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityClass(incident.severity)}`}>{incident.severity}</span></div>
                    <div className="mt-1 text-xs text-gray-500">{incident.message || "No message recorded."}</div>
                </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 md:justify-end"><span>{formatDateTime(incident.timestamp)}</span><span className="text-sm font-bold text-gray-900">{incident.risk_score ?? "—"}/100</span><span className="font-medium">{incident.resolved ? "Resolved" : "Active"}</span></div>
        </div>
    )
}
