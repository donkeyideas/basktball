"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

// Mock analytics data
const pageViews = [
  { page: "/", views: 12450, change: 12.5 },
  { page: "/tools/shot-chart", views: 3240, change: 8.2 },
  { page: "/tools/compare", views: 2890, change: -3.1 },
  { page: "/tools/predictor", views: 2150, change: 15.7 },
  { page: "/insights", views: 1820, change: 22.4 },
];

const apiUsage = [
  { endpoint: "/api/games", calls: 45230, avgLatency: 120 },
  { endpoint: "/api/players", calls: 12450, avgLatency: 85 },
  { endpoint: "/api/teams", calls: 8920, avgLatency: 45 },
  { endpoint: "/api/ai/generate", calls: 1240, avgLatency: 2400 },
  { endpoint: "/api/ai/insights", calls: 5680, avgLatency: 95 },
];

const weeklyStats = [
  { day: "Mon", visitors: 1240, pageViews: 4520 },
  { day: "Tue", visitors: 1380, pageViews: 5120 },
  { day: "Wed", visitors: 1520, pageViews: 5840 },
  { day: "Thu", visitors: 1680, pageViews: 6240 },
  { day: "Fri", visitors: 1890, pageViews: 7120 },
  { day: "Sat", visitors: 2450, pageViews: 9840 },
  { day: "Sun", visitors: 2180, pageViews: 8520 },
];

export default function AnalyticsPage() {
  const maxPageViews = Math.max(...weeklyStats.map((d) => d.pageViews));

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
          ANALYTICS
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Traffic and performance metrics
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">Total Visitors (7d)</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            12.3K
          </p>
          <p className="text-green-400 text-xs mt-1">+15.2% vs last week</p>
        </Card>
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">Page Views (7d)</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            47.2K
          </p>
          <p className="text-green-400 text-xs mt-1">+8.7% vs last week</p>
        </Card>
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">Avg Session</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            4:32
          </p>
          <p className="text-green-400 text-xs mt-1">+12.4% vs last week</p>
        </Card>
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">Bounce Rate</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            32.1%
          </p>
          <p className="text-red-400 text-xs mt-1">+2.3% vs last week</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Traffic Chart */}
        <Card variant="default" className="p-5">
          <h2 className="font-bold text-white mb-4">Weekly Traffic</h2>
          <div className="flex items-end justify-between h-48 gap-2">
            {weeklyStats.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-[var(--orange)] rounded-t transition-all"
                  style={{ height: `${(day.pageViews / maxPageViews) * 100}%` }}
                />
                <span className="text-xs text-white/50 mt-2">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Pages */}
        <Card variant="default" className="p-5">
          <h2 className="font-bold text-white mb-4">Top Pages</h2>
          <div className="space-y-3">
            {pageViews.map((page) => (
              <div
                key={page.page}
                className="flex items-center justify-between p-3 bg-[var(--black)]"
              >
                <span className="text-white text-sm font-mono">{page.page}</span>
                <div className="flex items-center gap-4">
                  <span className="text-white/70 text-sm">
                    {page.views.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      page.change >= 0 ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {page.change >= 0 ? "+" : ""}
                    {page.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* API Usage */}
      <Card variant="default" className="overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h2 className="font-bold text-white">API Usage (24h)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--dark-gray)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">ENDPOINT</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/60">CALLS</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/60">AVG LATENCY</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/60">% OF TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {apiUsage.map((api, i) => {
                const totalCalls = apiUsage.reduce((sum, a) => sum + a.calls, 0);
                const percentage = ((api.calls / totalCalls) * 100).toFixed(1);
                return (
                  <tr
                    key={api.endpoint}
                    className={cn(
                      "border-t border-white/10",
                      i % 2 === 0 ? "bg-[var(--black)]" : "bg-[var(--dark-gray)]"
                    )}
                  >
                    <td className="px-4 py-3 text-white font-mono text-sm">{api.endpoint}</td>
                    <td className="px-4 py-3 text-right text-white/70 text-sm">
                      {api.calls.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-white/70 text-sm">
                      {api.avgLatency}ms
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-2 bg-[var(--dark-gray)] rounded overflow-hidden">
                          <div
                            className="h-full bg-[var(--orange)]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-white/50 text-xs w-10 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
