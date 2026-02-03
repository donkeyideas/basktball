"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { cn } from "@/lib/utils";

interface SystemStatus {
  api: "healthy" | "degraded" | "down";
  database: "healthy" | "degraded" | "down";
  aiService: "healthy" | "degraded" | "down";
  cache: "healthy" | "degraded" | "down";
}

interface DashboardStats {
  gamesToday: number;
  gamesTodayChange: number;
  insightsGenerated: number;
  insightsChange: number;
  apiCalls24h: number;
  apiCallsChange: number;
  cacheHitRate: number;
  cacheHitChange: number;
  activeUsers: number;
  activeUsersChange: number;
  revenueToday: number;
  revenueChange: number;
}

interface RecentActivity {
  id: string;
  type: "insight" | "job" | "api" | "user";
  message: string;
  user: string;
  time: string;
}

interface DashboardData {
  success: boolean;
  status: SystemStatus;
  stats: DashboardStats;
  recentActivity: RecentActivity[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const { data, isLoading } = useSWR<DashboardData>(
    "/api/admin/dashboard",
    fetcher,
    { refreshInterval: 30000 }
  );

  const stats = data?.stats || {
    gamesToday: 0,
    gamesTodayChange: 0,
    insightsGenerated: 0,
    insightsChange: 0,
    apiCalls24h: 0,
    apiCallsChange: 0,
    cacheHitRate: 0,
    cacheHitChange: 0,
    activeUsers: 0,
    activeUsersChange: 0,
    revenueToday: 0,
    revenueChange: 0,
  };

  const recentActivity = data?.recentActivity || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate("/api/admin/dashboard");
    setIsRefreshing(false);
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await fetch("/api/admin/cache", { method: "DELETE" });
      await mutate("/api/admin/dashboard");
    } catch (error) {
      console.error("Clear cache error:", error);
    }
    setIsClearingCache(false);
  };

  const formatChange = (change: number) => {
    const prefix = change >= 0 ? "+" : "";
    return `${prefix}${change.toFixed(1)}%`;
  };

  const getChangeClass = (change: number) => {
    if (change > 0) return "text-[var(--green)]";
    if (change < 0) return "text-[var(--red)]";
    return "text-white/40";
  };

  const statCards = [
    {
      label: "Games Today",
      value: stats.gamesToday.toString(),
      change: stats.gamesTodayChange,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "AI Insights Generated",
      value: stats.insightsGenerated.toLocaleString(),
      change: stats.insightsChange,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      label: "API Calls (24h)",
      value: stats.apiCalls24h >= 1000 ? `${(stats.apiCalls24h / 1000).toFixed(1)}K` : stats.apiCalls24h.toString(),
      change: stats.apiCallsChange,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      label: "Cache Hit Rate",
      value: `${stats.cacheHitRate.toFixed(1)}%`,
      change: stats.cacheHitChange,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
    },
    {
      label: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      change: stats.activeUsersChange,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: "Revenue (Today)",
      value: `$${stats.revenueToday.toLocaleString()}`,
      change: stats.revenueChange,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
            <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card p-6 animate-pulse">
              <div className="h-6 w-6 bg-white/10 rounded mb-4" />
              <div className="h-10 w-24 bg-white/10 rounded mb-2" />
              <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-2 gap-6">
          <div className="section">
            <div className="section-header">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-white/10 rounded animate-pulse" />
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
        <div className="flex items-center gap-4">
          <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
            SYSTEM DASHBOARD
          </h1>
          <div className="status-indicator">
            <span className="status-dot bg-[var(--green)] animate-pulse" />
            <span className="text-[var(--green)] text-sm font-medium">All Systems Operational</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary"
          >
            <svg className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
          <button
            onClick={handleClearCache}
            disabled={isClearingCache}
            className="btn btn-secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Cache
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card p-6">
            <div className="text-[var(--orange)] mb-4">
              {card.icon}
            </div>
            <p className="stat-value">{card.value}</p>
            <div className="flex items-center justify-between">
              <p className="stat-label">{card.label}</p>
              <span className={cn("stat-change", getChangeClass(card.change))}>
                {formatChange(card.change)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
          </div>
          <div className="activity-log">
            {recentActivity.length === 0 ? (
              <p className="text-white/30 text-center py-8">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      activity.type === "insight"
                        ? "bg-[var(--orange)]"
                        : activity.type === "api"
                        ? "bg-[var(--blue)]"
                        : activity.type === "user"
                        ? "bg-[var(--green)]"
                        : "bg-[var(--yellow)]"
                    )}
                  />
                  <span className="activity-time">{activity.time}</span>
                  <span className="flex-1 text-white text-sm">{activity.message}</span>
                  <span className="activity-user">{activity.user}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Traffic Chart */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Traffic Overview</h2>
          </div>
          <div className="chart-container">
            <div className="flex items-center justify-center h-64 text-white/30">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">Traffic chart visualization</p>
                <p className="text-xs text-white/20 mt-1">Data loading from API</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
