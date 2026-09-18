import {
    useEffect,
    useMemo,
    useState
} from "react"

import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Filter,
    RefreshCw,
    ShieldAlert,
    XCircle
} from "lucide-react"

import {
    getIncidents
} from "../../services/analytics"

// =========================================================
// SEVERITY CONFIG
// =========================================================

const severityConfig = {

    CRITICAL: {
        label: "CRITICAL",
        icon: ShieldAlert
    },

    HIGH: {
        label: "HIGH",
        icon: AlertTriangle
    },

    WARNING: {
        label: "WARNING",
        icon: AlertTriangle
    },

    MODERATE: {
        label: "MODERATE",
        icon: AlertTriangle
    }
}

// =========================================================
// FORMAT TIME
// =========================================================

function formatTime(timestamp) {

    if (!timestamp) {

        return "—"
    }

    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {

        return "—"
    }

    return date.toLocaleString()
}

// =========================================================
// FORMAT SHORT TIME
// =========================================================

function formatShortTime(timestamp) {

    if (!timestamp) {

        return "—"
    }

    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) {

        return "—"
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    )
}

// =========================================================
// SEVERITY STYLE
// =========================================================

function getSeverityClass(severity) {

    switch (severity) {

        case "CRITICAL":

            return "bg-red-100 text-red-700 border-red-200"

        case "HIGH":

            return "bg-orange-100 text-orange-700 border-orange-200"

        case "WARNING":

            return "bg-yellow-100 text-yellow-700 border-yellow-200"

        case "MODERATE":

            return "bg-yellow-50 text-yellow-700 border-yellow-200"

        default:

            return "bg-gray-100 text-gray-700 border-gray-200"
    }
}

// =========================================================
// INCIDENT ROW
// =========================================================

