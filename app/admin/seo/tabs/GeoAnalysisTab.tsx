"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
interface PageAudit {
  id: string;
  path: string;
  title: string;
  seoScore: number;
  geoScore: number;
  geoBreakdown: {
    total: number;
    aiFriendliness: number;
    citationWorthiness: number;
    entityCoverage: number;
    faqStructure: number;
    eeat: number;
  };
  wordCount: number;
  keywords: string[];
  issues: string[];
}

interface AnalysisData {
  pages: PageAudit[];
  summary: { totalPages: number; avgSeoScore: number; avgGeoScore: number; pagesWithIssues: number };
}

interface DeepScanResult {
  articleId: string;
  slug: string;
  title: string;
  analysis: {
    aiFriendliness?: { score: number; feedback: string };
    citationWorthiness?: { score: number; feedback: string };
    entityCoverage?: { score: number; feedback: string };
    faqReadiness?: { score: number; feedback: string };
    eeat?: { score: number; feedback: string };
    overallScore?: number;
    topSuggestions?: string[];
    error?: string;
    scannedAt?: string;
  };
  scannedAt: string;
}

function getScoreColor(score: number) {
  if (score >= 70) return "var(--green)";
  if (score >= 40) return "var(--yellow)";
  return "var(--red)";
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-roboto-mono), monospace", color: getScoreColor(score) }}>
          {score}
        </span>
      </div>
      <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: getScoreColor(score), borderRadius: "3px", transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

