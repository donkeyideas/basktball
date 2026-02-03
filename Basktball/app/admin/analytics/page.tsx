"use client";

import useSWR from "swr";
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
  const totalCalls = apiUsage.reduce((sum, a) => sum + a.calls, 0);

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden">
      {/* Header + Overview Stats Inline */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-[family-name:var(--font-anton)] text-xl tracking-wider text-white">
          ANALYTICS
        </h1>
        {/* Inline Stats */}
        {isLoading ? (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-8 h-4 bg-white/10 rounded animate-pulse" />
                <div className="w-12 h-3 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Visitors:</span>
              <span className="font-mono text-white">
                {overview.totalVisitors7d > 1000
                  ? `${(overview.totalVisitors7d / 1000).toFixed(1)}K`
                  : overview.totalVisitors7d}
              </span>
              <span className="text-green-400 text-[10px]">+15%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Views:</span>
              <span className="font-mono text-white">
                {overview.totalPageViews7d > 1000
                  ? `${(overview.totalPageViews7d / 1000).toFixed(1)}K`
                  : overview.totalPageViews7d}
              </span>
              <span className="text-green-400 text-[10px]">+9%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Sess:</span>
              <span className="font-mono text-white">{overview.avgSessionDuration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Bounce:</span>
              <span className="font-mono text-white">{overview.bounceRate.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-2 h-32">
        {/* Weekly Traffic Chart */}
        <div className="bg-[var(--dark-gray)] rounded p-2 flex flex-col">
          <h2 className="text-[10px] text-white/50 uppercase mb-1">Weekly Traffic</h2>
          {isLoading ? (
            <div className="flex items-end justify-between flex-1 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div
                    className="w-full bg-white/10 rounded-t animate-pulse"
                    style={{ height: `${30 + Math.random() * 50}%` }}
                  />
                  <span className="text-[8px] text-white/30 mt-0.5">-</span>
                </div>
              ))}
            </div>
          ) : weeklyStats.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/30 text-xs">No data</p>
            </div>
          ) : (
            <div className="flex items-end justify-between flex-1 gap-1">
              {weeklyStats.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div
                    className="w-full bg-[var(--orange)] rounded-t transition-all"
                    style={{
                      height: `${(day.pageViews / maxPageViews) * 80}%`,
                      minHeight: day.pageViews > 0 ? "2px" : "0",
                    }}
                  />
                  <span className="text-[8px] text-white/40 mt-0.5">{day.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Pages */}
        <div className="bg-[var(--dark-gray)] rounded p-2 flex flex-col overflow-hidden">
          <h2 className="text-[10px] text-white/50 uppercase mb-1">Top Pages</h2>
          <div className="flex-1 overflow-auto space-y-0.5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-0.5 animate-pulse">
                  <div className="h-3 w-20 bg-white/10 rounded" />
                  <div className="h-3 w-10 bg-white/10 rounded" />
                </div>
              ))
            ) : pageViews.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-2">No data</p>
            ) : (
              pageViews.slice(0, 6).map((page) => (
                <div key={page.page} className="flex items-center justify-between py-0.5">
                  <span className="text-white text-[10px] font-mono truncate flex-1 mr-2">
                    {page.page}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-[10px]">{page.views}</span>
                    <span
                      className={cn(
                        "text-[9px] w-8",
                        page.change >= 0 ? "text-green-400" : "text-red-400"
                      )}
                    >
                      {page.change >= 0 ? "+" : ""}{page.change.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* API Usage Table */}
      <div className="flex-1 min-h-0 bg-[var(--dark-gray)] rounded overflow-hidden flex flex-col">
        <div className="px-2 py-1.5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-white text-xs uppercase tracking-wide">API Usage (24h)</h2>
          <span className="text-[10px] text-white/40">{totalCalls.toLocaleString()} total calls</span>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--dark-gray)]">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-white/50 uppercase">Endpoint</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-white/50 uppercase">Calls</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-white/50 uppercase">Latency</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-white/50 uppercase w-28">Share</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-2 py-1.5"><div className="h-3 w-24 bg-white/10 rounded animate-pulse" /></td>
                    <td className="px-2 py-1.5"><div className="h-3 w-10 bg-white/10 rounded ml-auto animate-pulse" /></td>
                    <td className="px-2 py-1.5"><div className="h-3 w-8 bg-white/10 rounded ml-auto animate-pulse" /></td>
                    <td className="px-2 py-1.5"><div className="h-2 w-16 bg-white/10 rounded ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : apiUsage.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-white/30 text-xs">
                    No API usage data
                  </td>
                </tr>
              ) : (
                apiUsage.map((api, i) => {
                  const percentage = totalCalls > 0 ? ((api.calls / totalCalls) * 100).toFixed(1) : "0";
                  return (
                    <tr
                      key={api.endpoint}
                      className={cn("border-t border-white/5", i % 2 === 0 ? "bg-[var(--black)]/30" : "")}
                    >
                      <td className="px-2 py-1.5 text-white font-mono">{api.endpoint}</td>
                      <td className="px-2 py-1.5 text-right text-white/60">{api.calls.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right text-white/60">{api.avgLatency}ms</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 h-1.5 bg-[var(--black)] rounded overflow-hidden">
                            <div
                              className="h-full bg-[var(--orange)]"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-white/40 text-[10px] w-8 text-right">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
