import {
    useEffect,
    useMemo,
    useState
} from "react"

import {
    AlertTriangle,
    RefreshCw,
    ShieldAlert
} from "lucide-react"

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from "recharts"

import {
    getIncidents
} from "../../services/analytics"

function getDateKey(timestamp) {

    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {
        return null
    }

    return date.toISOString().slice(0, 10)
}

function formatDate(dateString) {

    const date = new Date(`${dateString}T00:00:00`)

    return date.toLocaleDateString([], {
        day: "2-digit",
        month: "short"
    })
}

export default function IncidentTrendChart({
    hours = 24
}) {

    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    async function loadIncidents() {

        try {
            setLoading(true)
            setError("")

            const data = await getIncidents(hours)
            setIncidents(data.incidents || [])

        } catch (err) {
            console.error("Incident trend error:", err)
            setError("Unable to load incident trend.")

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadIncidents()
    }, [hours])

    const chartData = useMemo(() => {

        const grouped = {}

        incidents.forEach(incident => {
            const key = getDateKey(incident.timestamp)

            if (!key) {
                return
            }

            if (!grouped[key]) {
                grouped[key] = {
                    date: key,
                    critical: 0,
                    high: 0,
                    warning: 0,
                    other: 0,
                    total: 0
                }
            }

            grouped[key].total += 1

            if (incident.severity === "CRITICAL") {
                grouped[key].critical += 1
            } else if (incident.severity === "HIGH") {
                grouped[key].high += 1
            } else if (incident.severity === "WARNING") {
                grouped[key].warning += 1
            } else {
                grouped[key].other += 1
            }
        })

        return Object.values(grouped)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(item => ({
                ...item,
                label: formatDate(item.date)
            }))

    }, [incidents])

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={19} className="text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Incident Frequency
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Recorded safety incidents over time
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadIncidents}
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

            <div className="p-5">
                {loading && (
                    <div className="flex h-72 items-center justify-center text-gray-500">
                        <RefreshCw size={24} className="mr-3 animate-spin" />
                        <span className="text-sm">Loading incident history...</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="flex h-72 items-center justify-center text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading && !error && chartData.length === 0 && (
                    <div className="flex h-72 flex-col items-center justify-center text-center text-gray-500">
                        <ShieldAlert size={30} className="mb-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                            No incidents recorded
                        </span>
                        <span className="mt-1 text-xs">
                            Incident frequency will appear when events are recorded.
                        </span>
                    </div>
                )}

                {!loading && !error && chartData.length > 0 && (
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: 0,
                                    bottom: 5
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" tick={{fontSize: 11}} />
                                <YAxis allowDecimals={false} tick={{fontSize: 11}} />
                                <Tooltip />
                                <Bar dataKey="critical" stackId="incidents" name="Critical" fill="#dc2626" />
                                <Bar dataKey="high" stackId="incidents" name="High" fill="#f97316" />
                                <Bar dataKey="warning" stackId="incidents" name="Warning" fill="#eab308" />
                                <Bar dataKey="other" stackId="incidents" name="Other" fill="#9ca3af" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    )
}
