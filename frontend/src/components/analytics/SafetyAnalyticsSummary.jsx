import { useEffect, useMemo, useState } from "react"
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Clock,
    Gauge,
    Users,
    MapPin,
    ShieldAlert,
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle2,
} from "lucide-react"

import {
    getAnalyticsOverview,
    getIncidents,
    getRiskTrend,
} from "../../services/analytics"

function StatCard({ icon: Icon, label, value, description }) {
    return (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <Icon size={17} />
                <span>{label}</span>
            </div>

            <div className="mt-2 text-2xl font-semibold text-white">
                {value}
            </div>

            {description && (
                <div className="mt-1 text-xs text-slate-500">
                    {description}
                </div>
            )}
        </div>
    )
}

function TrendBadge({ trend }) {
    if (trend === "INCREASING") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-950/40 px-3 py-1 text-xs font-medium text-red-300">
                <TrendingUp size={14} />
                Increasing
            </span>
        )
    }

    if (trend === "DECREASING") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-300">
                <TrendingDown size={14} />
                Decreasing
            </span>
        )
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
            <Minus size={14} />
            Stable
        </span>
    )
}

function Insight({ type = "info", children }) {
    const Icon =
        type === "warning"
            ? AlertTriangle
            : type === "positive"
                ? CheckCircle2
                : Activity

    return (
        <div className="flex gap-3 rounded-lg border border-slate-700 bg-slate-950 p-4">
            <div className="mt-0.5 shrink-0">
                <Icon size={18} />
            </div>

            <p className="text-sm leading-6 text-slate-300">
                {children}
            </p>
        </div>
    )
}

function formatPeriod(hours) {
    if (hours < 24) {
        return `${hours} hour${hours === 1 ? "" : "s"}`
    }

    const days = Math.round(hours / 24)

    return `${days} day${days === 1 ? "" : "s"}`
}

