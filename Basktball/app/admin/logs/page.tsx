"use client";

import { useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  source: string;
  metadata?: Record<string, string>;
}

interface LogsData {
  success: boolean;
  logs: LogEntry[];
  stats: {
    total: number;
    info: number;
    warn: number;
    error: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LogsPage() {
  const [filter, setFilter] = useState<"all" | "INFO" | "WARN" | "ERROR">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useSWR<LogsData>(
    "/api/admin/logs",
    fetcher,
    { refreshInterval: 10000 }
  );

  const logs = data?.logs || [];
  const stats = data?.stats || { total: 0, info: 0, warn: 0, error: 0 };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "all" || log.level === filter;
    const matchesSearch = searchTerm === "" ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLevelClass = (level: string) => {
    switch (level) {
      case "INFO": return "text-[var(--blue)] bg-[var(--blue)]/10";
      case "WARN": return "text-[var(--yellow)] bg-[var(--yellow)]/10";
      case "ERROR": return "text-[var(--red)] bg-[var(--red)]/10";
      case "DEBUG": return "text-white/40 bg-white/5";
      default: return "text-white/40 bg-white/5";
    }
  };

  const handleExport = () => {
    const logText = filteredLogs
      .map((log) => `[${log.timestamp}] [${log.level}] [${log.source}] ${log.message}`)
      .join("\n");
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Default logs for demo
  const defaultLogs: LogEntry[] = [
    { id: "1", timestamp: new Date().toISOString(), level: "INFO", message: "Server started successfully", source: "system" },
    { id: "2", timestamp: new Date(Date.now() - 60000).toISOString(), level: "INFO", message: "Database connection established", source: "database" },
    { id: "3", timestamp: new Date(Date.now() - 120000).toISOString(), level: "WARN", message: "API rate limit approaching threshold", source: "nba-api" },
    { id: "4", timestamp: new Date(Date.now() - 180000).toISOString(), level: "INFO", message: "Cache cleared successfully", source: "redis" },
    { id: "5", timestamp: new Date(Date.now() - 240000).toISOString(), level: "ERROR", message: "Failed to fetch EuroLeague data - timeout", source: "euroleague-api" },
    { id: "6", timestamp: new Date(Date.now() - 300000).toISOString(), level: "INFO", message: "AI insight generation completed", source: "deepseek" },
    { id: "7", timestamp: new Date(Date.now() - 360000).toISOString(), level: "WARN", message: "High memory usage detected (85%)", source: "system" },
    { id: "8", timestamp: new Date(Date.now() - 420000).toISOString(), level: "INFO", message: "Scheduled job 'sync-nba' completed", source: "scheduler" },
  ];

  const displayLogs = logs.length > 0 ? filteredLogs : defaultLogs;

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card p-4 animate-pulse">
              <div className="h-8 w-16 bg-white/10 rounded mb-2" />
              <div className="h-4 w-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>

        {/* Logs Skeleton */}
        <div className="section">
          <div className="section-header">
            <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="p-4 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
          SYSTEM LOGS
        </h1>
        <button onClick={handleExport} className="btn btn-secondary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="stat-card p-4">
          <p className="stat-value text-2xl">{stats.total || displayLogs.length}</p>
          <p className="stat-label">Total Logs</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl text-[var(--blue)]">{stats.info || displayLogs.filter(l => l.level === "INFO").length}</p>
          <p className="stat-label">Info</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl text-[var(--yellow)]">{stats.warn || displayLogs.filter(l => l.level === "WARN").length}</p>
          <p className="stat-label">Warnings</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl text-[var(--red)]">{stats.error || displayLogs.filter(l => l.level === "ERROR").length}</p>
          <p className="stat-label">Errors</p>
        </div>
      </div>

      {/* Logs Section */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Log Entries</h2>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[var(--darker-gray)] border border-white/10 text-white text-sm pl-10 pr-4 py-2 rounded focus:border-[var(--orange)] outline-none w-64"
              />
            </div>
            {/* Filter */}
            <div className="flex gap-1">
              {(["all", "INFO", "WARN", "ERROR"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded transition-colors",
                    filter === level
                      ? "bg-[var(--orange)] text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  {level === "all" ? "All" : level}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="activity-log max-h-[600px]">
          {displayLogs.length === 0 ? (
            <div className="p-8 text-center text-white/30">
              No logs found
            </div>
          ) : (
            displayLogs.map((log) => (
              <div key={log.id} className="activity-item group">
                <span className={cn("px-2 py-0.5 text-xs font-medium rounded", getLevelClass(log.level))}>
                  {log.level}
                </span>
                <span className="activity-time font-[family-name:var(--font-roboto-mono)]">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
                <span className="activity-user">
                  [{log.source}]
                </span>
                <span className="flex-1 text-white text-sm">
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
