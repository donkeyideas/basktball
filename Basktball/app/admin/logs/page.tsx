"use client";

import { useState, useEffect, useCallback } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  source?: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<"all" | "info" | "warn" | "error">("all");

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulated logs from API activity
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();

      if (data.success && data.recentActivity) {
        const simulatedLogs: LogEntry[] = data.recentActivity.map((activity: { id: string; time: string; message: string; type: string }, index: number) => ({
          id: `log-${index}`,
          timestamp: new Date().toISOString(),
          level: activity.type === "job" ? "info" : "info",
          message: activity.message,
          source: activity.type,
        }));
        setLogs(simulatedLogs);
      }
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    if (levelFilter === "all") return true;
    return log.level === levelFilter;
  });

  const getLevelClass = (level: string) => {
    switch (level) {
      case "info": return "info";
      case "warn": return "warn";
      case "error": return "error";
      default: return "info";
    }
  };

  return (
    <>
      <div className="admin-header">
        <h1>SYSTEM LOGS</h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <button className="btn btn-secondary" onClick={() => {
            const logText = filteredLogs.map(log =>
              `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
            ).join("\n");
            const blob = new Blob([logText], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `logs-${new Date().toISOString().split("T")[0]}.txt`;
            a.click();
          }}>
            Export Logs
          </button>
          <button className="btn btn-primary" onClick={fetchLogs}>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Level Filter */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
          {[
            { id: "all" as const, label: "All Levels" },
            { id: "info" as const, label: "Info" },
            { id: "warn" as const, label: "Warnings" },
            { id: "error" as const, label: "Errors" },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setLevelFilter(filter.id)}
              style={{
                padding: "10px 20px",
                background: levelFilter === filter.id ? "var(--orange)" : "var(--dark-gray)",
                border: "2px solid",
                borderColor: levelFilter === filter.id ? "var(--orange)" : "rgba(255,255,255,0.1)",
                color: "var(--white)",
                cursor: "pointer"
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="section">
          <div className="section-title">
            Log Entries ({filteredLogs.length})
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>No logs available.</p>
            </div>
          ) : (
            <div className="logs-container">
              {filteredLogs.map(log => (
                <div key={log.id} className="log-entry">
                  <span className="log-time">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className={`log-level ${getLevelClass(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
