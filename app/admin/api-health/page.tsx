"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface ServiceCheck {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  detail?: string;
}

interface DailyStat {
  date: string;
  calls: number;
  errors: number;
  avgResponse: number;
}

interface EndpointStat {
  endpoint: string;
  calls: number;
  errors: number;
  avgResponse: number;
}

interface HealthData {
  overallStatus: "healthy" | "degraded" | "down";
  internal: ServiceCheck[];
  external: ServiceCheck[];
  apiUsage: {
    totalCalls24h: number;
    errors24h: number;
    errorRate24h: number;
    avgResponse24h: number;
    dailyStats: DailyStat[];
    topEndpoints: EndpointStat[];
  };
  checkedAt: string;
}

const statusColors: Record<string, string> = {
  healthy: "var(--green)",
  degraded: "var(--yellow)",
  down: "var(--red)",
  checking: "rgba(255,255,255,0.4)",
};

const statusBg: Record<string, string> = {
  healthy: "rgba(16, 185, 129, 0.15)",
  degraded: "rgba(245, 158, 11, 0.15)",
  down: "rgba(239, 68, 68, 0.15)",
  checking: "rgba(255,255,255,0.05)",
};

function ResponseTimeBadge({ ms }: { ms: number }) {
  if (ms === 0) return null;
  const color = ms < 300 ? "var(--green)" : ms < 1000 ? "var(--yellow)" : "var(--red)";
  return (
    <span style={{
      fontFamily: "var(--font-roboto-mono), monospace",
      fontSize: "12px",
      color,
      opacity: 0.8,
    }}>
      {ms}ms
    </span>
  );
}

