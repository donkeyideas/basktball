"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceLogo?: string;
  league: string;
  imageUrl?: string;
}

function getLeagueColor(league: string): string {
  const colors: Record<string, string> = {
    nba: "var(--orange)",
    wnba: "#ff6b00",
    ncaam: "#4a90d9",
    ncaaw: "#9b59b6",
    euro: "#27ae60",
  };
  return colors[league] || "var(--orange)";
}

function getLeagueLabel(league: string): string {
  const labels: Record<string, string> = {
    nba: "NBA",
    wnba: "WNBA",
    ncaam: "NCAAM",
    ncaaw: "NCAAW",
    euro: "EURO",
  };
  return labels[league] || league.toUpperCase();
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();

  if (isNaN(diffMs) || diffMs < 0) return "just now";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function LatestNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news?limit=4");
        const data = await res.json();
        if (data.success) {
          setArticles(data.articles);
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNews();
  }, []);

  if (isLoading) {
    return (
      <section style={{ padding: "80px 20px", background: "var(--black)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "50px",
            textAlign: "center"
          }}>
            LATEST NEWS
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "25px"
          }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                background: "var(--dark-gray)",
                opacity: 0.5,
                overflow: "hidden",
              }}>
                <div style={{ height: "160px", background: "var(--input-bg)" }}></div>
                <div style={{ padding: "20px" }}>
                  <div style={{ height: "20px", background: "var(--border-color)", marginBottom: "15px", width: "60px" }}></div>
                  <div style={{ height: "24px", background: "var(--border-color)", marginBottom: "10px" }}></div>
                  <div style={{ height: "40px", background: "var(--input-bg)" }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <section style={{ padding: "80px 20px", background: "var(--black)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "50px"
        }}>
          <h2 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px"
          }}>
            LATEST NEWS
          </h2>
          <Link
            href="/news"
            style={{
              padding: "12px 24px",
              border: "2px solid var(--orange)",
              color: "var(--orange)",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "14px",
              letterSpacing: "1px",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "var(--orange)";
              e.currentTarget.style.color = "var(--black)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--orange)";
            }}
          >
            VIEW ALL
          </Link>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "25px"
        }}>
          {articles.map(article => (
            <Link
              key={article.id}
              href={`/news/${article.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <article style={{
                background: "var(--dark-gray)",
                border: "1px solid var(--border-color)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.3s ease",
                cursor: "pointer",
                overflow: "hidden",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--orange)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              >
                {/* Article Image */}
                <div style={{
                  width: "100%",
                  height: "160px",
                  overflow: "hidden",
                  background: "var(--input-bg)",
                }}>
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={(e) => {
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.style.display = "flex";
                          parent.style.alignItems = "center";
                          parent.style.justifyContent = "center";
                          parent.innerHTML = `<span style="font-family:Anton,sans-serif;font-size:36px;color:var(--border-subtle)">${getLeagueLabel(article.league)}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, rgba(255,107,53,0.05) 0%, transparent 100%)",
                    }}>
                      <span style={{
                        fontFamily: "var(--font-anton), Anton, sans-serif",
                        fontSize: "36px",
                        color: "var(--border-subtle)",
                      }}>
                        {getLeagueLabel(article.league)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div style={{ padding: "15px 20px 20px", display: "flex", flexDirection: "column", flex: 1 }}>

                {/* League Badge + Time */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    background: getLeagueColor(article.league),
                    color: "var(--black)",
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "1px",
                    textTransform: "uppercase"
                  }}>
                    {getLeagueLabel(article.league)}
                  </span>
                  <span style={{
                    color: "var(--text-faint)",
                    fontSize: "11px",
                    fontFamily: "var(--font-roboto-mono), monospace"
                  }}>
                    {timeAgo(article.pubDate)}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "20px",
                  marginBottom: "8px",
                  lineHeight: "1.3"
                }}>
                  {article.title}
                </h3>

                {/* Description */}
                <p style={{
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  flex: 1,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical"
                }}>
                  {article.description}
                </p>

                {/* Source Attribution */}
                <div style={{
                  marginTop: "12px",
                  paddingTop: "10px",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <span style={{
                    color: "var(--text-faint)",
                    fontSize: "11px",
                  }}>
                    via
                  </span>
                  <span style={{
                    color: "var(--text-muted)",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}>
                    {article.source}
                  </span>
                </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LatestNews;
