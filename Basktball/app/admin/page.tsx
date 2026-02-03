"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
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

const mockStatus: SystemStatus = {
  api: "healthy",
  database: "healthy",
  aiService: "healthy",
  cache: "healthy",
};

const mockStats: DashboardStats = {
  totalGames: 1247,
  totalPlayers: 892,
  totalInsights: 3456,
  pendingReviews: 12,
  apiCalls24h: 45230,
  aiTokensUsed: 125000,
};

const mockRecentActivity = [
  { id: "1", type: "insight", message: "Generated game recap: LAL vs GSW", time: "2 min ago" },
  { id: "2", type: "api", message: "Fetched live scores from ESPN", time: "5 min ago" },
  { id: "3", type: "insight", message: "Generated player analysis: LeBron James", time: "12 min ago" },
  { id: "4", type: "job", message: "Daily sync completed successfully", time: "1 hour ago" },
  { id: "5", type: "api", message: "Updated standings for NBA", time: "2 hours ago" },
];

export default function AdminDashboard() {
  const [status] = useState<SystemStatus>(mockStatus);
  const [stats] = useState<DashboardStats>(mockStats);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (s: "healthy" | "degraded" | "down") => {
    switch (s) {
      case "healthy": return "bg-green-500";
      case "degraded": return "bg-yellow-500";
      case "down": return "bg-red-500";
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-[family-name:var(--font-anton)] text-2xl tracking-wider text-white">
            DASHBOARD
          </h1>
          <p className="text-white/50 text-xs">System overview</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-[family-name:var(--font-roboto-mono)] text-white">
            {currentTime.toLocaleTimeString()}
          </p>
          <p className="text-white/50 text-xs">{currentTime.toLocaleDateString()}</p>
        </div>
      </div>

      {/* Top Row: Status + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
        {/* System Status */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-2">
          {Object.entries(status).map(([key, value]) => (
            <div key={key} className="bg-[var(--dark-gray)] p-3 flex items-center justify-between">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wide">{key}</p>
                <p className="text-white text-xs font-medium">
                  {value === "healthy" ? "OK" : value === "degraded" ? "Warn" : "Down"}
                </p>
              </div>
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(value))} />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="lg:col-span-8 grid grid-cols-3 md:grid-cols-6 gap-2">
          <div className="bg-[var(--dark-gray)] p-3">
            <p className="text-white/50 text-[10px] uppercase">Games</p>
            <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-white">
              {stats.totalGames.toLocaleString()}
            </p>
          </div>
          <div className="bg-[var(--dark-gray)] p-3">
            <p className="text-white/50 text-[10px] uppercase">Players</p>
            <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-white">
              {stats.totalPlayers.toLocaleString()}
            </p>
          </div>
          <div className="bg-[var(--dark-gray)] p-3">
            <p className="text-white/50 text-[10px] uppercase">Insights</p>
            <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-white">
              {stats.totalInsights.toLocaleString()}
            </p>
          </div>
          <div className="bg-[var(--dark-gray)] p-3">
            <p className="text-white/50 text-[10px] uppercase">Pending</p>
            <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-[var(--orange)]">
              {stats.pendingReviews}
            </p>
          </div>
          <div className="bg-[var(--dark-gray)] p-3">
            <p className="text-white/50 text-[10px] uppercase">API 24h</p>
            <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-white">
              {(stats.apiCalls24h / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-[var(--dark-gray)] p-3">
            <p className="text-white/50 text-[10px] uppercase">Tokens</p>
            <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-white">
              {(stats.aiTokensUsed / 1000).toFixed(0)}K
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-[var(--dark-gray)] p-4">
          <h2 className="font-semibold text-white text-sm mb-3 border-b border-white/10 pb-2">
            Recent Activity
          </h2>
          <div className="space-y-2">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-2 text-xs">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  activity.type === "insight" ? "bg-[var(--orange)]" :
                  activity.type === "api" ? "bg-blue-500" : "bg-green-500"
                )} />
                <span className="text-white flex-1 truncate">{activity.message}</span>
                <span className="text-white/40 flex-shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--dark-gray)] p-4">
          <h2 className="font-semibold text-white text-sm mb-3 border-b border-white/10 pb-2">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <button className="w-full bg-[var(--black)] hover:bg-[var(--gray)] p-3 text-left transition-colors flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <span className="text-white text-sm block">Sync Data</span>
                <span className="text-white/40 text-[10px]">Fetch latest scores</span>
              </div>
            </button>
            <button className="w-full bg-[var(--black)] hover:bg-[var(--gray)] p-3 text-left transition-colors flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <span className="text-white text-sm block">Generate Insights</span>
                <span className="text-white/40 text-[10px]">Run AI generation</span>
              </div>
            </button>
            <button className="w-full bg-[var(--black)] hover:bg-[var(--gray)] p-3 text-left transition-colors flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <span className="text-white text-sm block">Clear Cache</span>
                <span className="text-white/40 text-[10px]">Reset cached data</span>
              </div>
            </button>
            <button className="w-full bg-[var(--black)] hover:bg-[var(--gray)] p-3 text-left transition-colors flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <span className="text-white text-sm block">View Logs</span>
                <span className="text-white/40 text-[10px]">System logs</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
