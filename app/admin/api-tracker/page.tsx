"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface TrackerCall {
  id: string;
  provider: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  tokensUsed: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  estimatedCost: number;
  cached: boolean;
  callerRoute: string | null;
  error: string | null;
  createdAt: string;
}

interface Stats {
  totalCalls: number;
  totalCost: number;
  cacheHitRate: number;
  avgResponseTime: number;
  errorCount: number;
  errorRate: number;
  activeProviders: number;
}

interface ProviderData {
  name: string;
  count: number;
}

interface DailyData {
  date: string;
  calls: number;
  errors: number;
}

const PROVIDER_COLORS: Record<string, string> = {
  DEEPSEEK: "#7C3AED",
  ESPN: "#EF4444",
  BDL: "#F59E0B",
  NBA_CDN: "#3B82F6",
};

const PROVIDER_LABELS: Record<string, string> = {
  DEEPSEEK: "DeepSeek AI",
  ESPN: "ESPN",
  BDL: "BallDontLie",
  NBA_CDN: "NBA CDN",
};

const tooltipStyle = {
  backgroundColor: "#1A1A1A",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "13px",
};

const tickStyle = { fill: "rgba(255,255,255,0.5)", fontSize: 12 };

export default function AdminApiTrackerPage() {
  const [calls, setCalls] = useState<TrackerCall[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCalls: 0, totalCost: 0, cacheHitRate: 0,
    avgResponseTime: 0, errorCount: 0, errorRate: 0, activeProviders: 0,
  });
  const [callsByProvider, setCallsByProvider] = useState<ProviderData[]>([]);
  const [dailyVolume, setDailyVolume] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalCount: 0, totalPages: 1 });

  // Filters
  const [providerFilter, setProviderFilter] = useState("");
  const [cachedFilter, setCachedFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
      });
      if (providerFilter) params.set("provider", providerFilter);
      if (cachedFilter) params.set("cached", cachedFilter);
      if (search) params.set("search", search);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/api-tracker?${params}`);
      const data = await res.json();

      if (data.success) {
        setCalls(data.calls);
        setStats(data.stats);
        setCallsByProvider(data.callsByProvider);
        setDailyVolume(data.dailyVolume);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch tracker data:", error);
    } finally {
      setLoading(false);
    }
  }, [page, providerFilter, cachedFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const exportCsv = () => {
    const headers = "Time,Provider,Endpoint,Method,Status,Response(ms),Tokens,Cost,Cached,Source,Error\n";
    const rows = calls.map((c) =>
      `"${new Date(c.createdAt).toISOString()}","${c.provider}","${c.endpoint}","${c.method}",${c.statusCode},${c.responseTime},${c.tokensUsed || ""},${c.estimatedCost.toFixed(6)},${c.cached},"${c.callerRoute || ""}","${(c.error || "").replace(/"/g, '""')}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-tracker-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const statusColor = (code: number) => {
    if (code === 0) return "var(--red)";
    if (code < 300) return "var(--green)";
    if (code < 500) return "var(--yellow)";
    return "var(--red)";
  };

  const responseColor = (ms: number) => {
    if (ms === 0) return "rgba(255,255,255,0.3)";
    if (ms < 300) return "var(--green)";
    if (ms < 1000) return "var(--yellow)";
    return "var(--red)";
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
        Loading API tracker...
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <h1>API TRACKER</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={exportCsv}
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "6px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Export CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setLoading(true); fetchData(); }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* KPI Cards */}
        <div className="stats-grid">
          {[
            { label: "Total Calls (24h)", value: stats.totalCalls.toLocaleString(), icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            )},
            { label: "Total Cost (24h)", value: `$${stats.totalCost.toFixed(4)}`, color: "var(--green)", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            )},
            { label: "Cache Hit Rate", value: `${stats.cacheHitRate}%`, color: stats.cacheHitRate > 50 ? "var(--green)" : "var(--yellow)", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
            )},
            { label: "Avg Response Time", value: `${stats.avgResponseTime}ms`, icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            )},
            { label: "Error Rate (24h)", value: `${stats.errorRate}%`, color: stats.errorRate > 5 ? "var(--red)" : "var(--green)", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )},
            { label: "Active Providers", value: stats.activeProviders.toString(), icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            )},
          ].map((card, i) => (
            <div className="stat-card" key={i}>
              <div className="icon">{card.icon}</div>
              <div className="value" style={card.color ? { color: card.color } : undefined}>
                {card.value}
              </div>
              <div className="label">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
          {/* Daily Call Volume */}
          <div className="section">
            <div className="section-title">Daily Call Volume (14 Days)</div>
            <div style={{ width: "100%", height: 260, marginTop: "20px" }}>
              <ResponsiveContainer>
                <BarChart data={dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="date"
                    tick={tickStyle}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="calls" fill="#FF6B35" radius={[4, 4, 0, 0]} name="Calls" />
                  <Bar dataKey="errors" fill="var(--red)" radius={[4, 4, 0, 0]} name="Errors" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calls by Provider */}
          <div className="section">
            <div className="section-title">Calls by Provider (24h)</div>
            <div style={{ width: "100%", height: 260, marginTop: "20px" }}>
              {callsByProvider.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={callsByProvider} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis type="number" tick={tickStyle} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={tickStyle}
                      width={90}
                      tickFormatter={(v) => PROVIDER_LABELS[v] || v}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [value.toLocaleString(), "Calls"]}
                    />
                    <Bar dataKey="count" name="Calls" radius={[0, 4, 4, 0]}>
                      {callsByProvider.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PROVIDER_COLORS[entry.name] || "#FF6B35"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.3)" }}>
                  No data yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          <select
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
            style={{
              padding: "10px 14px",
              background: "#1A1A1A",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
            }}
          >
            <option value="">All Providers</option>
            <option value="DEEPSEEK">DeepSeek AI</option>
            <option value="ESPN">ESPN</option>
            <option value="BDL">BallDontLie</option>
            <option value="NBA_CDN">NBA CDN</option>
          </select>

          <select
            value={cachedFilter}
            onChange={(e) => { setCachedFilter(e.target.value); setPage(1); }}
            style={{
              padding: "10px 14px",
              background: "#1A1A1A",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
            }}
          >
            <option value="">All Requests</option>
            <option value="true">Cached</option>
            <option value="false">Not Cached</option>
          </select>

          <input
            type="text"
            placeholder="Search endpoint or route..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              flex: "1",
              minWidth: "180px",
              padding: "10px 14px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
            }}
          />

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            style={{
              padding: "10px 14px",
              background: "#1A1A1A",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <span style={{ color: "rgba(255,255,255,0.3)" }}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            style={{
              padding: "10px 14px",
              background: "#1A1A1A",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>

        {/* Data Table */}
        <div className="section">
          <div className="section-title">
            Call History
            <span style={{
              fontWeight: 400,
              fontSize: "13px",
              color: "rgba(255,255,255,0.4)",
              marginLeft: "10px",
              fontFamily: "var(--font-inter)",
            }}>
              {pagination.totalCount.toLocaleString()} total
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="jobs-table" style={{ marginTop: "20px" }}>
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>PROVIDER</th>
                  <th>ENDPOINT</th>
                  <th style={{ textAlign: "center" }}>STATUS</th>
                  <th style={{ textAlign: "center" }}>RESPONSE</th>
                  <th style={{ textAlign: "center" }}>TOKENS</th>
                  <th style={{ textAlign: "center" }}>COST</th>
                  <th style={{ textAlign: "center" }}>CACHED</th>
                  <th>SOURCE</th>
                </tr>
              </thead>
              <tbody>
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)" }}>
                      No API calls tracked yet. Data will appear as the site makes external API requests.
                    </td>
                  </tr>
                ) : (
                  calls.map((call) => (
                    <tr key={call.id}>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "12px", whiteSpace: "nowrap" }}>
                        {formatTime(call.createdAt)}
                      </td>
                      <td>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: "4px",
                          background: `${PROVIDER_COLORS[call.provider] || "#666"}20`,
                          color: PROVIDER_COLORS[call.provider] || "#666",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}>
                          {PROVIDER_LABELS[call.provider] || call.provider}
                        </span>
                      </td>
                      <td style={{
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontSize: "12px",
                        maxWidth: "250px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {call.endpoint}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          color: statusColor(call.statusCode),
                          fontFamily: "var(--font-roboto-mono), monospace",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}>
                          {call.statusCode || "ERR"}
                        </span>
                      </td>
                      <td style={{
                        textAlign: "center",
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontSize: "13px",
                        color: responseColor(call.responseTime),
                      }}>
                        {call.responseTime === 0 ? "-" : `${call.responseTime}ms`}
                      </td>
                      <td style={{
                        textAlign: "center",
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontSize: "13px",
                        color: call.tokensUsed ? "#fff" : "rgba(255,255,255,0.2)",
                      }}>
                        {call.tokensUsed ? call.tokensUsed.toLocaleString() : "-"}
                      </td>
                      <td style={{
                        textAlign: "center",
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontSize: "13px",
                        color: call.estimatedCost > 0 ? "var(--green)" : "rgba(255,255,255,0.2)",
                      }}>
                        {call.estimatedCost > 0 ? `$${call.estimatedCost.toFixed(6)}` : "Free"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {call.cached ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.15)" }}>-</span>
                        )}
                      </td>
                      <td style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.4)",
                        maxWidth: "150px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {call.callerRoute || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              marginTop: "20px",
            }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: "6px 12px",
                  background: page === 1 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  color: page === 1 ? "rgba(255,255,255,0.3)" : "#fff",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  fontSize: "13px",
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                style={{
                  padding: "6px 12px",
                  background: page === pagination.totalPages ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  color: page === pagination.totalPages ? "rgba(255,255,255,0.3)" : "#fff",
                  cursor: page === pagination.totalPages ? "not-allowed" : "pointer",
                  fontSize: "13px",
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
