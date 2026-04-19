"use client";

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
interface OverviewData {
  seoScore: number;
  geoScore: number;
  pagesAnalyzed: number;
  issues: { critical: number; warning: number; info: number };
  seoRadar: Array<{ axis: string; value: number }>;
  geoRadar: Array<{ axis: string; value: number }>;
  trendData: Array<{ date: string; seoScore: number; geoScore: number; responseTime: number }>;
  quickStats: {
    avgResponseTime: number;
    errorRate: number;
    totalArticles: number;
    publishedArticles: number;
    totalPlayers: number;
    totalTeams: number;
    totalInsights: number;
  };
}

interface Recommendation {
  id: string;
  severity: "critical" | "warning" | "info";
  category: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  fix: string;
}

interface RecommendationsData {
  recommendations: Recommendation[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    categories: Array<{ category: string; count: number }>;
  };
}

function getScoreColor(score: number) {
  if (score >= 70) return "var(--green)";
  if (score >= 40) return "var(--yellow)";
  return "var(--red)";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  if (score >= 20) return "Poor";
  return "Critical";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function OverviewTab({ data, recsData, aeoCroData }: { data: OverviewData; recsData: RecommendationsData | null; aeoCroData?: Record<string, any> | null }) {
  const totalIssues = data.issues.critical + data.issues.warning + data.issues.info;
  const quickWins = recsData?.recommendations
    .filter((r) => r.impact === "high")
    .slice(0, 5) || [];

  return (
    <>
      {/* Score Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="value" style={{ color: getScoreColor(data.seoScore) }}>
            {data.seoScore}<span style={{ fontSize: "16px", opacity: 0.6 }}>/100</span>
          </div>
          <div className="label">SEO Score</div>
          <div style={{ fontSize: "11px", color: getScoreColor(data.seoScore), marginTop: "4px" }}>
            {getScoreLabel(data.seoScore)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="value" style={{ color: getScoreColor(data.geoScore) }}>
            {data.geoScore}<span style={{ fontSize: "16px", opacity: 0.6 }}>/100</span>
          </div>
          <div className="label">GEO Score</div>
          <div style={{ fontSize: "11px", color: getScoreColor(data.geoScore), marginTop: "4px" }}>
            {getScoreLabel(data.geoScore)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="value">{data.pagesAnalyzed}</div>
          <div className="label">Pages Analyzed</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="value">{totalIssues}</div>
          <div className="label">Issues Found</div>
          <div style={{ display: "flex", gap: "8px", marginTop: "6px", justifyContent: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--red)" }}>{data.issues.critical} critical</span>
            <span style={{ fontSize: "11px", color: "var(--yellow)" }}>{data.issues.warning} warning</span>
            <span style={{ fontSize: "11px", color: "var(--blue, #4A90D9)" }}>{data.issues.info} info</span>
          </div>
        </div>
      </div>

      {/* AEO & CRO Score Cards */}
      {aeoCroData && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M20 12a8 8 0 0 0-8-8v8h8z" />
              </svg>
            </div>
            <div className="value" style={{ color: getScoreColor(aeoCroData.aeoScore) }}>
              {aeoCroData.aeoScore}<span style={{ fontSize: "16px", opacity: 0.6 }}>/100</span>
            </div>
            <div className="label">AEO Score</div>
            <div style={{ fontSize: "11px", color: getScoreColor(aeoCroData.aeoScore), marginTop: "4px" }}>
              {getScoreLabel(aeoCroData.aeoScore)}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="value" style={{ color: getScoreColor(aeoCroData.croScore) }}>
              {aeoCroData.croScore}<span style={{ fontSize: "16px", opacity: 0.6 }}>/100</span>
            </div>
            <div className="label">CRO Score</div>
            <div style={{ fontSize: "11px", color: getScoreColor(aeoCroData.croScore), marginTop: "4px" }}>
              {getScoreLabel(aeoCroData.croScore)}
            </div>
          </div>
        </div>
      )}

      {/* Radar Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        <div className="section">
          <div className="section-title">SEO Health Breakdown</div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <RadarChart data={data.seoRadar}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--text-faint)", fontSize: 10 }} />
                <Radar name="SEO" dataKey="value" stroke="#FF6B35" fill="#FF6B35" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="section">
          <div className="section-title">GEO Readiness Breakdown</div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <RadarChart data={data.geoRadar}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--text-faint)", fontSize: 10 }} />
                <Radar name="GEO" dataKey="value" stroke="#4A90D9" fill="#4A90D9" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trend Line Chart */}
      <div className="section" style={{ marginBottom: "30px" }}>
        <div className="section-title">Health Score Trend (30 Days)</div>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid var(--border-color)", borderRadius: "8px" }}
                labelStyle={{ color: "var(--text-secondary)" }}
              />
              <Legend />
              <Line type="monotone" dataKey="seoScore" stroke="#FF6B35" strokeWidth={2} name="SEO Score" dot={false} />
              <Line type="monotone" dataKey="geoScore" stroke="#4A90D9" strokeWidth={2} name="GEO Score" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="section">
          <div className="section-title">Quick Wins (High Impact)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {quickWins.map((rec) => (
              <div key={rec.id} className={`seo-rec-card seo-rec-${rec.severity}`}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span className={`seo-severity-badge seo-severity-${rec.severity}`}>
                    {rec.severity.toUpperCase()}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{rec.category}</span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>{rec.title}</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{rec.fix}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
