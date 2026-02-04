"use client";

import { useState, useEffect } from "react";

interface SearchConsole {
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  averagePosition: number;
  indexedPages: number;
  pendingPages: number;
  errorPages: number;
}

interface SeoScore {
  category: string;
  score: number;
  status: "good" | "warning" | "error";
  issues: string[];
}

interface PageData {
  path: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  lastCrawled: string;
  indexStatus: string;
  impressions: number;
  clicks: number;
  position: number;
}

interface SeoData {
  searchConsole: SearchConsole;
  seoScores: SeoScore[];
  pages: PageData[];
}

export default function AdminSeoPage() {
  const [data, setData] = useState<SeoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchSeo() {
    try {
      const res = await fetch("/api/admin/seo");
      const json = await res.json();
      if (json.success) {
        setData({
          searchConsole: json.searchConsole,
          seoScores: json.seoScores,
          pages: json.pages,
        });
        setError(null);
      } else {
        setError(json.error || "Failed to load SEO data");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSeo();
  }, []);

  return (
    <>
      <div className="admin-header">
        <h1>SEO MANAGEMENT</h1>
        <button className="btn btn-primary" onClick={fetchSeo}>
          Refresh
        </button>
      </div>

      <div className="admin-content">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading SEO data...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Search Console Stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              marginBottom: "40px"
            }}>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="value">{data?.searchConsole?.totalImpressions?.toLocaleString() ?? "-"}</div>
                <div className="label">Total Impressions</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </div>
                <div className="value">{data?.searchConsole?.totalClicks?.toLocaleString() ?? "-"}</div>
                <div className="label">Total Clicks</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className="value">{data?.searchConsole?.averageCTR ?? "-"}%</div>
                <div className="label">Average CTR</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div className="value">{data?.searchConsole?.averagePosition ?? "-"}</div>
                <div className="label">Avg Position</div>
              </div>
            </div>

            {/* Index Status */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
              marginBottom: "40px"
            }}>
              <div className="stat-card">
                <div className="value" style={{ color: "var(--green)" }}>{data?.searchConsole?.indexedPages ?? "-"}</div>
                <div className="label">Indexed Pages</div>
              </div>
              <div className="stat-card">
                <div className="value" style={{ color: "var(--yellow)" }}>{data?.searchConsole?.pendingPages ?? "-"}</div>
                <div className="label">Pending Pages</div>
              </div>
              <div className="stat-card">
                <div className="value" style={{ color: "var(--red)" }}>{data?.searchConsole?.errorPages ?? "-"}</div>
                <div className="label">Error Pages</div>
              </div>
            </div>

            {/* SEO Health Scores */}
            <div className="section">
              <div className="section-title">SEO Health</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px" }}>
                {(data?.seoScores || []).map((score, index) => (
                  <div key={index} style={{
                    background: "var(--dark-gray)",
                    padding: "20px",
                    textAlign: "center"
                  }}>
                    <div style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: score.status === "good" ? "var(--green)" : score.status === "warning" ? "var(--yellow)" : "var(--red)"
                    }}>
                      {score.score}%
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.7)", marginTop: "5px" }}>{score.category}</div>
                    {score.issues.length > 0 && (
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "10px" }}>
                        {score.issues[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="section">
              <div className="section-title">Quick Links</div>
              <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  className="btn btn-secondary"
                  style={{ textDecoration: "none" }}
                >
                  View Sitemap
                </a>
                <a
                  href="/robots.txt"
                  target="_blank"
                  className="btn btn-secondary"
                  style={{ textDecoration: "none" }}
                >
                  View Robots.txt
                </a>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: "none" }}
                >
                  Google Search Console
                </a>
              </div>
            </div>

            {/* Top Pages */}
            <div className="section">
              <div className="section-title">Top Pages</div>
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>PAGE</th>
                    <th>IMPRESSIONS</th>
                    <th>CLICKS</th>
                    <th>POSITION</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.pages || []).map((page, index) => (
                    <tr key={index}>
                      <td>
                        <div style={{ fontWeight: "600" }}>{page.path}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{page.title}</div>
                      </td>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {page.impressions.toLocaleString()}
                      </td>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {page.clicks.toLocaleString()}
                      </td>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {page.position.toFixed(1)}
                      </td>
                      <td>
                        <span className={`job-status ${page.indexStatus === "indexed" ? "success" : "paused"}`}>
                          {page.indexStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!data?.pages || data.pages.length === 0) && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                        No page data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
