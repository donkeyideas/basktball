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
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "down":
        return "bg-red-500";
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
            DASHBOARD
          </h1>
          <p className="text-white/50 text-sm">System overview and monitoring</p>
        </div>
        <div className="text-right">
          <p className="font-[family-name:var(--font-roboto-mono)] text-xl text-white">
            {currentTime.toLocaleTimeString()}
          </p>
          <p className="text-white/50 text-sm">
            {currentTime.toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[var(--dark-gray)] p-4 animate-pulse rounded"
              >
                <div className="h-4 w-16 bg-white/10 rounded mb-2" />
                <div className="h-6 w-12 bg-white/10 rounded" />
              </div>
            ))
          : Object.entries(status).map(([key, value]) => (
              <div
                key={key}
                className="bg-[var(--dark-gray)] p-4 flex items-center justify-between rounded"
              >
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
                    {key}
                  </p>
                  <p className="text-white text-lg font-semibold">
                    {value === "healthy"
                      ? "OK"
                      : value === "degraded"
                      ? "Warn"
                      : "Down"}
                  </p>
                </div>
                <div
                  className={cn("w-3 h-3 rounded-full", getStatusColor(value))}
                />
              </div>
            ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[var(--dark-gray)] p-4 animate-pulse rounded">
              <div className="h-4 w-16 bg-white/10 rounded mb-2" />
              <div className="h-8 w-20 bg-white/10 rounded" />
            </div>
          ))
        ) : (
          <>
            <div className="bg-[var(--dark-gray)] p-4 rounded">
              <p className="text-white/50 text-xs uppercase mb-1">Games</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
                {stats.totalGames.toLocaleString()}
              </p>
            </div>
            <div className="bg-[var(--dark-gray)] p-4 rounded">
              <p className="text-white/50 text-xs uppercase mb-1">Players</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
                {stats.totalPlayers.toLocaleString()}
              </p>
            </div>
            <div className="bg-[var(--dark-gray)] p-4 rounded">
              <p className="text-white/50 text-xs uppercase mb-1">Insights</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
                {stats.totalInsights.toLocaleString()}
              </p>
            </div>
            <div className="bg-[var(--dark-gray)] p-4 rounded">
              <p className="text-white/50 text-xs uppercase mb-1">Pending</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-[var(--orange)]">
                {stats.pendingReviews}
              </p>
            </div>
            <div className="bg-[var(--dark-gray)] p-4 rounded">
              <p className="text-white/50 text-xs uppercase mb-1">API 24h</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
                {(stats.apiCalls24h / 1000).toFixed(1)}K
              </p>
            </div>
            <div className="bg-[var(--dark-gray)] p-4 rounded">
              <p className="text-white/50 text-xs uppercase mb-1">Tokens</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
                {(stats.aiTokensUsed / 1000).toFixed(0)}K
              </p>
            </div>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-[var(--dark-gray)] rounded flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-semibold text-white text-lg">Recent Activity</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 animate-pulse"
                  >
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                    <div className="h-4 flex-1 bg-white/10 rounded" />
                    <div className="h-4 w-20 bg-white/10 rounded" />
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">
                  No recent activity
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        activity.type === "insight"
                          ? "bg-[var(--orange)]"
                          : activity.type === "api"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      )}
                    />
                    <span className="text-white flex-1 text-sm">
                      {activity.message}
                    </span>
                    <span className="text-white/40 text-xs flex-shrink-0">
                      {activity.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--dark-gray)] rounded flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-semibold text-white text-lg">Quick Actions</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              <button className="w-full bg-[var(--black)] hover:bg-[var(--gray)] p-4 text-left transition-colors flex items-center gap-4 rounded">
                <div className="w-10 h-10 bg-blue-500/20 flex items-center justify-center rounded">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-white font-medium block">Sync Data</span>
                  <span className="text-white/40 text-xs">Fetch latest scores</span>
                </div>
              </button>
              <button className="w-full bg-[var(--black)] hover:bg-[var(--gray)] p-4 text-left transition-colors flex items-center gap-4 rounded">
                <div className="w-10 h-10 bg-purple-500/20 flex items-center justify-center rounded">
                  <svg
                    className="w-5 h-5 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-white font-medium block">Generate Insights</span>
                  <span className="text-white/40 text-xs">Run AI generation</span>
                </div>
              </button>
              <button className="w-full bg-[var(--black)] hover:bg-[var(--gray)] p-4 text-left transition-colors flex items-center gap-4 rounded">
                <div className="w-10 h-10 bg-red-500/20 flex items-center justify-center rounded">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-white font-medium block">Clear Cache</span>
                  <span className="text-white/40 text-xs">Reset cached data</span>
                </div>
              </button>
              <button className="w-full bg-[var(--black)] hover:bg-[var(--gray)] p-4 text-left transition-colors flex items-center gap-4 rounded">
                <div className="w-10 h-10 bg-green-500/20 flex items-center justify-center rounded">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-white font-medium block">View Logs</span>
                  <span className="text-white/40 text-xs">System logs</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