export default function AdminApiHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const fetchHealth = useCallback(async (showLoading = false) => {
    if (showLoading) setChecking(true);
    try {
      const res = await fetch("/api/admin/health");
      const json = await res.json();
      if (json.success) {
        setData(json);
        setError(null);
      } else {
        setError(json.error || "Health check failed");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(), 60000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const overallColor = data ? statusColors[data.overallStatus] : "rgba(255,255,255,0.4)";
  const overallLabel = data
    ? data.overallStatus === "healthy"
      ? "All Systems Operational"
      : data.overallStatus === "degraded"
        ? "Some Issues Detected"
        : "Service Disruption"
    : "Checking...";

  return (
    <>
      <div className="admin-header">
        <h1>
          API HEALTH
          <span className="status-indicator" style={{ color: overallColor }}>
            <span className="pulse-dot" style={{ background: overallColor }} />
            {overallLabel}
          </span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {data && (
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              Last checked: {new Date(data.checkedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            className="btn btn-primary"
            onClick={() => fetchHealth(true)}
            disabled={checking}
            style={{ opacity: checking ? 0.6 : 1 }}
          >
            {checking ? "Checking..." : "Check Now"}
          </button>
        </div>
      </div>

      <div className="admin-content">
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Running health checks...</p>
          </div>
        ) : error && !data ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
          </div>
        ) : data ? (
          <>
            {/* Usage Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
              <div className="stat-card">
                <div className="value">{data.apiUsage.totalCalls24h.toLocaleString()}</div>
                <div className="label">API Calls (24h)</div>
              </div>
              <div className="stat-card">
                <div className="value" style={{
                  color: data.apiUsage.errorRate24h > 5 ? "var(--red)" : data.apiUsage.errorRate24h > 2 ? "var(--yellow)" : "var(--green)",
                }}>
                  {data.apiUsage.errorRate24h}%
                </div>
                <div className="label">Error Rate (24h)</div>
              </div>
              <div className="stat-card">
                <div className="value" style={{
                  color: data.apiUsage.avgResponse24h > 500 ? "var(--red)" : data.apiUsage.avgResponse24h > 200 ? "var(--yellow)" : "var(--green)",
                }}>
                  {data.apiUsage.avgResponse24h}<span style={{ fontSize: "14px", opacity: 0.6 }}>ms</span>
                </div>
                <div className="label">Avg Response (24h)</div>
              </div>
              <div className="stat-card">
                <div className="value" style={{ color: "var(--red)" }}>{data.apiUsage.errors24h}</div>
                <div className="label">Errors (24h)</div>
              </div>
            </div>

            {/* Internal + External Services */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
              <div className="section">
                <div className="section-title">Internal Services</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {data.internal.map((svc) => (
                    <div key={svc.name} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "6px",
                      borderLeft: `3px solid ${statusColors[svc.status]}`,
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "14px" }}>{svc.name}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                          {svc.detail}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <ResponseTimeBadge ms={svc.responseTime} />
                        <span style={{
                          padding: "4px 12px",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          borderRadius: "4px",
                          background: statusBg[svc.status],
                          color: statusColors[svc.status],
                        }}>
                          {svc.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="section-title">External APIs</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {data.external.map((svc) => (
                    <div key={svc.name} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "6px",
                      borderLeft: `3px solid ${statusColors[svc.status]}`,
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "14px" }}>{svc.name}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                          {svc.detail}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <ResponseTimeBadge ms={svc.responseTime} />
                        <span style={{
                          padding: "4px 12px",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          borderRadius: "4px",
                          background: statusBg[svc.status],
                          color: statusColors[svc.status],
                        }}>
                          {svc.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
              {/* Daily API Calls */}
              <div className="section">
                <div className="section-title">API Calls (7 Days)</div>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={data.apiUsage.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                        tickFormatter={(v: string) => v.slice(5)}
                      />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#1a1a2e",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="calls" fill="#FF6B35" radius={[4, 4, 0, 0]} name="Total Calls" />
                      <Bar dataKey="errors" fill="var(--red)" radius={[4, 4, 0, 0]} name="Errors" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Response Time Trend */}
              <div className="section">
                <div className="section-title">Avg Response Time (7 Days)</div>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={data.apiUsage.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                        tickFormatter={(v: string) => v.slice(5)}
                      />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#1a1a2e",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgResponse"
                        stroke="#FF6B35"
                        strokeWidth={2}
                        dot={{ fill: "#FF6B35", r: 3 }}
                        name="Avg Response (ms)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Endpoints Table */}
            <div className="section">
              <div className="section-title">Top Endpoints (24h)</div>
              {data.apiUsage.topEndpoints.length > 0 ? (
                <table className="jobs-table">
                  <thead>
                    <tr>
                      <th>ENDPOINT</th>
                      <th style={{ textAlign: "center" }}>CALLS</th>
                      <th style={{ textAlign: "center" }}>ERRORS</th>
                      <th style={{ textAlign: "center" }}>ERROR RATE</th>
                      <th style={{ textAlign: "center" }}>AVG RESPONSE</th>
                      <th style={{ textAlign: "center" }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.apiUsage.topEndpoints.map((ep) => {
                      const epErrorRate = ep.calls > 0 ? (ep.errors / ep.calls) * 100 : 0;
                      const epStatus = epErrorRate > 10 ? "down" : epErrorRate > 5 ? "degraded" : "healthy";
                      return (
                        <tr key={ep.endpoint}>
                          <td>
                            <span style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "13px" }}>
                              {ep.endpoint}
                            </span>
                          </td>
                          <td style={{ textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                            {ep.calls.toLocaleString()}
                          </td>
                          <td style={{
                            textAlign: "center",
                            fontFamily: "var(--font-roboto-mono), monospace",
                            color: ep.errors > 0 ? "var(--red)" : "rgba(255,255,255,0.5)",
                          }}>
                            {ep.errors}
                          </td>
                          <td style={{
                            textAlign: "center",
                            fontFamily: "var(--font-roboto-mono), monospace",
                            color: epErrorRate > 5 ? "var(--red)" : epErrorRate > 2 ? "var(--yellow)" : "var(--green)",
                          }}>
                            {epErrorRate.toFixed(1)}%
                          </td>
                          <td style={{
                            textAlign: "center",
                            fontFamily: "var(--font-roboto-mono), monospace",
                            color: ep.avgResponse > 500 ? "var(--red)" : ep.avgResponse > 200 ? "var(--yellow)" : "var(--green)",
                          }}>
                            {ep.avgResponse}ms
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span style={{
                              padding: "3px 10px",
                              fontSize: "10px",
                              fontWeight: 700,
                              letterSpacing: "0.5px",
                              borderRadius: "4px",
                              background: statusBg[epStatus],
                              color: statusColors[epStatus],
                            }}>
                              {epStatus.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "30px" }}>
                  No API calls logged in the last 24 hours.
                </p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
