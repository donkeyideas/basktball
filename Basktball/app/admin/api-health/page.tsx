"use client";

import { useState, useEffect, useCallback } from "react";

interface HealthStatus {
  api: "healthy" | "degraded" | "down";
  database: "healthy" | "degraded" | "down";
  aiService: "healthy" | "degraded" | "down";
  cache: "healthy" | "degraded" | "down";
}

const healthItems = [
  { key: "api", name: "Main API", description: "Core application endpoints" },
  { key: "database", name: "PostgreSQL", description: "Primary database" },
  { key: "aiService", name: "DeepSeek AI", description: "AI content generation" },
  { key: "cache", name: "Redis Cache", description: "Caching layer" },
];

const externalApis = [
  { name: "NBA Stats API", status: "healthy", uptime: "99.9%" },
  { name: "WNBA API", status: "healthy", uptime: "99.8%" },
  { name: "NCAA Stats API", status: "healthy", uptime: "99.5%" },
  { name: "EuroLeague API", status: "degraded", uptime: "98.2%" },
  { name: "BallDontLie API", status: "healthy", uptime: "99.7%" },
];

export default function AdminApiHealthPage() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
        setLastChecked(new Date());
        setError(null);
      } else {
        setError(data.error || "Failed to check health");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getStatusColor = (s: string) => {
    switch (s) {
      case "healthy": return "var(--green)";
      case "degraded": return "var(--yellow)";
      default: return "var(--red)";
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "healthy": return "healthy";
      case "degraded": return "degraded";
      default: return "error";
    }
  };

  const allHealthy = status && Object.values(status).every(s => s === "healthy");

  return (
    <>
      <div className="admin-header">
        <h1>
          API HEALTH
          <span className="status-indicator" style={{
            color: allHealthy ? "var(--green)" : "var(--yellow)"
          }}>
            <span className="pulse-dot" style={{
              background: allHealthy ? "var(--green)" : "var(--yellow)"
            }}></span>
            {allHealthy ? "All Systems Operational" : "Some Issues Detected"}
          </span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {lastChecked && (
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button className="btn btn-primary" onClick={fetchHealth}>
            Check Now
          </button>
        </div>
      </div>

      <div className="admin-content">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Checking health status...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Internal Services */}
            <div className="section">
              <div className="section-title">Internal Services</div>
              <div className="health-grid">
                {healthItems.map(item => (
                  <div key={item.key} className="health-item">
                    <div>
                      <h4>{item.name}</h4>
                      <span>{item.description}</span>
                    </div>
                    <span
                      className={`health-badge ${getStatusBadgeClass(status?.[item.key as keyof HealthStatus] || "down")}`}
                      style={{ color: getStatusColor(status?.[item.key as keyof HealthStatus] || "down") }}
                    >
                      {(status?.[item.key as keyof HealthStatus] || "DOWN").toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* External APIs */}
            <div className="section">
              <div className="section-title">External APIs</div>
              <div className="health-grid">
                {externalApis.map(api => (
                  <div key={api.name} className="health-item">
                    <div>
                      <h4>{api.name}</h4>
                      <span>Uptime: {api.uptime}</span>
                    </div>
                    <span
                      className={`health-badge ${getStatusBadgeClass(api.status)}`}
                      style={{ color: getStatusColor(api.status) }}
                    >
                      {api.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Times Chart */}
            <div className="section">
              <div className="section-title">Response Times (24h)</div>
              <div className="chart-placeholder">
                Response time chart will be integrated here
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
