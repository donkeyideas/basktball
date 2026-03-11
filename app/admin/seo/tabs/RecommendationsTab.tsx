"use client";

import { useState, useCallback } from "react";

interface Recommendation {
  id: string;
  severity: "critical" | "warning" | "info";
  category: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  fix: string;
  affectedPages?: string[];
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

export default function RecommendationsTab({ data }: { data: RecommendationsData }) {
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = ["all", ...data.summary.categories.map((c) => c.category)];

  const filtered = data.recommendations.filter((r) => {
    if (severityFilter !== "all" && r.severity !== severityFilter) return false;
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    return true;
  });

  const formatForExport = useCallback((recs: Recommendation[]) => {
    const lines: string[] = [
      "# BASKTBALL SEO & GEO - Issues Report",
      `Generated: ${new Date().toISOString().split("T")[0]}`,
      `Total: ${recs.length} issues (${recs.filter(r => r.severity === "critical").length} critical, ${recs.filter(r => r.severity === "warning").length} warning, ${recs.filter(r => r.severity === "info").length} info)`,
      "",
      "---",
      "",
    ];

    const grouped: Record<string, Recommendation[]> = {};
    for (const rec of recs) {
      if (!grouped[rec.severity]) grouped[rec.severity] = [];
      grouped[rec.severity].push(rec);
    }

    for (const severity of ["critical", "warning", "info"] as const) {
      const group = grouped[severity];
      if (!group || group.length === 0) continue;
      lines.push(`## ${severity.toUpperCase()} (${group.length})`);
      lines.push("");
      for (const rec of group) {
        lines.push(`### [${rec.category}] ${rec.title}`);
        lines.push(`Impact: ${rec.impact}`);
        lines.push("");
        lines.push(`**Problem:** ${rec.description}`);
        lines.push("");
        lines.push(`**Fix:** ${rec.fix}`);
        if (rec.affectedPages && rec.affectedPages.length > 0) {
          lines.push("");
          lines.push(`**Affected pages:** ${rec.affectedPages.join(", ")}`);
        }
        lines.push("");
        lines.push("---");
        lines.push("");
      }
    }

    return lines.join("\n");
  }, []);

  const handleCopyAll = useCallback(async () => {
    const text = formatForExport(filtered);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [filtered, formatForExport]);

  const handleDownload = useCallback(() => {
    const text = formatForExport(filtered);
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seo-issues-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, formatForExport]);

  return (
    <>
      {/* Export Buttons */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "25px",
        padding: "16px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.08)",
        alignItems: "center",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>Export Issues</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
            Copy all {filtered.length} issues as formatted markdown to paste into Claude, ChatGPT, or share with a developer.
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleCopyAll}
          style={{ whiteSpace: "nowrap", minWidth: "130px" }}
        >
          {copied ? "Copied!" : "Copy All Issues"}
        </button>
        <button
          className="btn"
          onClick={handleDownload}
          style={{
            whiteSpace: "nowrap",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.8)",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Download .md
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "25px" }}>
        <div
          className="stat-card"
          style={{ cursor: "pointer", outline: severityFilter === "all" ? "2px solid var(--orange)" : "none" }}
          onClick={() => setSeverityFilter("all")}
        >
          <div className="value">{data.summary.total}</div>
          <div className="label">Total Issues</div>
        </div>
        <div
          className="stat-card"
          style={{ cursor: "pointer", outline: severityFilter === "critical" ? "2px solid var(--red)" : "none" }}
          onClick={() => setSeverityFilter(severityFilter === "critical" ? "all" : "critical")}
        >
          <div className="value" style={{ color: "var(--red)" }}>{data.summary.critical}</div>
          <div className="label">Critical</div>
        </div>
        <div
          className="stat-card"
          style={{ cursor: "pointer", outline: severityFilter === "warning" ? "2px solid var(--yellow)" : "none" }}
          onClick={() => setSeverityFilter(severityFilter === "warning" ? "all" : "warning")}
        >
          <div className="value" style={{ color: "var(--yellow)" }}>{data.summary.warning}</div>
          <div className="label">Warnings</div>
        </div>
        <div
          className="stat-card"
          style={{ cursor: "pointer", outline: severityFilter === "info" ? "2px solid var(--blue, #4A90D9)" : "none" }}
          onClick={() => setSeverityFilter(severityFilter === "info" ? "all" : "info")}
        >
          <div className="value" style={{ color: "var(--blue, #4A90D9)" }}>{data.summary.info}</div>
          <div className="label">Info</div>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "25px" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: "1px solid",
              borderColor: categoryFilter === cat ? "var(--orange)" : "rgba(255,255,255,0.15)",
              background: categoryFilter === cat ? "rgba(255, 107, 53, 0.15)" : "transparent",
              color: categoryFilter === cat ? "var(--orange)" : "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              textTransform: "capitalize",
            }}
          >
            {cat === "all" ? "All Categories" : cat}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map((rec) => (
          <div
            key={rec.id}
            className={`seo-rec-card seo-rec-${rec.severity}`}
            onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
            style={{ cursor: "pointer" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span className={`seo-severity-badge seo-severity-${rec.severity}`}>
                {rec.severity.toUpperCase()}
              </span>
              <span style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.5)",
              }}>
                {rec.category}
              </span>
              <span style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "10px",
                background: rec.impact === "high" ? "rgba(244,67,54,0.1)" : rec.impact === "medium" ? "rgba(255,152,0,0.1)" : "rgba(255,255,255,0.05)",
                color: rec.impact === "high" ? "var(--red)" : rec.impact === "medium" ? "var(--yellow)" : "rgba(255,255,255,0.5)",
              }}>
                {rec.impact} impact
              </span>
              <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
                {expandedRec === rec.id ? "\u25B2" : "\u25BC"}
              </span>
            </div>

            {/* Title */}
            <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{rec.title}</div>

            {/* Expanded Content */}
            {expandedRec === rec.id && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", marginBottom: "12px" }}>
                  {rec.description}
                </div>

                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "6px",
                  padding: "12px",
                  borderLeft: "3px solid var(--orange)",
                  marginBottom: rec.affectedPages ? "12px" : "0",
                }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--orange)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>
                    How to Fix
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: "1.6" }}>
                    {rec.fix}
                  </div>
                </div>

                {rec.affectedPages && rec.affectedPages.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>
                      Affected Pages ({rec.affectedPages.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {rec.affectedPages.slice(0, 10).map((page) => (
                        <span
                          key={page}
                          style={{
                            fontSize: "11px",
                            fontFamily: "var(--font-roboto-mono), monospace",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.6)",
                          }}
                        >
                          {page}
                        </span>
                      ))}
                      {rec.affectedPages.length > 10 && (
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                          +{rec.affectedPages.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)" }}>
            No recommendations match the selected filters.
          </div>
        )}
      </div>
    </>
  );
}
