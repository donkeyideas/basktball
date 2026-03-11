"use client";

import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
interface PageAudit {
  id: string;
  path: string;
  title: string;
  hasMetaTitle: boolean;
  hasMetaDesc: boolean;
  hasKeywords: boolean;
  seoScore: number;
  geoScore: number;
  metaDescLength: number;
  titleLength: number;
  wordCount: number;
  keywords: string[];
  viewCount: number;
  lastUpdated: string;
  issues: string[];
}

interface AnalysisData {
  pages: PageAudit[];
  topKeywords: Array<{ keyword: string; count: number }>;
  missingKeywords: string[];
  summary: { totalPages: number; avgSeoScore: number; avgGeoScore: number; pagesWithIssues: number };
}

function getScoreColor(score: number) {
  if (score >= 70) return "var(--green)";
  if (score >= 40) return "var(--yellow)";
  return "var(--red)";
}

const FRESHNESS_COLORS = ["#4CAF50", "#FF9800", "#f44336"];

export default function ContentTab({ data }: { data: AnalysisData }) {
  // Filter to article pages only (have word counts)
  const articles = data.pages.filter((p) => p.wordCount > 0);

  // Freshness analysis
  const now = Date.now();
  const fresh = articles.filter((a) => now - new Date(a.lastUpdated).getTime() < 7 * 86400000).length;
  const aging = articles.filter((a) => {
    const age = now - new Date(a.lastUpdated).getTime();
    return age >= 7 * 86400000 && age < 30 * 86400000;
  }).length;
  const stale = articles.filter((a) => now - new Date(a.lastUpdated).getTime() >= 30 * 86400000).length;

  const freshnessData = [
    { name: "Fresh (< 7 days)", value: fresh },
    { name: "Aging (7-30 days)", value: aging },
    { name: "Stale (30+ days)", value: stale },
  ].filter((d) => d.value > 0);

  // Content quality scoring
  const qualitySorted = [...articles].sort((a, b) => {
    const aScore = (a.wordCount > 300 ? 25 : 0) + (a.hasMetaDesc ? 25 : 0) + (a.hasKeywords ? 25 : 0) + (a.hasMetaTitle ? 25 : 0);
    const bScore = (b.wordCount > 300 ? 25 : 0) + (b.hasMetaDesc ? 25 : 0) + (b.hasKeywords ? 25 : 0) + (b.hasMetaTitle ? 25 : 0);
    return aScore - bScore;
  });

  // Keyword density chart
  const keywordData = data.topKeywords.slice(0, 15);

  // Average word count
  const avgWordCount = articles.length > 0
    ? Math.round(articles.reduce((s, a) => s + a.wordCount, 0) / articles.length)
    : 0;

  // Meta description quality
  const goodMetaDesc = articles.filter((a) => a.metaDescLength >= 120 && a.metaDescLength <= 160).length;
  const shortMetaDesc = articles.filter((a) => a.metaDescLength > 0 && a.metaDescLength < 120).length;
  const longMetaDesc = articles.filter((a) => a.metaDescLength > 160).length;
  const noMetaDesc = articles.filter((a) => a.metaDescLength === 0).length;

  return (
    <>
      {/* Content Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div className="stat-card">
          <div className="value">{articles.length}</div>
          <div className="label">Total Articles</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: avgWordCount >= 300 ? "var(--green)" : "var(--yellow)" }}>
            {avgWordCount}
          </div>
          <div className="label">Avg Word Count</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: fresh >= articles.length * 0.5 ? "var(--green)" : "var(--yellow)" }}>
            {fresh}
          </div>
          <div className="label">Fresh Articles (7d)</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: stale > 0 ? "var(--red)" : "var(--green)" }}>
            {stale}
          </div>
          <div className="label">Stale Articles (30d+)</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        {/* Content Freshness */}
        <div className="section">
          <div className="section-title">Content Freshness</div>
          {freshnessData.length > 0 ? (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={freshnessData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                  >
                    {freshnessData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={FRESHNESS_COLORS[index % FRESHNESS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "40px 0" }}>No articles to analyze</p>
          )}
        </div>

        {/* Keyword Density */}
        <div className="section">
          <div className="section-title">Keyword Frequency</div>
          {keywordData.length > 0 ? (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={keywordData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                  <YAxis dataKey="keyword" type="category" width={120} tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Bar dataKey="count" fill="#4A90D9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "40px 0" }}>
              No keyword data. Add keywords to articles.
            </p>
          )}
        </div>
      </div>

      {/* Meta Description Quality */}
      <div className="section" style={{ marginBottom: "30px" }}>
        <div className="section-title">Meta Description Quality</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
          <div style={{ background: "rgba(76,175,80,0.1)", padding: "16px", textAlign: "center", borderRadius: "6px" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-roboto-mono), monospace", color: "var(--green)" }}>{goodMetaDesc}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>Good (120-160 chars)</div>
          </div>
          <div style={{ background: "rgba(255,152,0,0.1)", padding: "16px", textAlign: "center", borderRadius: "6px" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-roboto-mono), monospace", color: "var(--yellow)" }}>{shortMetaDesc}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>Short (&lt; 120 chars)</div>
          </div>
          <div style={{ background: "rgba(255,152,0,0.1)", padding: "16px", textAlign: "center", borderRadius: "6px" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-roboto-mono), monospace", color: "var(--yellow)" }}>{longMetaDesc}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>Long (&gt; 160 chars)</div>
          </div>
          <div style={{ background: "rgba(244,67,54,0.1)", padding: "16px", textAlign: "center", borderRadius: "6px" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-roboto-mono), monospace", color: "var(--red)" }}>{noMetaDesc}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>Missing</div>
          </div>
        </div>
      </div>

      {/* Content Quality Table */}
      <div className="section">
        <div className="section-title">Content Quality Audit</div>
        <table className="jobs-table">
          <thead>
            <tr>
              <th>ARTICLE</th>
              <th>WORDS</th>
              <th>META DESC</th>
              <th>KEYWORDS</th>
              <th>VIEWS</th>
              <th>UPDATED</th>
              <th>QUALITY</th>
            </tr>
          </thead>
          <tbody>
            {qualitySorted.map((page) => {
              const qualityScore =
                (page.wordCount > 300 ? 25 : 0) +
                (page.hasMetaDesc ? 25 : 0) +
                (page.hasKeywords ? 25 : 0) +
                (page.hasMetaTitle ? 25 : 0);

              const daysSinceUpdate = Math.floor((now - new Date(page.lastUpdated).getTime()) / 86400000);

              return (
                <tr key={page.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>{page.title}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{page.path}</div>
                  </td>
                  <td style={{
                    fontFamily: "var(--font-roboto-mono), monospace",
                    color: page.wordCount >= 300 ? "var(--green)" : page.wordCount >= 100 ? "var(--yellow)" : "var(--red)",
                  }}>
                    {page.wordCount}
                  </td>
                  <td style={{
                    fontFamily: "var(--font-roboto-mono), monospace",
                    color: page.metaDescLength >= 120 && page.metaDescLength <= 160
                      ? "var(--green)"
                      : page.metaDescLength > 0
                        ? "var(--yellow)"
                        : "var(--red)",
                  }}>
                    {page.metaDescLength > 0 ? `${page.metaDescLength}c` : "None"}
                  </td>
                  <td style={{
                    fontFamily: "var(--font-roboto-mono), monospace",
                    color: page.keywords.length > 0 ? "var(--green)" : "var(--red)",
                  }}>
                    {page.keywords.length}
                  </td>
                  <td style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.viewCount.toLocaleString()}
                  </td>
                  <td style={{
                    fontSize: "12px",
                    color: daysSinceUpdate <= 7 ? "var(--green)" : daysSinceUpdate <= 30 ? "var(--yellow)" : "var(--red)",
                  }}>
                    {daysSinceUpdate === 0 ? "Today" : `${daysSinceUpdate}d ago`}
                  </td>
                  <td>
                    <span style={{
                      fontFamily: "var(--font-roboto-mono), monospace",
                      fontWeight: 700,
                      color: getScoreColor(qualityScore),
                    }}>
                      {qualityScore}
                    </span>
                  </td>
                </tr>
              );
            })}
            {articles.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                  No articles to analyze. Publish articles to see content quality scores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
