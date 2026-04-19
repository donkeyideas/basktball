"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  Funnel, FunnelChart, LabelList,
} from "recharts";

interface CroScores {
  ctaPresence: number;
  formAccessibility: number;
  loadSpeedImpact: number;
  trustSignals: number;
  socialProof: number;
  valueProposition: number;
  mobileCro: number;
  total: number;
}

interface PageAnalysis {
  path: string;
  title: string;
  responseTime: number;
  ctaCount: number;
  ctaTexts: string[];
  formCount: number;
  croScores: CroScores;
}

interface CroData {
  croScore: number;
  pages: PageAnalysis[];
  croBreakdown: { dimension: string; score: number; weight: number }[];
  croFunnel: { stage: string; value: number; fill: string }[];
  croRecommendations: { id: string; severity: string; title: string; description: string; fix: string; affectedPages?: string[] }[];
  crawledAt: string;
  pagesAnalyzed: number;
}

function getScoreColor(score: number) {
  if (score >= 71) return "#4CAF50";
  if (score >= 41) return "#FFD700";
  return "#f44336";
}

function ScoreBar({ label, score, description }: { label: string; score: number; description?: string }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-roboto-mono), monospace", color: getScoreColor(score) }}>{score}</span>
      </div>
      <div style={{ height: "6px", background: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: getScoreColor(score), borderRadius: "3px", transition: "width 0.5s" }} />
      </div>
      {description && <div style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "2px" }}>{description}</div>}
    </div>
  );
}

