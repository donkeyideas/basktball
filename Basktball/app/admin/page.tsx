"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";

interface SystemStatus {
  api: "healthy" | "degraded" | "down";
  database: "healthy" | "degraded" | "down";
  aiService: "healthy" | "degraded" | "down";
  cache: "healthy" | "degraded" | "down";
}

interface DashboardStats {
  totalGames: number;
  totalPlayers: number;
  totalInsights: number;
  pendingReviews: number;
  apiCalls24h: number;
  aiTokensUsed: number;
}

interface RecentActivity {
  id: string;
  type: "insight" | "job" | "api";
  message: string;
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
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data, isLoading } = useSWR<DashboardData>(
    "/api/admin/dashboard",
    fetcher,
    { refreshInterval: 30000 }
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const status = data?.status || {
    api: "down" as const,
    database: "down" as const,
    aiService: "down" as const,
    cache: "down" as const,
  };

  const stats = data?.stats || {
    totalGames: 0,
    totalPlayers: 0,
    totalInsights: 0,
    pendingReviews: 0,
    apiCalls24h: 0,
    aiTokensUsed: 0,
  };

  const recentActivity = data?.recentActivity || [];

  const getStatusColor = (s: "healthy" | "degraded" | "down") => {
    switch (s) {
      case "healthy": return "bg-green-500";
      case "degraded": return "bg-yellow-500";
      case "down": return "bg-red-500";
    }
  };

  const statusLabels: Record<string, string> = {
    api: "API",
    database: "DB",
    aiService: "AI",
    cache: "Cache",
  };

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden">
      {/* Header Row: Title + Status Strip + Time */}
      <div className="flex items-center justify-between mb-2 h-7">
        <div className="flex items-center gap-4">
          <h1 className="font-[family-name:var(--font-anton)] text-xl tracking-wider text-white">
            DASHBOARD
          </h1>
          {/* Inline Status Strip */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white/10 animate-pulse" />
                    <div className="w-8 h-3 bg-white/10 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              Object.entries(status).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={cn("w-2 h-2 rounded-full", getStatusColor(value))} />
                  <span className="text-[10px] text-white/50 uppercase">{statusLabels[key]}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <span className="text-xs">{currentTime.toLocaleDateString()}</span>
          <span className="font-[family-name:var(--font-roboto-mono)] text-sm text-white">
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Dense Stats Grid - 6 columns */}
      <div className="grid grid-cols-6 gap-1.5 mb-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[var(--dark-gray)] p-2 rounded animate-pulse">
              <div className="h-3 w-10 bg-white/10 rounded mb-1" />
              <div className="h-5 w-14 bg-white/10 rounded" />
            </div>
          ))
        ) : (
          <>
            <div className="bg-[var(--dark-gray)] p-2 rounded text-center">
              <p className="text-[10px] text-white/50 uppercase">Games</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-sm text-white">
                {stats.totalGames.toLocaleString()}
              </p>
            </div>
            <div className="bg-[var(--dark-gray)] p-2 rounded text-center">
              <p className="text-[10px] text-white/50 uppercase">Players</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-sm text-white">
                {stats.totalPlayers.toLocaleString()}
              </p>
            </div>
            <div className="bg-[var(--dark-gray)] p-2 rounded text-center">
              <p className="text-[10px] text-white/50 uppercase">Insights</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-sm text-white">
                {stats.totalInsights.toLocaleString()}
              </p>
            </div>
            <div className="bg-[var(--dark-gray)] p-2 rounded text-center">
              <p className="text-[10px] text-white/50 uppercase">Pending</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-sm text-[var(--orange)]">
                {stats.pendingReviews}
              </p>
            </div>
            <div className="bg-[var(--dark-gray)] p-2 rounded text-center">
              <p className="text-[10px] text-white/50 uppercase">API 24h</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-sm text-white">
                {(stats.apiCalls24h / 1000).toFixed(1)}K
              </p>
            </div>
            <div className="bg-[var(--dark-gray)] p-2 rounded text-center">
              <p className="text-[10px] text-white/50 uppercase">Tokens</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-sm text-white">
                {(stats.aiTokensUsed / 1000).toFixed(0)}K
              </p>
            </div>
          </>
        )}
      </div>

      {/* Main Content - Activity + Actions Toolbar */}
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--dark-gray)] rounded overflow-hidden">
        {/* Toolbar Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
          <h2 className="font-semibold text-white text-xs uppercase tracking-wide">Recent Activity</h2>
          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 hover:bg-white/10 rounded transition-colors group relative"
              title="Sync Data"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-[var(--gray)] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                Sync Data
              </span>
            </button>
            <button
              className="p-1.5 hover:bg-white/10 rounded transition-colors group relative"
              title="Generate Insights"
            >
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-[var(--gray)] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                Generate Insights
              </span>
            </button>
            <button
              className="p-1.5 hover:bg-white/10 rounded transition-colors group relative"
              title="Clear Cache"
            >
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-[var(--gray)] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                Clear Cache
              </span>
            </button>
            <button
              className="p-1.5 hover:bg-white/10 rounded transition-colors group relative"
              title="View Logs"
            >
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-[var(--gray)] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                View Logs
              </span>
            </button>
          </div>
        </div>

        {/* Activity List - Fills remaining space */}
        <div className="flex-1 overflow-auto px-3 py-2">
          {isLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 py-1 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <div className="h-3 flex-1 bg-white/10 rounded" />
                  <div className="h-3 w-12 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-0.5">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0"
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      activity.type === "insight"
                        ? "bg-[var(--orange)]"
                        : activity.type === "api"
                        ? "bg-blue-500"
                        : "bg-green-500"
                    )}
                  />
                  <span className="text-white flex-1 text-xs truncate">
                    {activity.message}
                  </span>
                  <span className="text-white/40 text-[10px] flex-shrink-0">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
