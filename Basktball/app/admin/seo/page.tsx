"use client";

import { useState, useEffect } from "react";

interface SeoData {
  sitemapUrls: number;
  indexedPages: number;
  lastSitemapUpdate: string | null;
  metaTags: Array<{
    page: string;
    title: string;
    description: string;
    keywords: string;
  }>;
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
        setData(json);
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

  async function regenerateSitemap() {
    try {
      await fetch("/api/admin/seo/sitemap", { method: "POST" });
      await fetchSeo();
    } catch {
      // Silent fail
    }
  }

  return (
    <>
      <div className="admin-header">
        <h1>SEO MANAGEMENT</h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <button className="btn btn-secondary" onClick={regenerateSitemap}>
            Regenerate Sitemap
          </button>
          <button className="btn btn-primary" onClick={fetchSeo}>
            Refresh
          </button>
        </div>
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
            {/* Stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
              marginBottom: "40px"
            }}>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="value">{data?.sitemapUrls || 0}</div>
                <div className="label">Sitemap URLs</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div className="value">{data?.indexedPages || 0}</div>
                <div className="label">Indexed Pages</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="value">
                  {data?.lastSitemapUpdate
                    ? new Date(data.lastSitemapUpdate).toLocaleDateString()
                    : "Never"}
                </div>
                <div className="label">Last Sitemap Update</div>
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

            {/* Meta Tags */}
            <div className="section">
              <div className="section-title">Page Meta Tags</div>
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>PAGE</th>
                    <th>TITLE</th>
                    <th>DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.metaTags || []).map((meta, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: "600" }}>{meta.page}</td>
                      <td style={{ maxWidth: "300px" }}>{meta.title}</td>
                      <td style={{ maxWidth: "400px", color: "rgba(255,255,255,0.6)" }}>
                        {meta.description?.slice(0, 100)}...
                      </td>
                    </tr>
                  ))}
                  {(!data?.metaTags || data.metaTags.length === 0) && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                        No meta tag data available
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