export default function CroAnalysisTab({ data, onRescan }: { data: CroData | null; onRescan: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!data) {
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>&#x1F4C8;</div>
        <h3 style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>CRO Analysis Not Yet Run</h3>
        <p style={{ color: "var(--text-faint)", marginBottom: "24px" }}>
          Scan your site to analyze Conversion Rate Optimization readiness.
        </p>
        <button className="btn btn-primary" onClick={onRescan}>Scan Now</button>
      </div>
    );
  }

  const { pages, croBreakdown, croFunnel, croRecommendations, crawledAt, pagesAnalyzed } = data;

  // Average scores
  const avgScores = {
    ctaPresence: Math.round(pages.reduce((s, p) => s + p.croScores.ctaPresence, 0) / pages.length),
    formAccessibility: Math.round(pages.reduce((s, p) => s + p.croScores.formAccessibility, 0) / pages.length),
    loadSpeedImpact: Math.round(pages.reduce((s, p) => s + p.croScores.loadSpeedImpact, 0) / pages.length),
    trustSignals: Math.round(pages.reduce((s, p) => s + p.croScores.trustSignals, 0) / pages.length),
    socialProof: Math.round(pages.reduce((s, p) => s + p.croScores.socialProof, 0) / pages.length),
    valueProposition: Math.round(pages.reduce((s, p) => s + p.croScores.valueProposition, 0) / pages.length),
    mobileCro: Math.round(pages.reduce((s, p) => s + p.croScores.mobileCro, 0) / pages.length),
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>
          Last scanned: {new Date(crawledAt).toLocaleString()} &bull; {pagesAnalyzed} pages analyzed
        </span>
        <button className="btn btn-primary" onClick={onRescan} style={{ fontSize: "13px", padding: "6px 16px" }}>
          Scan Now
        </button>
      </div>

      {/* Score Cards - 2 rows */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "12px" }}>
        {[
          { label: "CTA Presence", score: avgScores.ctaPresence, desc: "Call-to-action elements" },
          { label: "Form Access.", score: avgScores.formAccessibility, desc: "Form usability & labels" },
          { label: "Load Speed", score: avgScores.loadSpeedImpact, desc: "Response time impact" },
          { label: "Trust Signals", score: avgScores.trustSignals, desc: "Security & credibility" },
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
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginTop: "4px" }}>{card.label}</div>
            <div style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>{card.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Social Proof", score: avgScores.socialProof, desc: "Testimonials & ratings" },
          { label: "Value Prop", score: avgScores.valueProposition, desc: "Benefit messaging" },
          { label: "Mobile CRO", score: avgScores.mobileCro, desc: "Mobile conversion ready" },
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
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginTop: "4px" }}>{card.label}</div>
            <div style={{ fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* CRO Breakdown Bar Chart */}
        <div className="section">
          <h3 className="section-title" style={{ borderColor: "#00BCD4" }}>CRO Score Breakdown</h3>
          <div style={{ padding: "12px" }}>
            <ScoreBar label="CTA Presence" score={avgScores.ctaPresence} description="CTA count, placement, styling (20%)" />
            <ScoreBar label="Form Accessibility" score={avgScores.formAccessibility} description="Labels, placeholders, submit buttons (10%)" />
            <ScoreBar label="Load Speed Impact" score={avgScores.loadSpeedImpact} description="Response time scoring (15%)" />
            <ScoreBar label="Trust Signals" score={avgScores.trustSignals} description="Trust keywords, badges, privacy (15%)" />
            <ScoreBar label="Social Proof" score={avgScores.socialProof} description="Testimonials, user counts, ratings (15%)" />
            <ScoreBar label="Value Proposition" score={avgScores.valueProposition} description="Benefit H1, value words (15%)" />
            <ScoreBar label="Mobile CRO" score={avgScores.mobileCro} description="Viewport, responsive, touch-friendly (10%)" />
          </div>
        </div>

        {/* CRO Funnel */}
        <div className="section">
          <h3 className="section-title" style={{ borderColor: "#00BCD4" }}>Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip
                contentStyle={{ background: "var(--dark-gray)", border: "1px solid var(--border-color)", borderRadius: "8px" }}
                formatter={(value: number) => [`${value}%`, "Coverage"]}
              />
              <Funnel
                dataKey="value"
                data={croFunnel}
                isAnimationActive
              >
                {croFunnel.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
                <LabelList position="center" fill="#fff" fontSize={14} fontWeight={600} formatter={(value: number) => `${value}%`} />
                <LabelList position="right" fill="var(--text-muted)" fontSize={12} dataKey="stage" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "8px" }}>
            {croFunnel.map((stage) => (
              <div key={stage.stage} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: stage.fill }} />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{stage.stage} ({stage.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CRO by Page - Bar Chart */}
      <div className="section" style={{ marginBottom: "24px" }}>
        <h3 className="section-title" style={{ borderColor: "#00BCD4" }}>CRO Score by Page</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={pages.map((p) => ({ path: p.path, score: p.croScores.total })).sort((a, b) => b.score - a.score)}
            layout="vertical"
            margin={{ left: 60, right: 20, top: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis type="number" domain={[0, 100]} stroke="var(--text-faint)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
            <YAxis type="category" dataKey="path" stroke="var(--text-faint)" tick={{ fill: "var(--text-muted)", fontSize: 11 }} width={55} />
            <Tooltip
              contentStyle={{ background: "var(--dark-gray)", border: "1px solid var(--border-color)", borderRadius: "8px" }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {pages.map((p, i) => (
                <Cell key={i} fill={getScoreColor(p.croScores.total)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-Page Table */}
      <div className="section" style={{ marginBottom: "24px" }}>
        <h3 className="section-title" style={{ borderColor: "#00BCD4" }}>Page-Level CRO Analysis</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="jobs-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>PAGE</th>
                <th>CTA</th>
                <th>FORMS</th>
                <th>SPEED</th>
                <th>TRUST</th>
                <th>SOCIAL</th>
                <th>VALUE</th>
                <th>MOBILE</th>
                <th>CRO SCORE</th>
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
                    <div style={{ fontSize: "11px", color: "var(--text-faint)" }}>
                      {page.ctaCount} CTAs &bull; {page.formCount} forms &bull; {page.responseTime}ms
                    </div>
                    {expanded === page.path && page.ctaTexts.length > 0 && (
                      <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
                        CTAs found: {page.ctaTexts.map((t, i) => (
                          <span key={i} style={{ display: "inline-block", background: "rgba(0,188,212,0.15)", padding: "1px 6px", borderRadius: "3px", marginRight: "4px", marginTop: "2px" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ color: getScoreColor(page.croScores.ctaPresence), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.croScores.ctaPresence}
                  </td>
                  <td style={{ color: getScoreColor(page.croScores.formAccessibility), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.croScores.formAccessibility}
                  </td>
                  <td style={{ color: getScoreColor(page.croScores.loadSpeedImpact), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.croScores.loadSpeedImpact}
                  </td>
                  <td style={{ color: getScoreColor(page.croScores.trustSignals), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.croScores.trustSignals}
                  </td>
                  <td style={{ color: getScoreColor(page.croScores.socialProof), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.croScores.socialProof}
                  </td>
                  <td style={{ color: getScoreColor(page.croScores.valueProposition), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.croScores.valueProposition}
                  </td>
                  <td style={{ color: getScoreColor(page.croScores.mobileCro), fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.croScores.mobileCro}
                  </td>
                  <td style={{ color: getScoreColor(page.croScores.total), fontWeight: "bold", fontFamily: "var(--font-roboto-mono), monospace" }}>
                    {page.croScores.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      {croRecommendations.length > 0 && (
        <div className="section">
          <h3 className="section-title" style={{ borderColor: "#00BCD4" }}>CRO Recommendations ({croRecommendations.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {croRecommendations.map((rec) => (
              <div key={rec.id} className="seo-rec-card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    background: rec.severity === "critical" ? "rgba(255,0,0,0.2)" : rec.severity === "warning" ? "rgba(255,165,0,0.2)" : "rgba(0,150,255,0.2)",
                    color: rec.severity === "critical" ? "#f44336" : rec.severity === "warning" ? "#FFD700" : "#4A90D9",
                  }}>
                    {rec.severity}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rec.title}</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>{rec.description}</p>
                <p style={{ fontSize: "12px", color: "#00BCD4" }}>Fix: {rec.fix}</p>
                {rec.affectedPages && rec.affectedPages.length > 0 && (
                  <div style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "6px" }}>
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
