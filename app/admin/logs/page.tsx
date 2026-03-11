"use client";

import { useState, useEffect, useCallback } from "react";

interface LogEntry {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  error: string | null;
  timestamp: string;
  level: "info" | "warn" | "error";
}

interface LogsData {
  logs: LogEntry[];
  pagination: { page: number; limit: number; totalCount: number; totalPages: number };
  summary: { total24h: number; info24h: number; warn24h: number; error24h: number };
  endpoints: Array<{ endpoint: string; count: number }>;
}

const levelColors: Record<string, string> = {
  info: "var(--green)",
  warn: "var(--yellow)",
  error: "var(--red)",
};

const levelBg: Record<string, string> = {
  info: "rgba(16, 185, 129, 0.15)",
  warn: "rgba(245, 158, 11, 0.15)",
  error: "rgba(239, 68, 68, 0.15)",
};

const statusColor = (code: number) =>
  code >= 500 ? "var(--red)" : code >= 400 ? "var(--yellow)" : "var(--green)";

export default function AdminLogsPage() {
  const [data, setData] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<"all" | "info" | "warn" | "error">("all");
  const [endpointFilter, setEndpointFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (levelFilter !== "all") params.set("level", levelFilter);
      if (endpointFilter) params.set("endpoint", endpointFilter);

      const res = await fetch(`/api/admin/logs?${params}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, levelFilter, endpointFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [levelFilter, endpointFilter]);

  const handleExport = () => {
    if (!data) return;
    const lines = data.logs.map(
      (l) =>
        `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] ${l.method} ${l.endpoint} → ${l.statusCode} (${l.responseTime}ms)${l.error ? ` ERROR: ${l.error}` : ""}`
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-logs-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="admin-header">
        <h1>API LOGS</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn" onClick={handleExport} style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.8)",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
          }}>
            Export .txt
          </button>
          <button className="btn btn-primary" onClick={fetchLogs}>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Summary Cards */}
        {data && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "25px" }}>
            <div className="stat-card" style={{
              cursor: "pointer",
              outline: levelFilter === "all" ? "2px solid var(--orange)" : "none",
            }} onClick={() => setLevelFilter("all")}>
              <div className="value">{data.summary.total24h.toLocaleString()}</div>
              <div className="label">Total (24h)</div>
            </div>
            <div className="stat-card" style={{
              cursor: "pointer",
              outline: levelFilter === "info" ? "2px solid var(--green)" : "none",
            }} onClick={() => setLevelFilter(levelFilter === "info" ? "all" : "info")}>
              <div className="value" style={{ color: "var(--green)" }}>{data.summary.info24h.toLocaleString()}</div>
              <div className="label">Success (24h)</div>
            </div>
            <div className="stat-card" style={{
              cursor: "pointer",
              outline: levelFilter === "warn" ? "2px solid var(--yellow)" : "none",
            }} onClick={() => setLevelFilter(levelFilter === "warn" ? "all" : "warn")}>
              <div className="value" style={{ color: "var(--yellow)" }}>{data.summary.warn24h}</div>
              <div className="label">4xx Warnings (24h)</div>
            </div>
            <div className="stat-card" style={{
              cursor: "pointer",
              outline: levelFilter === "error" ? "2px solid var(--red)" : "none",
            }} onClick={() => setLevelFilter(levelFilter === "error" ? "all" : "error")}>
              <div className="value" style={{ color: "var(--red)" }}>{data.summary.error24h}</div>
              <div className="label">5xx Errors (24h)</div>
            </div>
          </div>
        )}

        {/* Endpoint Filter */}
        {data && data.endpoints.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
            <button
              onClick={() => setEndpointFilter("")}
              style={{
                padding: "5px 14px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: !endpointFilter ? "var(--orange)" : "rgba(255,255,255,0.15)",
                background: !endpointFilter ? "rgba(255, 107, 53, 0.15)" : "transparent",
                color: !endpointFilter ? "var(--orange)" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              All Endpoints
            </button>
            {data.endpoints.slice(0, 12).map((ep) => (
              <button
                key={ep.endpoint}
                onClick={() => setEndpointFilter(endpointFilter === ep.endpoint ? "" : ep.endpoint)}
                style={{
                  padding: "5px 14px",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: endpointFilter === ep.endpoint ? "var(--orange)" : "rgba(255,255,255,0.15)",
                  background: endpointFilter === ep.endpoint ? "rgba(255, 107, 53, 0.15)" : "transparent",
                  color: endpointFilter === ep.endpoint ? "var(--orange)" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "var(--font-roboto-mono), monospace",
                }}
              >
                {ep.endpoint} ({ep.count})
              </button>
            ))}
          </div>
        )}

        {/* Logs Table */}
        <div className="section">
          <div className="section-title">
            Log Entries
            {data && (
              <span style={{ fontWeight: 400, fontSize: "13px", color: "rgba(255,255,255,0.4)", marginLeft: "10px" }}>
                {data.pagination.totalCount.toLocaleString()} total
              </span>
            )}
          </div>

          {loading && !data ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading logs...</p>
            </div>
          ) : data && data.logs.length > 0 ? (
            <>
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>LEVEL</th>
                    <th>METHOD</th>
                    <th>ENDPOINT</th>
                    <th style={{ textAlign: "center" }}>STATUS</th>
                    <th style={{ textAlign: "center" }}>RESPONSE</th>
                    <th>ERROR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: "3px 8px",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          borderRadius: "4px",
                          background: levelBg[log.level],
                          color: levelColors[log.level],
                        }}>
                          {log.level.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "12px", fontWeight: 600 }}>
                          {log.method}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "12px" }}>
                          {log.endpoint}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          fontFamily: "var(--font-roboto-mono), monospace",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: statusColor(log.statusCode),
                        }}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          fontFamily: "var(--font-roboto-mono), monospace",
                          fontSize: "12px",
                          color: log.responseTime > 500 ? "var(--red)" : log.responseTime > 200 ? "var(--yellow)" : "var(--green)",
                        }}>
                          {log.responseTime}ms
                        </span>
                      </td>
                      <td>
                        {log.error ? (
                          <span style={{ fontSize: "12px", color: "var(--red)" }}>
                            {log.error.length > 60 ? log.error.slice(0, 57) + "..." : log.error}
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "20px",
                  padding: "15px 0",
                }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    style={{
                      padding: "6px 14px",
                      background: page <= 1 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: page <= 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                      borderRadius: "4px",
                      cursor: page <= 1 ? "default" : "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Previous
                  </button>
                  <span style={{
                    fontFamily: "var(--font-roboto-mono), monospace",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.5)",
                  }}>
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page >= data.pagination.totalPages}
                    style={{
                      padding: "6px 14px",
                      background: page >= data.pagination.totalPages ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: page >= data.pagination.totalPages ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                      borderRadius: "4px",
                      cursor: page >= data.pagination.totalPages ? "default" : "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>No logs match the current filters.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
