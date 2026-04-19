"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useState } from "react";
interface PageAudit {
  id: string;
  path: string;
  title: string;
  hasMetaTitle: boolean;
  hasMetaDesc: boolean;
  hasKeywords: boolean;
  hasOgTags: boolean;
  indexStatus: string;
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
  targetKeywords: Array<{ keyword: string; covered: boolean }>;
  missingKeywords: string[];
  metaCompleteness: { complete: number; partial: number; missing: number; staticMissing: number };
  summary: { totalPages: number; avgSeoScore: number; avgGeoScore: number; pagesWithIssues: number };
}

function getScoreColor(score: number) {
  if (score >= 70) return "var(--green)";
  if (score >= 40) return "var(--yellow)";
  return "var(--red)";
}

const PIE_COLORS = ["#4CAF50", "#FF9800", "#f44336", "#666"];

export default function SeoAnalysisTab({ data }: { data: AnalysisData }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"seoScore" | "path">("seoScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedPages = [...data.pages].sort((a, b) => {
    const aVal = sortBy === "seoScore" ? a.seoScore : a.path;
    const bVal = sortBy === "seoScore" ? b.seoScore : b.path;
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const handleSort = (col: "seoScore" | "path") => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir(col === "seoScore" ? "asc" : "asc");
    }
  };

  const pieData = [
    { name: "Complete", value: data.metaCompleteness.complete },
    { name: "Partial", value: data.metaCompleteness.partial },
    { name: "Missing", value: data.metaCompleteness.missing },
    { name: "Static (No Meta)", value: data.metaCompleteness.staticMissing },
  ].filter((d) => d.value > 0);

  return (
    <>
      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div className="stat-card">
          <div className="value">{data.summary.totalPages}</div>
          <div className="label">Total Pages</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: getScoreColor(data.summary.avgSeoScore) }}>
            {data.summary.avgSeoScore}
          </div>
          <div className="label">Avg SEO Score</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: "var(--red)" }}>{data.summary.pagesWithIssues}</div>
          <div className="label">Pages with Issues</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ color: "var(--yellow)" }}>{data.missingKeywords.length}</div>
          <div className="label">Missing Target Keywords</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px", marginBottom: "30px" }}>
        {/* Keyword Coverage */}
        <div className="section">
          <div className="section-title">Top Keywords</div>
          {data.topKeywords.length > 0 ? (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.topKeywords.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                  <YAxis dataKey="keyword" type="category" width={120} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid var(--border-color)", borderRadius: "8px" }} />
                  <Bar dataKey="count" fill="#FF6B35" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
              No keyword data available. Add keywords to your articles.
            </p>
          )}
        </div>

        {/* Meta Tag Completeness */}
        <div className="section">
          <div className="section-title">Meta Tag Coverage</div>
          {pieData.length > 0 ? (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid var(--border-color)", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>No articles to analyze</p>
          )}
        </div>
      </div>

      {/* Target Keyword Coverage */}
      <div className="section" style={{ marginBottom: "30px" }}>
        <div className="section-title">Target Keyword Coverage</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {data.targetKeywords.map((kw) => (
            <span
              key={kw.keyword}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 500,
                background: kw.covered ? "rgba(76, 175, 80, 0.15)" : "rgba(244, 67, 54, 0.15)",
                color: kw.covered ? "var(--green)" : "var(--red)",
                border: `1px solid ${kw.covered ? "rgba(76, 175, 80, 0.3)" : "rgba(244, 67, 54, 0.3)"}`,
              }}
            >
              {kw.covered ? "\u2713" : "\u2717"} {kw.keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Page Audit Table */}
      <div className="section">
        <div className="section-title">Page-by-Page SEO Audit</div>
        <table className="jobs-table">
          <thead>
            <tr>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("path")}>
                PAGE {sortBy === "path" ? (sortDir === "asc" ? "\u2191" : "\u2193") : ""}
              </th>
              <th>META TITLE</th>
              <th>META DESC</th>
              <th>KEYWORDS</th>
              <th>OG TAGS</th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("seoScore")}>
                SEO SCORE {sortBy === "seoScore" ? (sortDir === "asc" ? "\u2191" : "\u2193") : ""}
              </th>
              <th>ISSUES</th>
            </tr>
          </thead>
          <tbody>
            {sortedPages.map((page) => (
              <>
                <tr
                  key={page.id}
                  style={{ cursor: page.issues.length > 0 ? "pointer" : "default" }}
                  onClick={() => page.issues.length > 0 && setExpandedRow(expandedRow === page.id ? null : page.id)}
                >
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>{page.path}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-faint)" }}>{page.title}</div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ color: page.hasMetaTitle ? "var(--green)" : "var(--red)" }}>
                      {page.hasMetaTitle ? "\u2713" : "\u2717"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ color: page.hasMetaDesc ? "var(--green)" : "var(--red)" }}>
                      {page.hasMetaDesc ? "\u2713" : "\u2717"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ color: page.hasKeywords ? "var(--green)" : "var(--red)" }}>
                      {page.hasKeywords ? "\u2713" : "\u2717"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ color: page.hasOgTags ? "var(--green)" : "var(--red)" }}>
                      {page.hasOgTags ? "\u2713" : "\u2717"}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: "var(--font-roboto-mono), monospace",
                      fontWeight: 700,
                      color: getScoreColor(page.seoScore),
                    }}>
                      {page.seoScore}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      background: page.issues.length > 0 ? "rgba(244, 67, 54, 0.15)" : "rgba(76, 175, 80, 0.15)",
                      color: page.issues.length > 0 ? "var(--red)" : "var(--green)",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}>
                      {page.issues.length}
                    </span>
                  </td>
                </tr>
                {expandedRow === page.id && page.issues.length > 0 && (
                  <tr key={`${page.id}-expand`}>
                    <td colSpan={7} style={{ padding: "12px 20px", background: "var(--border-subtle)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {page.issues.map((issue, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                            <span style={{ color: "var(--red)" }}>{"\u2022"}</span>
                            <span style={{ color: "var(--text-secondary)" }}>{issue}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
