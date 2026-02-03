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

// Mock data
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
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "down":
        return "bg-red-500";
    }
  };

  const getStatusText = (s: "healthy" | "degraded" | "down") => {
    switch (s) {
      case "healthy":
        return "Operational";
      case "degraded":
        return "Degraded";
      case "down":
        return "Down";
    }
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
            DASHBOARD
          </h1>
          <p className="text-white/50 text-sm mt-1">
            System overview and monitoring
          </p>
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
      <Card variant="bordered" className="p-5 mb-6">
        <h2 className="font-bold text-white mb-4">System Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(status).map(([key, value]) => (
            <div
              key={key}
              className="bg-[var(--black)] p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-white/50 text-xs uppercase">{key}</p>
                <p className="text-white font-semibold text-sm">
                  {getStatusText(value)}
                </p>
              </div>
              <div className={cn("w-3 h-3 rounded-full", getStatusColor(value))} />
            </div>
          ))}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">Total Games</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            {stats.totalGames.toLocaleString()}
          </p>
        </Card>
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">Total Players</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            {stats.totalPlayers.toLocaleString()}
          </p>
        </Card>
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">AI Insights</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            {stats.totalInsights.toLocaleString()}
          </p>
        </Card>
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">Pending Review</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-[var(--orange)]">
            {stats.pendingReviews}
          </p>
        </Card>
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">API Calls (24h)</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            {(stats.apiCalls24h / 1000).toFixed(1)}K
          </p>
        </Card>
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">AI Tokens Used</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            {(stats.aiTokensUsed / 1000).toFixed(0)}K
          </p>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card variant="default" className="p-5">
          <h2 className="font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {mockRecentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-3 border-b border-white/10 last:border-0"
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    activity.type === "insight"
                      ? "bg-[var(--orange)]"
                      : activity.type === "api"
                        ? "bg-blue-500"
                        : "bg-green-500"
                  )}
                />
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.message}</p>
                  <p className="text-white/40 text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card variant="default" className="p-5">
          <h2 className="font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-[var(--dark-gray)] hover:bg-[var(--gray)] p-4 text-left transition-colors">
              <span className="text-2xl block mb-2">🔄</span>
              <span className="text-white font-semibold text-sm block">Sync Data</span>
              <span className="text-white/50 text-xs">Fetch latest scores</span>
            </button>
            <button className="bg-[var(--dark-gray)] hover:bg-[var(--gray)] p-4 text-left transition-colors">
              <span className="text-2xl block mb-2">🤖</span>
              <span className="text-white font-semibold text-sm block">Generate Insights</span>
              <span className="text-white/50 text-xs">Run AI generation</span>
            </button>
            <button className="bg-[var(--dark-gray)] hover:bg-[var(--gray)] p-4 text-left transition-colors">
              <span className="text-2xl block mb-2">🗑️</span>
              <span className="text-white font-semibold text-sm block">Clear Cache</span>
              <span className="text-white/50 text-xs">Reset cached data</span>
            </button>
            <button className="bg-[var(--dark-gray)] hover:bg-[var(--gray)] p-4 text-left transition-colors">
              <span className="text-2xl block mb-2">📊</span>
              <span className="text-white font-semibold text-sm block">View Logs</span>
              <span className="text-white/50 text-xs">System logs</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