export default function SafetyAnalyticsSummary() {
    const [hours, setHours] = useState(168)
    const [overview, setOverview] = useState(null)
    const [incidents, setIncidents] = useState([])
    const [riskTrend, setRiskTrend] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        let cancelled = false

        async function loadSummary() {
            setLoading(true)
            setError("")

            try {
                const [
                    overviewResponse,
                    incidentsResponse,
                    trendResponse,
                ] = await Promise.all([
                    getAnalyticsOverview(hours),
                    getIncidents(hours, {}),
                    getRiskTrend(hours),
                ])

                if (cancelled) return

                setOverview(overviewResponse)
                setIncidents(
                    Array.isArray(incidentsResponse?.incidents)
                        ? incidentsResponse.incidents
                        : []
                )
                setRiskTrend(
                    Array.isArray(trendResponse?.points)
                        ? trendResponse.points
                        : []
                )
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err?.message || "Unable to load analytics summary"
                    )
                    setOverview(null)
                    setIncidents([])
                    setRiskTrend([])
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadSummary()

        return () => {
            cancelled = true
        }
    }, [hours])

    const trend = useMemo(() => {
        if (riskTrend.length < 2) {
            return "STABLE"
        }

        const first = Number(riskTrend[0]?.risk_score ?? 0)
        const last = Number(riskTrend[riskTrend.length - 1]?.risk_score ?? 0)

        if (last - first > 5) {
            return "INCREASING"
        }

        if (first - last > 5) {
            return "DECREASING"
        }

        return "STABLE"
    }, [riskTrend])

    const highestWorkerRisk = useMemo(() => {
        const scores = {}

        riskTrend.forEach((point) => {
            const workerId = point?.worker_id

            if (!workerId) return

            const score = Number(point?.risk_score ?? 0)

            if (scores[workerId] === undefined || score > scores[workerId]) {
                scores[workerId] = score
            }
        })

        const entries = Object.entries(scores)

        if (!entries.length) {
            return null
        }

        entries.sort((a, b) => b[1] - a[1])

        return {
            workerId: entries[0][0],
            risk: entries[0][1],
        }
    }, [riskTrend])

    const highestZoneRisk = useMemo(() => {
        const scores = {}

        riskTrend.forEach((point) => {
            const zone = point?.zone

            if (!zone) return

            const score = Number(point?.risk_score ?? 0)

            if (scores[zone] === undefined || score > scores[zone]) {
                scores[zone] = score
            }
        })

        const entries = Object.entries(scores)

        if (!entries.length) {
            return null
        }

        entries.sort((a, b) => b[1] - a[1])

        return {
            zone: entries[0][0],
            risk: entries[0][1],
        }
    }, [riskTrend])

    const criticalEvents = useMemo(
        () => incidents.filter((incident) => incident?.severity === "CRITICAL"),
        [incidents]
    )

    const activeEvents = useMemo(
        () => incidents.filter((incident) => !incident?.resolved),
        [incidents]
    )

    const hasNoData =
        !overview && riskTrend.length === 0 && incidents.length === 0

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
                <div className="flex items-center gap-2">
                    <BarChart3 size={20} />
                    <h2 className="text-lg font-semibold text-white">
                        Safety Analytics Summary
                    </h2>
                </div>
                <p className="mt-4 text-sm text-slate-400">
                    Loading historical safety data...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-6">
                <div className="flex items-center gap-2 text-red-300">
                    <AlertTriangle size={20} />
                    <h2 className="text-lg font-semibold">
                        Safety Analytics Summary
                    </h2>
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
                        <BarChart3 size={21} />
                        <h2 className="text-xl font-semibold text-white">
                            Safety Analytics Summary
                        </h2>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Evidence-based summary of recorded safety conditions during the selected period.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {[24, 168, 720].map((period) => (
                        <button
                            key={period}
                            onClick={() => setHours(period)}
                            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                                hours === period
                                    ? "bg-slate-700 text-white"
                                    : "bg-slate-950 text-slate-400 hover:text-white"
                            }`}
                        >
                            {period === 24 ? "24h" : period === 168 ? "7d" : "30d"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock size={16} />
                Analysis period:
                <span className="font-medium text-white">{formatPeriod(hours)}</span>
            </div>

            {hasNoData ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-8 text-center">
                    <Activity size={28} className="mx-auto" />
                    <h3 className="mt-3 font-semibold text-white">
                        No recorded analytics data
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        There are no sensor readings or incidents available for the selected period.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard icon={Gauge} label="Average recorded risk" value={overview?.average_risk ?? 0} description="Across recorded sensor readings" />
                        <StatCard icon={AlertTriangle} label="Peak recorded risk" value={overview?.peak_risk ?? 0} description="Highest recorded score" />
                        <StatCard icon={ShieldAlert} label="Total incidents" value={overview?.total_incidents ?? 0} description="Recorded during this period" />
                        <StatCard icon={Users} label="Active workers" value={overview?.active_workers ?? 0} description="Workers registered in the system" />
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="font-semibold text-white">Recorded Risk Direction</h3>
                                <p className="mt-1 text-xs text-slate-400">
                                    Direction calculated from the first and latest recorded risk points.
                                </p>
                            </div>
                            <TrendBadge trend={trend} />
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                        <h3 className="mb-4 font-semibold text-white">Incident Summary</h3>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <StatCard icon={ShieldAlert} label="Critical" value={overview?.critical_incidents ?? 0} />
                            <StatCard icon={AlertTriangle} label="High / Warning" value={overview?.high_incidents ?? 0} />
                            <StatCard icon={Activity} label="Active" value={overview?.active_incidents ?? 0} />
                            <StatCard icon={CheckCircle2} label="Resolved" value={overview?.resolved_incidents ?? 0} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                            <div className="flex items-center gap-2">
                                <Users size={19} />
                                <h3 className="font-semibold text-white">Worker Observation</h3>
                            </div>
                            {highestWorkerRisk ? (
                                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-4">
                                    <div className="text-xs text-slate-500">Highest recorded worker risk</div>
                                    <div className="mt-2 text-lg font-semibold text-white">{highestWorkerRisk.workerId}</div>
                                    <div className="mt-1 text-sm text-slate-400">
                                        Peak recorded risk: <span className="font-medium text-white">{highestWorkerRisk.risk}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-slate-500">No worker-level risk observations are available.</p>
                            )}
                        </div>

                        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                            <div className="flex items-center gap-2">
                                <MapPin size={19} />
                                <h3 className="font-semibold text-white">Zone Observation</h3>
                            </div>
                            {highestZoneRisk ? (
                                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-4">
                                    <div className="text-xs text-slate-500">Highest recorded zone risk</div>
                                    <div className="mt-2 text-lg font-semibold text-white">{highestZoneRisk.zone}</div>
                                    <div className="mt-1 text-sm text-slate-400">
                                        Peak recorded risk: <span className="font-medium text-white">{highestZoneRisk.risk}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-slate-500">No zone-level risk observations are available.</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                        <div className="mb-4">
                            <h3 className="font-semibold text-white">Safety Insights</h3>
                            <p className="mt-1 text-xs text-slate-400">
                                These observations are derived from recorded analytics data and should be verified against the current operational state.
                            </p>
                        </div>
                        <div className="space-y-3">
                            {trend === "INCREASING" && (
                                <Insight type="warning">Recorded risk increased across the selected period. Review current sensor conditions and active incidents before making an operational decision.</Insight>
                            )}
                            {trend === "DECREASING" && (
                                <Insight type="positive">Recorded risk decreased across the selected period. Historical improvement does not by itself establish the current safety state.</Insight>
                            )}
                            {trend === "STABLE" && (
                                <Insight>Recorded risk remained broadly stable across the selected period.</Insight>
                            )}
                            {criticalEvents.length > 0 && (
                                <Insight type="warning">
                                    {criticalEvents.length} critical incident{criticalEvents.length === 1 ? "" : "s"} were recorded during this period. Review the incident history and current conditions.
                                </Insight>
                            )}
                            {activeEvents.length > 0 && (
                                <Insight type="warning">
                                    {activeEvents.length} incident{activeEvents.length === 1 ? "" : "s"} remain marked active in the historical incident records.
                                </Insight>
                            )}
                            {criticalEvents.length === 0 && activeEvents.length === 0 && trend !== "INCREASING" && (
                                <Insight type="positive">No critical or active incidents were identified in the selected historical records.</Insight>
                            )}
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}
