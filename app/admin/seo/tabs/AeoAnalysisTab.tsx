"use client";

import { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface AeoScores {
  schemaRichness: number;
  faqCoverage: number;
  directAnswerReadiness: number;
  entityMarkup: number;
  speakableContent: number;
  aiSnippetCompatibility: number;
  total: number;
}

interface PageAnalysis {
  path: string;
  title: string;
  wordCount: number;
  aeoScores: AeoScores;
}

interface AeoData {
  aeoScore: number;
  pages: PageAnalysis[];
  aeoRadar: { axis: string; value: number }[];
  aeoRecommendations: { id: string; severity: string; title: string; description: string; fix: string; affectedPages?: string[] }[];
  crawledAt: string;
  pagesAnalyzed: number;
}

function getScoreColor(score: number) {
  if (score >= 70) return "var(--green)";
  if (score >= 40) return "var(--yellow)";
  return "var(--red)";
}

function ScoreBar({ label, score, description }: { label: string; score: number; description?: string }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-roboto-mono), monospace", color: getScoreColor(score) }}>{score}</span>
      </div>
      <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: getScoreColor(score), borderRadius: "3px", transition: "width 0.5s" }} />
      </div>
      {description && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{description}</div>}
    </div>
  );
}

export default function AeoAnalysisTab({ data, onRescan }: { data: AeoData | null; onRescan: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!data) {
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>&#x1F916;</div>
        <h3 style={{ color: "rgba(255,255,255,0.7)", marginBottom: "8px" }}>AEO Analysis Not Yet Run</h3>
        <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "24px" }}>
          Scan your site to analyze Answer Engine Optimization readiness.
        </p>
        <button className="btn btn-primary" onClick={onRescan}>Scan Now</button>
      </div>
    );
  }

  const { pages, aeoRadar, aeoRecommendations, crawledAt, pagesAnalyzed } = data;

  // Average scores for breakdown
  const avgScores = {
    schemaRichness: Math.round(pages.reduce((s, p) => s + p.aeoScores.schemaRichness, 0) / pages.length),
    faqCoverage: Math.round(pages.reduce((s, p) => s + p.aeoScores.faqCoverage, 0) / pages.length),
    directAnswerReadiness: Math.round(pages.reduce((s, p) => s + p.aeoScores.directAnswerReadiness, 0) / pages.length),
    entityMarkup: Math.round(pages.reduce((s, p) => s + p.aeoScores.entityMarkup, 0) / pages.length),
    speakableContent: Math.round(pages.reduce((s, p) => s + p.aeoScores.speakableContent, 0) / pages.length),
    aiSnippetCompatibility: Math.round(pages.reduce((s, p) => s + p.aeoScores.aiSnippetCompatibility, 0) / pages.length),
  };

  // Page data for bar chart
  const pageBarData = pages.map((p) => ({
    path: p.path,
    score: p.aeoScores.total,
  })).sort((a, b) => b.score - a.score);

  return (
    <>
      {/* Header with scan info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
            Last scanned: {new Date(crawledAt).toLocaleString()} &bull; {pagesAnalyzed} pages analyzed
          </span>
        </div>
        <button className="btn btn-primary" onClick={onRescan} style={{ fontSize: "13px", padding: "6px 16px" }}>
          Scan Now
        </button>
      </div>

      {/* Score Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Schema Richness", score: avgScores.schemaRichness, desc: "JSON-LD variety & depth" },
          { label: "FAQ Coverage", score: avgScores.faqCoverage, desc: "Q&A format readiness" },
          { label: "Direct Answers", score: avgScores.directAnswerReadiness, desc: "Concise answer formatting" },
          { label: "Entity Markup", score: avgScores.entityMarkup, desc: "Entity schema completeness" },
          { label: "Speakable", score: avgScores.speakableContent, desc: "Voice assistant readiness" },
          { label: "AI Snippets", score: avgScores.aiSnippetCompatibility, desc: "AI extraction compatibility" },
        ].map((card) => (
          <div key={card.label} className="stat-card" style={{ textAlign: "center", padding: "16px 8px" }}>
            <div style={{
              fontSize: "28px",
              fontWeight: "bold",
              fontFamily: "var(--font-roboto-mono), monospace",
              color: getScoreColor(card.score),
            }}>
              {card.score}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", marginTop: "4px" }}>{card.label}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* AEO Radar Chart */}
        <div className="section">
          <h3 className="section-title" style={{ borderColor: "#9C27B0" }}>AEO Score Breakdown (Average)</h3>
          <div style={{ padding: "12px" }}>
            <ScoreBar label="Schema Richness" score={avgScores.schemaRichness} description="Variety/depth of JSON-LD schemas" />
            <ScoreBar label="FAQ Coverage" score={avgScores.faqCoverage} description="FAQ schema, Q&A pairs, question headings" />
            <ScoreBar label="Direct Answer Readiness" score={avgScores.directAnswerReadiness} description="Definition sentences, concise paragraphs" />
            <ScoreBar label="Entity Markup" score={avgScores.entityMarkup} description="Organization/Person schema completeness" />
            <ScoreBar label="Speakable Content" score={avgScores.speakableContent} description="SpeakableSpecification, natural reading flow" />
            <ScoreBar label="AI Snippet Compatibility" score={avgScores.aiSnippetCompatibility} description="Tables, lists, heading-content mapping" />
          </div>
        </div>

        {/* AEO by Page */}
        <div className="section">
          <h3 className="section-title" style={{ borderColor: "#9C27B0" }}>AEO Score by Page</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pageBarData} layout="vertical" margin={{ left: 60, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.3)" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
              <YAxis type="category" dataKey="path" stroke="rgba(255,255,255,0.3)" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} width={55} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                labelStyle={{ color: "rgba(255,255,255,0.7)" }}
              />
              <Bar dataKey="score" fill="#9C27B0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="section" style={{ marginBottom: "24px" }}>
        <h3 className="section-title" style={{ borderColor: "#9C27B0" }}>AEO Readiness Radar</h3>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={aeoRadar} outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.15)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
              <Radar dataKey="value" stroke="#9C27B0" fill="#9C27B0" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Page Table */}
      <div className="section" style={{ marginBottom: "24px" }}>
        <h3 className="section-title" style={{ borderColor: "#9C27B0" }}>Content Structure Analysis</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="jobs-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>PAGE</th>
                <th>SCHEMA</th>
                <th>FAQ</th>
                <th>ANSWERS</th>
                <th>ENTITY</th>
                <th>SPEAKABLE</th>
                <th>AI SNIPPET</th>
                <th>AEO SCORE</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page.path}
                  onClick={() => setExpanded(expanded === page.path ? null : page.path)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <div style={{ fontWeight: 500 }}>{page.path}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{page.wordCount} words</div>
                  </td>
                  <td style={{ color: getScoreColor(page.aeoScores.schemaRichness), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.aeoScores.schemaRichness}
                  </td>
                  <td style={{ color: getScoreColor(page.aeoScores.faqCoverage), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.aeoScores.faqCoverage}
                  </td>
                  <td style={{ color: getScoreColor(page.aeoScores.directAnswerReadiness), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.aeoScores.directAnswerReadiness}
                  </td>
                  <td style={{ color: getScoreColor(page.aeoScores.entityMarkup), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.aeoScores.entityMarkup}
                  </td>
                  <td style={{ color: getScoreColor(page.aeoScores.speakableContent), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.aeoScores.speakableContent}
                  </td>
                  <td style={{ color: getScoreColor(page.aeoScores.aiSnippetCompatibility), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.aeoScores.aiSnippetCompatibility}
                  </td>
                  <td style={{ color: getScoreColor(page.aeoScores.total), fontWeight: "bold", fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.aeoScores.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      {aeoRecommendations.length > 0 && (
        <div className="section">
          <h3 className="section-title" style={{ borderColor: "#9C27B0" }}>AEO Recommendations ({aeoRecommendations.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {aeoRecommendations.map((rec) => (
              <div key={rec.id} className="seo-rec-card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    background: rec.severity === "critical" ? "rgba(255,0,0,0.2)" : rec.severity === "warning" ? "rgba(255,165,0,0.2)" : "rgba(0,150,255,0.2)",
                    color: rec.severity === "critical" ? "var(--red)" : rec.severity === "warning" ? "var(--yellow)" : "#4A90D9",
                  }}>
                    {rec.severity}
                  </span>
                  <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{rec.title}</span>
                </div>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>{rec.description}</p>
                <p style={{ fontSize: "12px", color: "#9C27B0" }}>Fix: {rec.fix}</p>
                {rec.affectedPages && rec.affectedPages.length > 0 && (
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>
                    Affected: {rec.affectedPages.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
