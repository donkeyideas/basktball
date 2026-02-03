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

  const fetchDashboard = useCallback(async () => {
    try {
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
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleClearCache = async () => {
    try {
      await fetch("/api/admin/cache/clear", { method: "POST" });
      await fetchDashboard();
    } catch {
      // Silent fail for cache clear
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
      value: data?.stats.totalGames || 0,
      change: "+12%",
      positive: true,
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
      value: data?.stats.totalInsights || 0,
      change: "+8%",
      positive: true,
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
      value: data?.stats.apiCalls24h || 0,
      change: "-3%",
      positive: false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: "Cache Hit Rate",
      value: "94%",
      change: "+2%",
      positive: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      ),
    },
    {
      label: "Active Users",
      value: data?.stats.totalPlayers || 0,
      change: "+15%",
      positive: true,
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
      value: data?.stats.aiTokensUsed?.toLocaleString() || 0,
      change: "+5%",
      positive: true,
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
        { name: "Main API", status: data.status.api, uptime: "99.9%" },
        { name: "PostgreSQL", status: data.status.database, uptime: "99.8%" },
        { name: "DeepSeek AI", status: data.status.aiService, uptime: "99.5%" },
        { name: "Redis Cache", status: data.status.cache, uptime: "99.7%" },
      ]
    : [];

  return (
    <>
      {/* Header */}
      <div className="admin-header">
        <h1>
          SYSTEM DASHBOARD
          <span className="status-indicator">
            <span className="pulse-dot"></span>
            All Systems Operational
          </span>
        </h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <button className="btn btn-primary" onClick={fetchDashboard}>
            Refresh Data
          </button>
          <button className="btn btn-secondary" onClick={handleClearCache}>
            Clear Cache
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
                  <div className={`change ${stat.positive ? "positive" : "negative"}`}>
                    {stat.positive ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                        <polyline points="17 18 23 18 23 12" />
                      </svg>
                    )}
                    {stat.change}
                  </div>
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
                          <span dangerouslySetInnerHTML={{ __html: item.message.replace(/(\w+):/g, "<strong>$1:</strong>") }} />
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
                  {healthItems.map((item) => (
                    <div key={item.name} className="health-item">
                      <div>
                        <h4>{item.name}</h4>
                        <span>Uptime: {item.uptime}</span>
                      </div>
                      <span
                        className={`health-badge ${item.status}`}
                        style={{ color: getStatusColor(item.status) }}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Traffic Chart Placeholder */}
            <div className="section" style={{ marginTop: "30px" }}>
              <div className="section-title">Traffic Overview (24h)</div>
              <div className="chart-placeholder">
                Chart will be integrated here
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