function IncidentRow({
    incident,
    onSelect
}) {

    const SeverityIcon =
        severityConfig[
            incident.severity
        ]?.icon || AlertTriangle

    return (

        <button
            type="button"
            onClick={() => onSelect(incident)}
            className="
                w-full
                text-left
                border-b
                border-gray-100
                hover:bg-gray-50
                transition
            "
        >

            <div
                className="
                    grid
                    grid-cols-[90px_100px_90px_1fr_90px_110px]
                    gap-4
                    items-center
                    px-4
                    py-4
                "
            >

                <div>

                    <div
                        className="
                            text-sm
                            font-medium
                            text-gray-900
                        "
                    >
                        {formatShortTime(
                            incident.timestamp
                        )}
                    </div>

                    <div
                        className="
                            text-xs
                            text-gray-400
                            mt-1
                        "
                    >
                        {formatTime(
                            incident.timestamp
                        )}
                    </div>

                </div>

                <div>

                    <div
                        className="
                            text-sm
                            font-semibold
                            text-gray-900
                        "
                    >
                        {incident.worker_id || "—"}
                    </div>

                </div>

                <div>

                    <span
                        className="
                            inline-flex
                            px-2
                            py-1
                            rounded
                            bg-gray-100
                            text-xs
                            font-medium
                            text-gray-700
                        "
                    >
                        {incident.zone || "—"}
                    </span>

                </div>

                <div className="min-w-0">

                    <div
                        className="
                            flex
                            items-center
                            gap-2
                        "
                    >

                        <SeverityIcon
                            size={16}
                            className="shrink-0"
                        />

                        <span
                            className="
                                text-sm
                                font-medium
                                text-gray-900
                            "
                        >
                            {incident.alert_type || "SAFETY_EVENT"}
                        </span>

                    </div>

                    <div
                        className="
                            text-xs
                            text-gray-500
                            truncate
                            mt-1
                        "
                    >
                        {incident.message || "No message"}
                    </div>

                </div>

                <div>

                    <span
                        className="
                            text-sm
                            font-bold
                            text-gray-900
                        "
                    >
                        {incident.risk_score ?? "—"}
                    </span>

                    <span
                        className="
                            text-xs
                            text-gray-400
                            ml-1
                        "
                    >
                        /100
                    </span>

                </div>

                <div>

                    {incident.resolved ? (

                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1
                                px-2
                                py-1
                                rounded-full
                                bg-green-50
                                text-green-700
                                text-xs
                                font-medium
                            "
                        >

                            <CheckCircle2
                                size={14}
                            />

                            Resolved

                        </span>

                    ) : (

                        <span
                            className="
                                inline-flex
                                items-center
                                gap-1
                                px-2
                                py-1
                                rounded-full
                                bg-red-50
                                text-red-700
                                text-xs
                                font-medium
                            "
                        >

                            <XCircle
                                size={14}
                            />

                            Active

                        </span>
                    )}

                </div>

            </div>

        </button>
    )
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function IncidentHistory() {

    const [incidents, setIncidents] =
        useState([])

    const [hours, setHours] =
        useState(24)

    const [severity, setSeverity] =
        useState("")

    const [workerId, setWorkerId] =
        useState("")

    const [zone, setZone] =
        useState("")

    const [status, setStatus] =
        useState("")

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState("")

    const [selectedIncident, setSelectedIncident] =
        useState(null)

    async function loadIncidents() {

        try {

            setLoading(true)

            setError("")

            const data =
                await getIncidents(
                    hours,
                    {
                        severity,
                        worker_id: workerId,
                        zone,
                        resolved:
                            status === ""
                                ? undefined
                                : status === "resolved"
                    }
                )

            setIncidents(
                data.incidents || []
            )

        } catch (err) {

            console.error(
                "Failed to load incidents:",
                err
            )

            setError(
                "Unable to load incident history."
            )

        } finally {

            setLoading(false)
        }
    }

    useEffect(() => {

        loadIncidents()

    }, [
        hours,
        severity,
        workerId,
        zone,
        status
    ])

    const stats = useMemo(() => {

        const total =
            incidents.length

        const critical =
            incidents.filter(
                item =>
                    item.severity === "CRITICAL"
            ).length

        const high =
            incidents.filter(
                item =>
                    item.severity === "HIGH" ||
                    item.severity === "WARNING"
            ).length

        const resolved =
            incidents.filter(
                item =>
                    item.resolved
            ).length

        const active =
            incidents.filter(
                item =>
                    !item.resolved
            ).length

        return {
            total,
            critical,
            high,
            resolved,
            active
        }

    }, [incidents])

    return (

        <div
            className="
                bg-white
                border
                border-gray-200
                rounded-2xl
                shadow-sm
                overflow-hidden
            "
        >

            <div
                className="
                    px-5
                    py-4
                    border-b
                    border-gray-200
                    flex
                    flex-col
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                    gap-4
                "
            >

                <div>

                    <div
                        className="
                            flex
                            items-center
                            gap-2
                        "
                    >

                        <ShieldAlert
                            size={20}
                            className="text-gray-700"
                        />

                        <h2
                            className="
                                text-lg
                                font-semibold
                                text-gray-900
                            "
                        >
                            Incident History
                        </h2>

                    </div>

                    <p
                        className="
                            text-sm
                            text-gray-500
                            mt-1
                        "
                    >
                        Historical safety events recorded by MineGuard
                    </p>

                </div>

                <button
                    type="button"
                    onClick={loadIncidents}
                    disabled={loading}
                    className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        px-3
                        py-2
                        rounded-lg
                        border
                        border-gray-200
                        text-sm
                        font-medium
                        text-gray-700
                        hover:bg-gray-50
                        disabled:opacity-50
                    "
                >

                    <RefreshCw
                        size={16}
                        className={
                            loading
                                ? "animate-spin"
                                : ""
                        }
                    />

                    Refresh

                </button>

            </div>

            <div
                className="
                    grid
                    grid-cols-2
                    md:grid-cols-5
                    border-b
                    border-gray-200
                "
            >

                <Stat
                    label="Total"
                    value={stats.total}
                    icon={ShieldAlert}
                />

                <Stat
                    label="Critical"
                    value={stats.critical}
                    icon={AlertTriangle}
                />

                <Stat
                    label="High"
                    value={stats.high}
                    icon={AlertTriangle}
                />

                <Stat
                    label="Active"
                    value={stats.active}
                    icon={XCircle}
                />

                <Stat
                    label="Resolved"
                    value={stats.resolved}
                    icon={CheckCircle2}
                />

            </div>

            <div
                className="
                    p-4
                    bg-gray-50
                    border-b
                    border-gray-200
                "
            >

                <div
                    className="
                        flex
                        items-center
                        gap-2
                        mb-3
                    "
                >

                    <Filter size={16} />

                    <span
                        className="
                            text-sm
                            font-semibold
                            text-gray-700
                        "
                    >
                        Filters
                    </span>

                </div>

                <div
                    className="
                        grid
                        grid-cols-1
                        sm:grid-cols-2
                        lg:grid-cols-5
                        gap-3
                    "
                >

                    <select
                        value={hours}
                        onChange={
                            event =>
                                setHours(
                                    Number(
                                        event.target.value
                                    )
                                )
                        }
                        className="
                            px-3
                            py-2
                            rounded-lg
                            border
                            border-gray-200
                            bg-white
                            text-sm
                            outline-none
                        "
                    >

                        <option value={24}>
                            Last 24 Hours
                        </option>

                        <option value={168}>
                            Last 7 Days
                        </option>

                        <option value={720}>
                            Last 30 Days
                        </option>

                    </select>

                    <select
                        value={severity}
                        onChange={
                            event =>
                                setSeverity(
                                    event.target.value
                                )
                        }
                        className="
                            px-3
                            py-2
                            rounded-lg
                            border
                            border-gray-200
                            bg-white
                            text-sm
                            outline-none
                        "
                    >

                        <option value="">
                            All Severities
                        </option>

                        <option value="CRITICAL">
                            Critical
                        </option>

                        <option value="HIGH">
                            High
                        </option>

                        <option value="WARNING">
                            Warning
                        </option>

                        <option value="MODERATE">
                            Moderate
                        </option>

                    </select>

                    <input
                        value={workerId}
                        onChange={
                            event =>
                                setWorkerId(
                                    event.target.value
                                )
                        }
                        placeholder="Worker ID"
                        className="
                            px-3
                            py-2
                            rounded-lg
                            border
                            border-gray-200
                            bg-white
                            text-sm
                            outline-none
                        "
                    />

                    <input
                        value={zone}
                        onChange={
                            event =>
                                setZone(
                                    event.target.value
                                )
                        }
                        placeholder="Zone"
                        className="
                            px-3
                            py-2
                            rounded-lg
                            border
                            border-gray-200
                            bg-white
                            text-sm
                            outline-none
                        "
                    />

                    <select
                        value={status}
                        onChange={
                            event =>
                                setStatus(
                                    event.target.value
                                )
                        }
                        className="
                            px-3
                            py-2
                            rounded-lg
                            border
                            border-gray-200
                            bg-white
                            text-sm
                            outline-none
                        "
                    >

                        <option value="">
                            All Status
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="resolved">
                            Resolved
                        </option>

                    </select>

                </div>

            </div>

            {error && (

                <div
                    className="
                        m-4
                        p-4
                        rounded-lg
                        border
                        border-red-200
                        bg-red-50
                        text-red-700
                        text-sm
                    "
                >
                    {error}
                </div>
            )}

            {!loading && incidents.length > 0 && (

                <div
                    className="
                        hidden
                        lg:grid
                        grid-cols-[90px_100px_90px_1fr_90px_110px]
                        gap-4
                        px-4
                        py-3
                        bg-gray-50
                        border-b
                        border-gray-200
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-gray-500
                    "
                >

                    <span>Time</span>
                    <span>Worker</span>
                    <span>Zone</span>
                    <span>Incident</span>
                    <span>Risk</span>
                    <span>Status</span>

                </div>
            )}

            {loading && (

                <div
                    className="
                        py-16
                        flex
                        flex-col
                        items-center
                        justify-center
                        text-gray-500
                    "
                >

                    <RefreshCw
                        size={24}
                        className="animate-spin mb-3"
                    />

                    <span className="text-sm">
                        Loading incident history...
                    </span>

                </div>
            )}

            {!loading &&
                !error &&
                incidents.length === 0 && (

                    <div
                        className="
                            py-16
                            flex
                            flex-col
                            items-center
                            justify-center
                            text-center
                        "
                    >

                        <CheckCircle2
                            size={32}
                            className="
                                text-gray-400
                                mb-3
                            "
                        />

                        <h3
                            className="
                                text-sm
                                font-semibold
                                text-gray-800
                            "
                        >
                            No incidents found
                        </h3>

                        <p
                            className="
                                text-sm
                                text-gray-500
                                mt-1
                            "
                        >
                            No recorded safety incidents match the selected filters.
                        </p>

                    </div>
                )}

            {!loading &&
                incidents.length > 0 && (

                    <div>

                        {incidents.map(
                            incident => (

                                <IncidentRow
                                    key={
                                        incident.id
                                    }
                                    incident={
                                        incident
                                    }
                                    onSelect={
                                        setSelectedIncident
                                    }
                                />
                            )
                        )}

                    </div>
                )}

            {!loading &&
                incidents.length > 0 && (

                    <div
                        className="
                            px-4
                            py-3
                            border-t
                            border-gray-200
                            flex
                            items-center
                            gap-2
                            text-xs
                            text-gray-500
                        "
                    >

                        <Clock size={14} />

                        Showing {incidents.length} recorded incident
                        {incidents.length === 1 ? "" : "s"}

                    </div>
                )}

            {selectedIncident && (

                <IncidentDetail
                    incident={
                        selectedIncident
                    }
                    onClose={() =>
                        setSelectedIncident(
                            null
                        )
                    }
                />
            )}

        </div>
    )
}

// =========================================================
// STAT
// =========================================================

function Stat({
    label,
    value,
    icon: Icon
}) {

    return (

        <div
            className="
                px-4
                py-4
                border-r
                border-b
                md:border-b-0
                border-gray-200
            "
        >

            <div
                className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-gray-500
                "
            >

                <Icon size={14} />

                {label}

            </div>

            <div
                className="
                    text-xl
                    font-bold
                    text-gray-900
                    mt-1
                "
            >
                {value}
            </div>

        </div>
    )
}

// =========================================================
// DETAIL PANEL
// =========================================================

function IncidentDetail({
    incident,
    onClose
}) {

    return (

        <div
            className="
                fixed
                inset-0
                z-50
                bg-black/30
                flex
                items-center
                justify-center
                p-4
            "
            onClick={onClose}
        >

            <div
                className="
                    w-full
                    max-w-xl
                    bg-white
                    rounded-2xl
                    shadow-xl
                    overflow-hidden
                "
                onClick={
                    event =>
                        event.stopPropagation()
                }
            >

                <div
                    className="
                        px-5
                        py-4
                        border-b
                        border-gray-200
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div>

                        <h3
                            className="
                                text-lg
                                font-semibold
                                text-gray-900
                            "
                        >
                            Incident #{incident.id}
                        </h3>

                        <p
                            className="
                                text-sm
                                text-gray-500
                                mt-1
                            "
                        >
                            Recorded safety event
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            text-gray-400
                            hover:text-gray-700
                            text-xl
                        "
                    >
                        ×
                    </button>

                </div>

                <div className="p-5">

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                            mb-5
                        "
                    >

                        <span
                            className={`
                                inline-flex
                                px-3
                                py-1
                                rounded-full
                                border
                                text-xs
                                font-semibold
                                ${getSeverityClass(
                                    incident.severity
                                )}
                            `}
                        >
                            {incident.severity}
                        </span>

                        <span
                            className="
                                text-2xl
                                font-bold
                                text-gray-900
                            "
                        >
                            {incident.risk_score}
                            <span
                                className="
                                    text-sm
                                    text-gray-400
                                    ml-1
                                "
                            >
                                /100
                            </span>
                        </span>

                    </div>

                    <div
                        className="
                            grid
                            grid-cols-2
                            gap-4
                        "
                    >

                        <Detail
                            label="Worker"
                            value={
                                incident.worker_id
                            }
                        />

                        <Detail
                            label="Zone"
                            value={
                                incident.zone
                            }
                        />

                        <Detail
                            label="Type"
                            value={
                                incident.alert_type
                            }
                        />

                        <Detail
                            label="Status"
                            value={
                                incident.resolved
                                    ? "Resolved"
                                    : "Active"
                            }
                        />

                    </div>

                    <div className="mt-5">

                        <div
                            className="
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-gray-500
                                mb-2
                            "
                        >
                            Message
                        </div>

                        <div
                            className="
                                p-3
                                rounded-lg
                                bg-gray-50
                                text-sm
                                text-gray-700
                            "
                        >
                            {incident.message ||
                                "No message recorded."}
                        </div>

                    </div>

                    <div className="mt-5">

                        <Detail
                            label="Detected"
                            value={
                                formatTime(
                                    incident.timestamp
                                )
                            }
                        />

                    </div>

                </div>

            </div>

        </div>
    )
}

// =========================================================
// DETAIL FIELD
// =========================================================

function Detail({
    label,
    value
}) {

    return (

        <div>

            <div
                className="
                    text-xs
                    font-medium
                    text-gray-400
                    uppercase
                    tracking-wide
                "
            >
                {label}
            </div>

            <div
                className="
                    text-sm
                    font-semibold
                    text-gray-800
                    mt-1
                "
            >
                {value || "—"}
            </div>

        </div>
    )
}
