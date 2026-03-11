"use client";

import { useState, useEffect, useCallback } from "react";

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
  cacheHitRate: number | null;
}

interface ActivityItem {
  id: string;
  type: "insight" | "job";
  message: string;
  time: string;
}

interface DashboardData {
  status: SystemStatus;
  stats: DashboardStats;
  recentActivity: ActivityItem[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json);
        setError(null);
      } else {
        setError(json.error || "Failed to load dashboard");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleClearCache = async () => {
    try {
      setIsClearingCache(true);
      const res = await fetch("/api/admin/cache/clear", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await fetchDashboard();
      }
    } catch {
      // Cache clear failed silently
    } finally {
      setIsClearingCache(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "var(--green)";
      case "degraded":
        return "var(--yellow)";
      default:
        return "var(--red)";
    }
  };

  const stats = [
    {
      label: "Games Today",
      value: data?.stats.totalGames ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      label: "AI Insights Generated",
      value: data?.stats.totalInsights ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
          <path d="M12 8v8" />
          <path d="M12 16h.01" />
        </svg>
      ),
    },
    {
      label: "API Calls (24h)",
      value: data?.stats.apiCalls24h ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: "Cache Hit Rate",
      value: data?.stats.cacheHitRate != null ? `${data.stats.cacheHitRate}%` : "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      ),
    },
    {
      label: "Total Players",
      value: data?.stats.totalPlayers ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "AI Tokens Used",
      value: data?.stats.aiTokensUsed?.toLocaleString() ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  const healthItems = data?.status
    ? [
        { name: "Main API", status: data.status.api },
        { name: "PostgreSQL", status: data.status.database },
        { name: "DeepSeek AI", status: data.status.aiService },
        { name: "Redis Cache", status: data.status.cache },
      ]
    : [];

  return (
    <>
      {/* Header */}
      <div className="admin-header">
        <h1>
          SYSTEM DASHBOARD
          {data?.status && (
            <span className="status-indicator">
              <span className="pulse-dot" style={{
                background: Object.values(data.status).every(s => s === "healthy")
                  ? "var(--green)"
                  : "var(--yellow)"
              }}></span>
              {Object.values(data.status).every(s => s === "healthy")
                ? "All Systems Operational"
                : "Some Issues Detected"}
            </span>
          )}
        </h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <button
            className="btn btn-primary"
            onClick={fetchDashboard}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleClearCache}
            disabled={isClearingCache}
          >
            {isClearingCache ? "Clearing..." : "Clear Cache"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
            <button className="btn btn-primary" onClick={fetchDashboard} style={{ marginTop: "20px" }}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="value">{stat.value}</div>
                  <div className="label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Two Column Layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
              {/* Recent Activity */}
              <div className="section">
                <div className="section-title">Recent Activity</div>
                <div className="activity-log">
                  {data?.recentActivity && data.recentActivity.length > 0 ? (
                    data.recentActivity.map((item) => (
                      <div key={item.id} className="activity-item">
                        <span className="activity-time">{item.time}</span>
                        <div className="activity-content">
                          <span>{item.message}</span>
                          <div className="activity-user">
                            {item.type === "job" ? "System" : "AI Bot"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "rgba(255,255,255,0.5)", padding: "20px" }}>
                      No recent activity
                    </p>
                  )}
                </div>
              </div>

              {/* API Health */}
              <div className="section">
                <div className="section-title">API Health</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {healthItems.length > 0 ? (
                    healthItems.map((item) => (
                      <div key={item.name} className="health-item">
                        <div>
                          <h4>{item.name}</h4>
                        </div>
                        <span
                          className={`health-badge ${item.status}`}
                          style={{ color: getStatusColor(item.status) }}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "rgba(255,255,255,0.5)", padding: "20px" }}>
                      Unable to check health status
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
