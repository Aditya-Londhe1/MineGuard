import AnalyticsCharts from "../components/analytics/AnalyticsCharts"
import SafetyAnalyticsSummary from "../components/analytics/SafetyAnalyticsSummary"

export default function Analytics() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mb-7">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
          Historical analytics
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
          Safety Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review historical risk and incident patterns, then interpret the recorded evidence.
        </p>
      </div>

      <AnalyticsCharts />

      <div className="mt-8">
        <SafetyAnalyticsSummary />
      </div>
    </main>
  )
}
