"use client";

import { useState, useEffect } from "react";

interface AnalyticsData {
  stats: {
    pageViews30d: number;
    uniqueVisitors30d: number;
    revenue30d: number;
    rpm: number;
  };
  topPages: Array<{
    page: string;
    views: number;
    avgTime: string;
    bounceRate: string;
  }>;
  trafficSources: Array<{
    source: string;
    percentage: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (json.success) {
        setData(json);
        setError(null);
      } else {
        setError(json.error || "Failed to load analytics");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const stats = [
    {
      label: "Page Views (30d)",
      value: data?.stats.pageViews30d?.toLocaleString() || "0",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      label: "Unique Visitors (30d)",
      value: data?.stats.uniqueVisitors30d?.toLocaleString() || "0",
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
      label: "Revenue (30d)",
      value: `$${data?.stats.revenue30d?.toFixed(2) || "0.00"}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "RPM",
      value: `$${data?.stats.rpm?.toFixed(2) || "0.00"}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="admin-header">
        <h1>ANALYTICS</h1>
        <button className="btn btn-primary" onClick={fetchAnalytics}>
          Refresh
        </button>
      </div>

      <div className="admin-content">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading analytics...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              marginBottom: "40px"
            }}>
              {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="value">{stat.value}</div>
                  <div className="label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Two Column Layout */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
              {/* Top Pages */}
              <div className="section">
                <div className="section-title">Top Pages</div>
                <table className="jobs-table">
                  <thead>
                    <tr>
                      <th>PAGE</th>
                      <th>VIEWS</th>
                      <th>AVG TIME</th>
                      <th>BOUNCE RATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.topPages || []).map((page, index) => (
                      <tr key={index}>
                        <td>{page.page}</td>
                        <td style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {page.views.toLocaleString()}
                        </td>
                        <td>{page.avgTime}</td>
                        <td>{page.bounceRate}</td>
                      </tr>
                    ))}
                    {(!data?.topPages || data.topPages.length === 0) && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                          No page data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Traffic Sources */}
              <div className="section">
                <div className="section-title">Traffic Sources</div>
                {(data?.trafficSources || []).map((source, index) => (
                  <div key={index} style={{ marginBottom: "20px" }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "5px"
                    }}>
                      <span>{source.source}</span>
                      <span style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {source.percentage}%
                      </span>
                    </div>
                    <div style={{
                      height: "8px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "4px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${source.percentage}%`,
                        background: "var(--orange)"
                      }} />
                    </div>
                  </div>
                ))}
                {(!data?.trafficSources || data.trafficSources.length === 0) && (
                  <p style={{ color: "rgba(255,255,255,0.5)" }}>No traffic data available</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
