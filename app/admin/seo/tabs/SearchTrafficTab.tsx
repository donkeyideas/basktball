"use client";

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
interface GSCOverview {
  totalClicks: number;
  totalImpressions: number;
  avgCTR: number;
  avgPosition: number;
  topQueries: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  dailyData: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

interface GA4Overview {
  totalUsers: number;
  totalSessions: number;
  totalPageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: Array<{
    path: string;
    pageViews: number;
    users: number;
    avgDuration: number;
  }>;
  topSources: Array<{
    source: string;
    medium: string;
    users: number;
    sessions: number;
  }>;
  dailyData: Array<{
    date: string;
    users: number;
    sessions: number;
    pageViews: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    users: number;
    percentage: number;
  }>;
}

const DEVICE_COLORS = ["#FF6B35", "#4A90D9", "#4CAF50", "#FFD700"];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export default function SearchTrafficTab({
  gsc,
  ga4,
}: {
  gsc: GSCOverview | null;
  ga4: GA4Overview | null;
}) {
  if (!gsc && !ga4) {
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>
          Google API data not available.
        </p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>
          Ensure GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_GA4_PROPERTY_ID, and GOOGLE_SEARCH_CONSOLE_SITE are configured.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Top-level metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {gsc && (
          <>
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="value" style={{ color: "#FF6B35" }}>
                {gsc.totalClicks.toLocaleString()}
              </div>
              <div className="label">Search Clicks (28d)</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="value" style={{ color: "#4A90D9" }}>
                {gsc.totalImpressions.toLocaleString()}
              </div>
              <div className="label">Impressions (28d)</div>
            </div>
          </>
        )}
        {ga4 && (
          <>
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="value" style={{ color: "#4CAF50" }}>
                {ga4.totalUsers.toLocaleString()}
              </div>
              <div className="label">Users (28d)</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="value" style={{ color: "#FFD700" }}>
                {ga4.totalPageViews.toLocaleString()}
              </div>
              <div className="label">Page Views (28d)</div>
            </div>
          </>
        )}
      </div>

      {/* Secondary metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        {gsc && (
          <>
            <div className="stat-card">
              <div className="value" style={{ fontSize: "20px" }}>
                {(gsc.avgCTR * 100).toFixed(1)}%
              </div>
              <div className="label">Avg CTR</div>
            </div>
            <div className="stat-card">
              <div className="value" style={{ fontSize: "20px" }}>
                {gsc.avgPosition.toFixed(1)}
              </div>
              <div className="label">Avg Position</div>
            </div>
          </>
        )}
        {ga4 && (
          <>
            <div className="stat-card">
              <div className="value" style={{ fontSize: "20px" }}>
                {formatDuration(ga4.avgSessionDuration)}
              </div>
              <div className="label">Avg Session Duration</div>
            </div>
            <div className="stat-card">
              <div className="value" style={{ fontSize: "20px", color: ga4.bounceRate > 70 ? "var(--red)" : ga4.bounceRate > 50 ? "var(--yellow)" : "var(--green)" }}>
                {ga4.bounceRate.toFixed(1)}%
              </div>
              <div className="label">Bounce Rate</div>
            </div>
          </>
        )}
      </div>

      {/* Charts Row 1: GSC clicks/impressions + GA4 users/sessions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        {gsc && gsc.dailyData.length > 0 && (
          <div className="section">
            <div className="section-title">Search Performance (28 Days)</div>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={gsc.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis yAxisId="left" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#FF6B35" strokeWidth={2} name="Clicks" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#4A90D9" strokeWidth={2} name="Impressions" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {ga4 && ga4.dailyData.length > 0 && (
          <div className="section">
            <div className="section-title">Site Traffic (28 Days)</div>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={ga4.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#4CAF50" strokeWidth={2} name="Users" dot={false} />
                  <Line type="monotone" dataKey="sessions" stroke="#FFD700" strokeWidth={2} name="Sessions" dot={false} />
                  <Line type="monotone" dataKey="pageViews" stroke="#FF6B35" strokeWidth={2} name="Page Views" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row 2: Top Queries + Traffic Sources */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        {gsc && gsc.topQueries.length > 0 && (
          <div className="section">
            <div className="section-title">Top Search Queries</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Query</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Clicks</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Impr.</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>CTR</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Pos.</th>
                  </tr>
                </thead>
                <tbody>
                  {gsc.topQueries.slice(0, 15).map((q, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px 12px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.keys[0]}
                      </td>
                      <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "var(--font-roboto-mono), monospace" }}>{q.clicks}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "var(--font-roboto-mono), monospace" }}>{q.impressions}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "var(--font-roboto-mono), monospace" }}>{(q.ctr * 100).toFixed(1)}%</td>
                      <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "var(--font-roboto-mono), monospace" }}>{q.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {ga4 && ga4.topSources.length > 0 && (
          <div className="section">
            <div className="section-title">Traffic Sources</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Source</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Medium</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Users</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {ga4.topSources.slice(0, 15).map((s, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px 12px" }}>{s.source}</td>
                      <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.6)" }}>{s.medium}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "var(--font-roboto-mono), monospace" }}>{s.users}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "var(--font-roboto-mono), monospace" }}>{s.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row 3: Top Pages (GSC) + Top Pages (GA4) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        {gsc && gsc.topPages.length > 0 && (
          <div className="section">
            <div className="section-title">Top Pages (Search Console)</div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={gsc.topPages.slice(0, 10).map((p) => ({
                    page: p.keys[0].replace(/^https?:\/\/[^/]+/, "") || "/",
                    clicks: p.clicks,
                    impressions: p.impressions,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                  <YAxis dataKey="page" type="category" width={150} tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Legend />
                  <Bar dataKey="clicks" fill="#FF6B35" radius={[0, 4, 4, 0]} name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {ga4 && ga4.deviceBreakdown.length > 0 && (
          <div className="section">
            <div className="section-title">Device Breakdown</div>
            <div style={{ width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={ga4.deviceBreakdown}
                    dataKey="users"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ device, percentage }: { device: string; percentage: number }) => `${device} ${percentage}%`}
                  >
                    {ga4.deviceBreakdown.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Top Pages from GA4 */}
      {ga4 && ga4.topPages.length > 0 && (
        <div className="section">
          <div className="section-title">Top Pages by Traffic (Google Analytics)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Page</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Views</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Users</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {ga4.topPages.slice(0, 20).map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "8px 12px", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.path}
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "var(--font-roboto-mono), monospace" }}>{p.pageViews}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "var(--font-roboto-mono), monospace" }}>{p.users}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px", fontFamily: "var(--font-roboto-mono), monospace" }}>{formatDuration(p.avgDuration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
