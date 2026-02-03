"use client";

import useSWR from "swr";
import { cn } from "@/lib/utils";

interface PageView {
  page: string;
  views: number;
  avgTime: string;
  bounceRate: number;
  change: number;
}

interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

interface AnalyticsData {
  success: boolean;
  overview: {
    pageViews30d: number;
    pageViewsChange: number;
    uniqueVisitors30d: number;
    visitorsChange: number;
    revenue30d: number;
    revenueChange: number;
    rpm: number;
    rpmChange: number;
  };
  topPages: PageView[];
  trafficSources: TrafficSource[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR<AnalyticsData>(
    "/api/admin/analytics",
    fetcher,
    { refreshInterval: 60000 }
  );

  const overview = data?.overview || {
    pageViews30d: 0,
    pageViewsChange: 0,
    uniqueVisitors30d: 0,
    visitorsChange: 0,
    revenue30d: 0,
    revenueChange: 0,
    rpm: 0,
    rpmChange: 0,
  };
  const topPages = data?.topPages || [];
  const trafficSources = data?.trafficSources || [];

  const formatChange = (change: number) => {
    const prefix = change >= 0 ? "+" : "";
    return `${prefix}${change.toFixed(1)}%`;
  };

  const getChangeClass = (change: number) => {
    if (change > 0) return "text-[var(--green)]";
    if (change < 0) return "text-[var(--red)]";
    return "text-white/40";
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card p-6 animate-pulse">
              <div className="h-6 w-6 bg-white/10 rounded mb-4" />
              <div className="h-10 w-24 bg-white/10 rounded mb-2" />
              <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 section">
            <div className="section-header">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-white/10 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="section">
            <div className="section-header">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="p-4">
              <div className="h-64 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
          ANALYTICS
        </h1>
        <div className="flex items-center gap-2 text-sm text-white/40">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last 30 days
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="stat-card p-6">
          <div className="text-[var(--orange)] mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p className="stat-value">{(overview.pageViews30d / 1000).toFixed(1)}K</p>
          <div className="flex items-center justify-between">
            <p className="stat-label">Page Views (30d)</p>
            <span className={cn("stat-change", getChangeClass(overview.pageViewsChange))}>
              {formatChange(overview.pageViewsChange)}
            </span>
          </div>
        </div>

        <div className="stat-card p-6">
          <div className="text-[var(--orange)] mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="stat-value">{(overview.uniqueVisitors30d / 1000).toFixed(1)}K</p>
          <div className="flex items-center justify-between">
            <p className="stat-label">Unique Visitors (30d)</p>
            <span className={cn("stat-change", getChangeClass(overview.visitorsChange))}>
              {formatChange(overview.visitorsChange)}
            </span>
          </div>
        </div>

        <div className="stat-card p-6">
          <div className="text-[var(--orange)] mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="stat-value">${overview.revenue30d.toLocaleString()}</p>
          <div className="flex items-center justify-between">
            <p className="stat-label">Revenue (30d)</p>
            <span className={cn("stat-change", getChangeClass(overview.revenueChange))}>
              {formatChange(overview.revenueChange)}
            </span>
          </div>
        </div>

        <div className="stat-card p-6">
          <div className="text-[var(--orange)] mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="stat-value">${overview.rpm.toFixed(2)}</p>
          <div className="flex items-center justify-between">
            <p className="stat-label">RPM</p>
            <span className={cn("stat-change", getChangeClass(overview.rpmChange))}>
              {formatChange(overview.rpmChange)}
            </span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Top Pages Table */}
        <div className="col-span-2 section">
          <div className="section-header">
            <h2 className="section-title">Top Pages</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Views</th>
                  <th>Avg Time</th>
                  <th>Bounce Rate</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {topPages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-white/30">
                      No page data available
                    </td>
                  </tr>
                ) : (
                  topPages.map((page) => (
                    <tr key={page.page}>
                      <td className="text-white font-[family-name:var(--font-roboto-mono)]">
                        {page.page}
                      </td>
                      <td className="font-[family-name:var(--font-roboto-mono)] text-white">
                        {page.views.toLocaleString()}
                      </td>
                      <td className="text-white/60">
                        {page.avgTime}
                      </td>
                      <td className="text-white/60">
                        {page.bounceRate.toFixed(1)}%
                      </td>
                      <td className={cn("font-[family-name:var(--font-roboto-mono)]", getChangeClass(page.change))}>
                        {formatChange(page.change)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Traffic Sources</h2>
          </div>
          <div className="p-4 space-y-4">
            {trafficSources.length === 0 ? (
              <p className="text-white/30 text-center py-8">No traffic data</p>
            ) : (
              trafficSources.map((source) => (
                <div key={source.source}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">{source.source}</span>
                    <span className="text-white/60 text-sm">
                      {source.visitors.toLocaleString()} ({source.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--darker-gray)] rounded overflow-hidden">
                    <div
                      className="h-full bg-[var(--orange)] transition-all"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
