"use client";

import { useState, useEffect, useCallback } from "react";

interface HealthStatus {
  api: "healthy" | "degraded" | "down";
  database: "healthy" | "degraded" | "down";
  aiService: "healthy" | "degraded" | "down";
  cache: "healthy" | "degraded" | "down";
}

interface ExternalApiStatus {
  name: string;
  status: "healthy" | "degraded" | "down" | "checking";
  description: string;
}

const healthItems = [
  { key: "api", name: "Main API", description: "Core application endpoints" },
  { key: "database", name: "PostgreSQL", description: "Primary database" },
  { key: "aiService", name: "DeepSeek AI", description: "AI content generation" },
  { key: "cache", name: "Redis Cache", description: "Caching layer" },
];

const externalApiConfigs = [
  { name: "ESPN NBA API", endpoint: "/api/games?league=nba", description: "NBA game data" },
  { name: "ESPN WNBA API", endpoint: "/api/games?league=wnba", description: "WNBA game data" },
  { name: "ESPN NCAA API", endpoint: "/api/games?league=ncaam", description: "NCAA game data" },
];

export default function AdminApiHealthPage() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [externalApis, setExternalApis] = useState<ExternalApiStatus[]>(
    externalApiConfigs.map(c => ({ name: c.name, status: "checking", description: c.description }))
  );
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

  const checkExternalApis = useCallback(async () => {
    const results: ExternalApiStatus[] = [];

    for (const config of externalApiConfigs) {
      try {
        const start = Date.now();
        const res = await fetch(config.endpoint);
        const elapsed = Date.now() - start;
        const data = await res.json();

        let status: "healthy" | "degraded" | "down" = "down";
        if (data.success) {
          status = elapsed > 3000 ? "degraded" : "healthy";
        }

        results.push({
          name: config.name,
          status,
          description: config.description,
        });
      } catch {
        results.push({
          name: config.name,
          status: "down",
          description: config.description,
        });
      }
    }

    setExternalApis(results);
  }, []);

  useEffect(() => {
    fetchHealth();
    checkExternalApis();
    const interval = setInterval(() => {
      fetchHealth();
      checkExternalApis();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchHealth, checkExternalApis]);

  const getStatusColor = (s: string) => {
    switch (s) {
      case "healthy": return "var(--green)";
      case "degraded": return "var(--yellow)";
      case "checking": return "rgba(255,255,255,0.5)";
      default: return "var(--red)";
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "healthy": return "healthy";
      case "degraded": return "degraded";
      case "checking": return "paused";
      default: return "error";
    }
  };

  const allHealthy = status && Object.values(status).every(s => s === "healthy");

  return (
    <>
      <div className="admin-header">
        <h1>
          API HEALTH
          {status && (
            <span className="status-indicator" style={{
              color: allHealthy ? "var(--green)" : "var(--yellow)"
            }}>
              <span className="pulse-dot" style={{
                background: allHealthy ? "var(--green)" : "var(--yellow)"
              }}></span>
              {allHealthy ? "All Systems Operational" : "Some Issues Detected"}
            </span>
          )}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {lastChecked && (
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button className="btn btn-primary" onClick={() => { fetchHealth(); checkExternalApis(); }}>
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
              <div className="section-title">External Data Sources</div>
              <div className="health-grid">
                {externalApis.map(api => (
                  <div key={api.name} className="health-item">
                    <div>
                      <h4>{api.name}</h4>
                      <span>{api.description}</span>
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
          </>
        )}
      </div>
    </>
  );
}
