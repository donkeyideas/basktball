"use client";

import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface PageView {
  page: string;
  views: number;
  change: number;
}

interface ApiUsage {
  endpoint: string;
  calls: number;
  avgLatency: number;
}

interface WeeklyStat {
  day: string;
  visitors: number;
  pageViews: number;
}

interface AnalyticsData {
  success: boolean;
  overview: {
    totalVisitors7d: number;
    totalPageViews7d: number;
    avgSessionDuration: string;
    bounceRate: number;
  };
  pageViews: PageView[];
  apiUsage: ApiUsage[];
  weeklyStats: WeeklyStat[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR<AnalyticsData>(
    "/api/admin/analytics",
    fetcher,
    { refreshInterval: 60000 }
  );

  const overview = data?.overview || {
    totalVisitors7d: 0,
    totalPageViews7d: 0,
    avgSessionDuration: "0:00",
    bounceRate: 0,
  };
  const pageViews = data?.pageViews || [];
  const apiUsage = data?.apiUsage || [];
  const weeklyStats = data?.weeklyStats || [];

  const maxPageViews = Math.max(...weeklyStats.map((d) => d.pageViews), 1);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
          ANALYTICS
        </h1>
        <p className="text-white/50 text-sm">Traffic and performance metrics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} variant="default" className="p-3 animate-pulse">
              <div className="h-3 w-20 bg-white/10 rounded mb-2" />
              <div className="h-6 w-16 bg-white/10 rounded mb-1" />
              <div className="h-3 w-24 bg-white/10 rounded" />
            </Card>
          ))
        ) : (
          <>
            <Card variant="default" className="p-3">
              <p className="text-white/50 text-[10px] uppercase mb-1">
                Total Visitors (7d)
              </p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-white">
                {overview.totalVisitors7d > 1000
                  ? `${(overview.totalVisitors7d / 1000).toFixed(1)}K`
                  : overview.totalVisitors7d}
              </p>
              <p className="text-green-400 text-[10px] mt-1">+15.2% vs last week</p>
            </Card>
            <Card variant="default" className="p-3">
              <p className="text-white/50 text-[10px] uppercase mb-1">
                Page Views (7d)
              </p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-white">
                {overview.totalPageViews7d > 1000
                  ? `${(overview.totalPageViews7d / 1000).toFixed(1)}K`
                  : overview.totalPageViews7d}
              </p>
              <p className="text-green-400 text-[10px] mt-1">+8.7% vs last week</p>
            </Card>
            <Card variant="default" className="p-3">
              <p className="text-white/50 text-[10px] uppercase mb-1">Avg Session</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-white">
                {overview.avgSessionDuration}
              </p>
              <p className="text-green-400 text-[10px] mt-1">+12.4% vs last week</p>
            </Card>
            <Card variant="default" className="p-3">
              <p className="text-white/50 text-[10px] uppercase mb-1">Bounce Rate</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-white">
                {overview.bounceRate.toFixed(1)}%
              </p>
              <p className="text-red-400 text-[10px] mt-1">+2.3% vs last week</p>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Weekly Traffic Chart */}
        <Card variant="default" className="p-3">
          <h2 className="font-semibold text-white text-sm mb-3">Weekly Traffic</h2>
          {isLoading ? (
            <div className="flex items-end justify-between h-36 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-white/10 rounded-t animate-pulse"
                    style={{ height: `${30 + Math.random() * 70}%` }}
                  />
                  <div className="h-4 w-8 bg-white/10 rounded mt-2 animate-pulse" />
                </div>
              ))}
            </div>
          ) : weeklyStats.length === 0 ? (
            <div className="h-36 flex items-center justify-center">
              <p className="text-white/30 text-sm">No data available</p>
            </div>
          ) : (
            <div className="flex items-end justify-between h-36 gap-2">
              {weeklyStats.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-[var(--orange)] rounded-t transition-all"
                    style={{
                      height: `${(day.pageViews / maxPageViews) * 100}%`,
                      minHeight: day.pageViews > 0 ? "4px" : "0",
                    }}
                  />
                  <span className="text-xs text-white/50 mt-2">{day.day}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Pages */}
        <Card variant="default" className="p-3">
          <h2 className="font-semibold text-white text-sm mb-3">Top Pages</h2>
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-[var(--black)] animate-pulse"
                >
                  <div className="h-4 w-24 bg-white/10 rounded" />
                  <div className="h-4 w-16 bg-white/10 rounded" />
                </div>
              ))
            ) : pageViews.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-white/30 text-sm">No page view data</p>
              </div>
            ) : (
              pageViews.map((page) => (
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
                      {page.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* API Usage */}
      <Card variant="default" className="overflow-hidden">
        <div className="p-3 border-b border-white/10">
          <h2 className="font-semibold text-white text-sm">API Usage (24h)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--dark-gray)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">
                  ENDPOINT
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/60">
                  CALLS
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/60">
                  AVG LATENCY
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/60">
                  % OF TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-t border-white/10",
                      i % 2 === 0 ? "bg-[var(--black)]" : "bg-[var(--dark-gray)]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-16 bg-white/10 rounded ml-auto animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-12 bg-white/10 rounded ml-auto animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 bg-white/10 rounded ml-auto animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : apiUsage.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-white/30"
                  >
                    No API usage data
                  </td>
                </tr>
              ) : (
                apiUsage.map((api, i) => {
                  const totalCalls = apiUsage.reduce(
                    (sum, a) => sum + a.calls,
                    0
                  );
                  const percentage =
                    totalCalls > 0
                      ? ((api.calls / totalCalls) * 100).toFixed(1)
                      : "0";
                  return (
                    <tr
                      key={api.endpoint}
                      className={cn(
                        "border-t border-white/10",
                        i % 2 === 0
                          ? "bg-[var(--black)]"
                          : "bg-[var(--dark-gray)]"
                      )}
                    >
                      <td className="px-4 py-3 text-white font-mono text-sm">
                        {api.endpoint}
                      </td>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
