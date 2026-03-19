"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components";

interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  league: string;
  imageUrl?: string;
}

const LEAGUE_COLORS: Record<string, string> = {
  nba: "var(--orange)",
  wnba: "#ff6b00",
  ncaam: "#4a90d9",
  ncaaw: "#9b59b6",
  euro: "#27ae60",
};

const LEAGUE_LABELS: Record<string, string> = {
  nba: "NBA",
  wnba: "WNBA",
  ncaam: "NCAAM",
  ncaaw: "NCAAW",
  euro: "EURO",
};

const PER_PAGE = 12;

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  if (isNaN(diff) || diff < 0) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/news?limit=50", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (data.success) setArticles(data.articles);
        else setError(data.error || "Failed to load news");
      })
      .catch(() => setError("Failed to connect to server"))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(articles.length / PER_PAGE);
  const paged = articles.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "10px",
            textAlign: "center",
          }}>
            BASKETBALL NEWS
            <span style={{
              display: "block",
              width: "100px",
              height: "4px",
              background: "var(--orange)",
              margin: "15px auto 0",
            }} />
          </h1>
          <p style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            fontSize: "14px",
            marginBottom: "40px",
            letterSpacing: "1px",
          }}>
            Latest basketball news from ESPN, The Athletic, and more. Game recaps, trade rumors, and player updates across NBA, WNBA, and NCAA.
          </p>

          {/* Content */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "30px" }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: "var(--dark-gray)", opacity: 0.5, overflow: "hidden" }}>
                  <div style={{ height: "180px", background: "rgba(255,255,255,0.05)" }} />
                  <div style={{ padding: "20px" }}>
                    <div style={{ height: "20px", background: "rgba(255,255,255,0.1)", marginBottom: "15px", width: "80px" }} />
                    <div style={{ height: "28px", background: "rgba(255,255,255,0.1)", marginBottom: "12px" }} />
                    <div style={{ height: "60px", background: "rgba(255,255,255,0.05)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "var(--red)" }}>{error}</p>
            </div>
          ) : articles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>No news articles found.</p>
            </div>
          ) : (
            <>
              <div key={`page-${page}`} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "30px" }}>
                {paged.map(article => (
                  <a
                    key={article.id}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <article
                      style={{
                        background: "var(--dark-gray)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.borderColor = "var(--orange)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {/* Image */}
                      <div style={{ width: "100%", height: "180px", overflow: "hidden", background: "rgba(255,255,255,0.03)" }}>
                        {article.imageUrl ? (
                          <img
                            src={article.imageUrl}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            onError={e => {
                              const p = e.currentTarget.parentElement;
                              if (p) {
                                p.style.display = "flex";
                                p.style.alignItems = "center";
                                p.style.justifyContent = "center";
                                p.innerHTML = `<span style="font-family:Anton,sans-serif;font-size:42px;color:rgba(255,255,255,0.06)">${LEAGUE_LABELS[article.league] || article.league.toUpperCase()}</span>`;
                              }
                            }}
                          />
                        ) : (
                          <div style={{
                            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                            background: "linear-gradient(135deg, rgba(255,107,53,0.05) 0%, transparent 100%)",
                          }}>
                            <span style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "42px", color: "rgba(255,255,255,0.06)" }}>
                              {LEAGUE_LABELS[article.league] || article.league.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ padding: "20px 25px 25px", display: "flex", flexDirection: "column", flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{
                            display: "inline-block", padding: "4px 12px",
                            background: LEAGUE_COLORS[article.league] || "var(--orange)",
                            color: "var(--black)", fontSize: "11px", fontWeight: "700",
                            letterSpacing: "1px", textTransform: "uppercase",
                          }}>
                            {LEAGUE_LABELS[article.league] || article.league.toUpperCase()}
                          </span>
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontFamily: "var(--font-roboto-mono), monospace" }}>
                            {timeAgo(article.pubDate)}
                          </span>
                        </div>

                        <h3 style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "22px", marginBottom: "10px", lineHeight: "1.3" }}>
                          {article.title}
                        </h3>

                        <p style={{
                          color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.6", flex: 1,
                          overflow: "hidden", display: "-webkit-box",
                          WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                        }}>
                          {article.description}
                        </p>

                        <div style={{
                          marginTop: "15px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>via</span>
                            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: "600" }}>{article.source}</span>
                          </div>
                          <span style={{ color: "var(--orange)", fontSize: "12px", fontWeight: "600" }}>
                            Read Full Article &rarr;
                          </span>
                        </div>
                      </div>
                    </article>
                  </a>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "50px",
                  flexWrap: "wrap",
                }}>
                  <button
                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page === 1}
                    style={{
                      padding: "10px 20px",
                      background: page === 1 ? "rgba(255,255,255,0.05)" : "var(--dark-gray)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: page === 1 ? "rgba(255,255,255,0.2)" : "var(--white)",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: page === 1 ? "default" : "pointer",
                      letterSpacing: "1px",
                    }}
                  >
                    &larr; PREV
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: page === p ? "var(--orange)" : "var(--dark-gray)",
                        border: "1px solid",
                        borderColor: page === p ? "var(--orange)" : "rgba(255,255,255,0.1)",
                        color: "var(--white)",
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: "14px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page === totalPages}
                    style={{
                      padding: "10px 20px",
                      background: page === totalPages ? "rgba(255,255,255,0.05)" : "var(--dark-gray)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: page === totalPages ? "rgba(255,255,255,0.2)" : "var(--white)",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: page === totalPages ? "default" : "pointer",
                      letterSpacing: "1px",
                    }}
                  >
                    NEXT &rarr;
                  </button>
                </div>
              )}

              {/* Page info */}
              <p style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.3)",
                fontSize: "12px",
                marginTop: "15px",
                fontFamily: "var(--font-roboto-mono), monospace",
              }}>
                Page {page} of {totalPages} &middot; {articles.length} articles
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
