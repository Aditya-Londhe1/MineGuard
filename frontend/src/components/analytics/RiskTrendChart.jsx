import {
    useEffect,
    useState
} from "react"

import {
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Minus,
    ShieldAlert
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
    getRiskTrend
} from "../../services/analytics"

function formatTime(timestamp) {

    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {
        return ""
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    })
}

function formatDate(timestamp) {

    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {
        return ""
    }

    return date.toLocaleDateString([], {
        day: "2-digit",
        month: "short"
    })
}

function calculateTrend(points) {

    if (!points || points.length < 2) {
        return {
            direction: "STABLE",
            change: 0
        }
    }

    const first = points[0].risk_score ?? 0
    const last = points[points.length - 1].risk_score ?? 0
    const change = Math.round(last - first)

    if (change > 5) {
        return {
            direction: "INCREASING",
            change
        }
    }

    if (change < -5) {
        return {
            direction: "DECREASING",
            change
        }
    }

    return {
        direction: "STABLE",
        change
    }
}

function RiskTooltip({
    active,
    payload
}) {

    if (!active || !payload || !payload.length) {
        return null
    }

    const point = payload[0].payload

    return (
        <div className="min-w-[180px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <div className="mb-2 text-xs text-gray-500">
                {formatDate(point.timestamp)} {formatTime(point.timestamp)}
            </div>
            <div className="text-lg font-bold text-gray-900">
                {point.risk_score}/100
            </div>
            <div className="mt-1 text-xs text-gray-500">
                {point.status}
            </div>
            {point.worker_id && (
                <div className="mt-1 text-xs text-gray-500">
                    Worker: {point.worker_id}
                </div>
            )}
            {point.zone && (
                <div className="text-xs text-gray-500">
                    Zone: {point.zone}
                </div>
            )}
        </div>
    )
}

export default function RiskTrendChart({
    hours = 24,
    workerId = "",
    zone = ""
}) {

    const [points, setPoints] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    async function loadTrend() {

        try {
            setLoading(true)
            setError("")

            const data = await getRiskTrend(
                hours,
                workerId,
                zone
            )

            setPoints(data.points || [])

        } catch (err) {
            console.error("Risk trend error:", err)
            setError("Unable to load historical risk trend.")

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTrend()
    }, [hours, workerId, zone])

    const trend = calculateTrend(points)
    const chartData = points.map((point, index) => ({
        ...point,
        index,
        label: formatTime(point.timestamp)
    }))

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
                <div>
                    <div className="flex items-center gap-2">
                        <ShieldAlert size={19} className="text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Historical Risk Trend
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Risk calculated from recorded sensor readings
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadTrend}
                    disabled={loading}
                    className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                </button>
            </div>

            {!loading && !error && points.length > 0 && (
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Current Risk
                        </div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">
                            {points[points.length - 1]?.risk_score ?? 0}
                            <span className="ml-1 text-sm font-normal text-gray-400">
                                /100
                            </span>
                        </div>
                    </div>
                    <TrendIndicator
                        direction={trend.direction}
                        change={trend.change}
                    />
                </div>
            )}

            <div className="p-5">
                {loading && (
                    <div className="flex h-80 flex-col items-center justify-center text-gray-500">
                        <RefreshCw size={25} className="mb-3 animate-spin" />
                        <span className="text-sm">Loading risk history...</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="flex h-80 items-center justify-center text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading && !error && points.length === 0 && (
                    <div className="flex h-80 flex-col items-center justify-center text-center text-gray-500">
                        <ShieldAlert size={30} className="mb-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                            No historical risk data
                        </span>
                        <span className="mt-1 text-xs">
                            Recorded sensor readings will appear here.
                        </span>
                    </div>
                )}

                {!loading && !error && points.length > 0 && (
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: 0,
                                    bottom: 5
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="label"
                                    tick={{fontSize: 11}}
                                    minTickGap={30}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{fontSize: 11}}
                                />
                                <Tooltip content={<RiskTooltip />} />
                                <ReferenceLine
                                    y={30}
                                    strokeDasharray="5 5"
                                    label={{
                                        value: "Warning",
                                        position: "insideTopRight",
                                        fontSize: 10
                                    }}
                                />
                                <ReferenceLine
                                    y={70}
                                    strokeDasharray="5 5"
                                    label={{
                                        value: "Critical",
                                        position: "insideTopRight",
                                        fontSize: 10
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="risk_score"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{r: 5}}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}

function TrendIndicator({
    direction,
    change
}) {

    if (direction === "INCREASING") {
        return (
            <div className="flex items-center gap-2 text-orange-600">
                <TrendingUp size={20} />
                <div>
                    <div className="text-sm font-semibold">Increasing</div>
                    <div className="text-xs">+{change} points</div>
                </div>
            </div>
        )
    }

    if (direction === "DECREASING") {
        return (
            <div className="flex items-center gap-2 text-green-600">
                <TrendingDown size={20} />
                <div>
                    <div className="text-sm font-semibold">Decreasing</div>
                    <div className="text-xs">{change} points</div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 text-gray-500">
            <Minus size={20} />
            <div>
                <div className="text-sm font-semibold">Stable</div>
                <div className="text-xs">No significant change</div>
            </div>
        </div>
    )
}
