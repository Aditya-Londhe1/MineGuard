import {
    useState
} from "react"

import {
    CalendarRange
} from "lucide-react"

import RiskTrendChart
    from "./RiskTrendChart"

import IncidentTrendChart
    from "./IncidentTrendChart"

export default function AnalyticsCharts() {

    const [hours, setHours] =
        useState(24)

    return (

        <section
            className="
                space-y-4
            "
        >

            {/* =================================================
                HEADER
            ================================================= */}

            <div
                className="
                    flex
                    flex-col
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    gap-3
                "
            >

                <div>

                    <h2
                        className="
                            text-xl
                            font-semibold
                            text-gray-900
                        "
                    >
                        Historical Trends
                    </h2>

                    <p
                        className="
                            text-sm
                            text-gray-500
                            mt-1
                        "
                    >
                        Review changes in risk and incident activity
                    </p>

                </div>

                <div
                    className="
                        flex
                        items-center
                        gap-2
                    "
                >

                    <CalendarRange
                        size={16}
                        className="text-gray-500"
                    />

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
                            text-gray-700
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

                </div>

            </div>

            <div
                className="
                    grid
                    grid-cols-1
                    xl:grid-cols-2
                    gap-5
                "
            >

                <RiskTrendChart
                    hours={hours}
                />

                <IncidentTrendChart
                    hours={hours}
                />

            </div>

        </section>
    )
}