export default function GeoAnalysisTab({ data }: { data: AnalysisData }) {
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<DeepScanResult[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);

  // Filter to article pages only (have geoBreakdown with actual scores)
  const articlePages = data.pages.filter((p) => p.geoScore > 0 || p.wordCount > 0);

  // Compute average GEO dimensions
  const avgBreakdown = articlePages.length > 0
    ? {
        aiFriendliness: Math.round(articlePages.reduce((s, p) => s + p.geoBreakdown.aiFriendliness, 0) / articlePages.length),
        citationWorthiness: Math.round(articlePages.reduce((s, p) => s + p.geoBreakdown.citationWorthiness, 0) / articlePages.length),
        entityCoverage: Math.round(articlePages.reduce((s, p) => s + p.geoBreakdown.entityCoverage, 0) / articlePages.length),
        faqStructure: Math.round(articlePages.reduce((s, p) => s + p.geoBreakdown.faqStructure, 0) / articlePages.length),
        eeat: Math.round(articlePages.reduce((s, p) => s + p.geoBreakdown.eeat, 0) / articlePages.length),
      }
    : { aiFriendliness: 0, citationWorthiness: 0, entityCoverage: 0, faqStructure: 0, eeat: 0 };

  const chartData = articlePages
    .sort((a, b) => b.geoScore - a.geoScore)
    .slice(0, 15)
    .map((p) => ({
      name: p.path.length > 30 ? p.path.slice(0, 27) + "..." : p.path,
      score: p.geoScore,
    }));

  async function runDeepScan() {
    setScanning(true);
    setScanError(null);
    try {
      const articleIds = articlePages
        .filter((p) => !p.id.startsWith("static-"))
        .map((p) => p.id)
        .slice(0, 10);

      if (articleIds.length === 0) {
        setScanError("No articles available for deep scan.");
        setScanning(false);
        return;
      }

      const res = await fetch("/api/admin/seo/geo-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds }),
      });
      const json = await res.json();

      if (json.success) {
        setScanResults(json.results);
      } else {
        setScanError(json.error || "Deep scan failed");
      }
    } catch {
      setScanError("Failed to connect to AI service");
    } finally {
      setScanning(false);
    }
  }

  return (
    <>
      {/* GEO Score Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "30px" }}>
        {[
          { label: "AI Friendliness", score: avgBreakdown.aiFriendliness, desc: "Content clarity & structure" },
          { label: "Citation Worthy", score: avgBreakdown.citationWorthiness, desc: "Unique data & stats" },
          { label: "Entity Coverage", score: avgBreakdown.entityCoverage, desc: "Basketball entities defined" },
          { label: "FAQ Structure", score: avgBreakdown.faqStructure, desc: "Q&A format readiness" },
          { label: "E-E-A-T", score: avgBreakdown.eeat, desc: "Authority & trust signals" },
        ].map((item) => (
          <div key={item.label} style={{ background: "var(--dark-gray)", padding: "20px", textAlign: "center", borderRadius: "4px" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "var(--font-roboto-mono), monospace", color: getScoreColor(item.score) }}>
              {item.score}
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", marginTop: "4px", fontSize: "13px", fontWeight: 600 }}>{item.label}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", marginTop: "2px", fontSize: "11px" }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* GEO Breakdown + Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        <div className="section">
          <div className="section-title">GEO Score Breakdown (Average)</div>
          <div style={{ padding: "10px 0" }}>
            <ScoreBar label="AI Friendliness" score={avgBreakdown.aiFriendliness} />
            <ScoreBar label="Citation Worthiness" score={avgBreakdown.citationWorthiness} />
            <ScoreBar label="Entity Coverage" score={avgBreakdown.entityCoverage} />
            <ScoreBar label="FAQ Structure" score={avgBreakdown.faqStructure} />
            <ScoreBar label="E-E-A-T Signals" score={avgBreakdown.eeat} />
          </div>
        </div>

        <div className="section">
          <div className="section-title">GEO Score by Page</div>
          {chartData.length > 0 ? (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Bar dataKey="score" fill="#4A90D9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "40px 0" }}>No article data to display</p>
          )}
        </div>
      </div>

      {/* Content Structure Table */}
      <div className="section" style={{ marginBottom: "30px" }}>
        <div className="section-title">Content Structure Analysis</div>
        <table className="jobs-table">
          <thead>
            <tr>
              <th>PAGE</th>
              <th>AI FRIENDLY</th>
              <th>CITATION</th>
              <th>ENTITIES</th>
              <th>FAQ</th>
              <th>E-E-A-T</th>
              <th>GEO SCORE</th>
            </tr>
          </thead>
          <tbody>
            {articlePages.slice(0, 20).map((page) => (
              <tr key={page.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>{page.path}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{page.wordCount} words</div>
                </td>
                <td style={{ textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace", color: getScoreColor(page.geoBreakdown.aiFriendliness) }}>
                  {page.geoBreakdown.aiFriendliness}
                </td>
                <td style={{ textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace", color: getScoreColor(page.geoBreakdown.citationWorthiness) }}>
                  {page.geoBreakdown.citationWorthiness}
                </td>
                <td style={{ textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace", color: getScoreColor(page.geoBreakdown.entityCoverage) }}>
                  {page.geoBreakdown.entityCoverage}
                </td>
                <td style={{ textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace", color: getScoreColor(page.geoBreakdown.faqStructure) }}>
                  {page.geoBreakdown.faqStructure}
                </td>
                <td style={{ textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace", color: getScoreColor(page.geoBreakdown.eeat) }}>
                  {page.geoBreakdown.eeat}
                </td>
                <td>
                  <span style={{ fontFamily: "var(--font-roboto-mono), monospace", fontWeight: 700, color: getScoreColor(page.geoScore) }}>
                    {page.geoScore}
                  </span>
                </td>
              </tr>
            ))}
            {articlePages.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                  No article content to analyze. Publish articles to see GEO scores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Deep AI Scan */}
      <div className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <div className="section-title" style={{ margin: 0 }}>Deep AI Scan (DeepSeek)</div>
          <button
            className="btn btn-primary"
            onClick={runDeepScan}
            disabled={scanning}
            style={{ opacity: scanning ? 0.6 : 1 }}
          >
            {scanning ? "Scanning..." : "Run Deep AI Scan"}
          </button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "15px" }}>
          Uses DeepSeek AI to deeply analyze each article for AI-engine readiness, citation probability, and content quality.
          Results are cached for 24 hours. Analyzes up to 10 articles per scan.
        </p>

        {scanError && (
          <div style={{ color: "var(--red)", padding: "12px", background: "rgba(244,67,54,0.1)", borderRadius: "6px", marginBottom: "15px" }}>
            {scanError}
          </div>
        )}

        {scanResults.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {scanResults.map((result) => (
              <div
                key={result.articleId}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ fontWeight: 600 }}>{result.title}</div>
                  {result.analysis.overallScore !== undefined && (
                    <span style={{
                      fontFamily: "var(--font-roboto-mono), monospace",
                      fontWeight: 700,
                      fontSize: "18px",
                      color: getScoreColor(result.analysis.overallScore),
                    }}>
                      {result.analysis.overallScore}/100
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>
                  Scanned: {new Date(result.scannedAt).toLocaleString()}
                </div>

                {result.analysis.error ? (
                  <div style={{ color: "var(--yellow)", fontSize: "13px" }}>{result.analysis.error}</div>
                ) : (
                  <>
                    {result.analysis.topSuggestions && result.analysis.topSuggestions.length > 0 && (
                      <div style={{ marginTop: "8px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: "6px" }}>
                          AI Suggestions:
                        </div>
                        {result.analysis.topSuggestions.map((suggestion, i) => (
                          <div key={i} style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", padding: "3px 0", paddingLeft: "12px", borderLeft: "2px solid #4A90D9" }}>
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {scanResults.length === 0 && !scanError && !scanning && (
          <div style={{ textAlign: "center", padding: "30px", color: "rgba(255,255,255,0.4)" }}>
            Click &quot;Run Deep AI Scan&quot; to analyze your content with DeepSeek AI.
          </div>
        )}
      </div>
    </>
  );
}
