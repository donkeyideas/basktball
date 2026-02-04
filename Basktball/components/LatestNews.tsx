"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Insight {
  id: string;
  type: string;
  title: string | null;
  content: string;
  summary: string | null;
  generatedAt: string;
  game: {
    id: string;
    homeTeam: { name: string; abbreviation: string };
    awayTeam: { name: string; abbreviation: string };
  } | null;
  player: {
    id: string;
    name: string;
  } | null;
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    GAME_PREVIEW: "Preview",
    GAME_RECAP: "Recap",
    PLAYER_ANALYSIS: "Analysis",
    BETTING: "Betting",
    FANTASY: "Fantasy",
    TRENDING: "Trending",
  };
  return labels[type] || type;
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    GAME_PREVIEW: "var(--blue)",
    GAME_RECAP: "var(--green)",
    PLAYER_ANALYSIS: "var(--orange)",
    BETTING: "var(--yellow)",
    FANTASY: "var(--purple, #9b59b6)",
    TRENDING: "var(--red)",
  };
  return colors[type] || "var(--orange)";
}

function getArticleTitle(insight: Insight): string {
  if (insight.title) return insight.title;

  if (insight.game) {
    const away = insight.game.awayTeam.abbreviation;
    const home = insight.game.homeTeam.abbreviation;
    if (insight.type === "GAME_PREVIEW") {
      return `${away} @ ${home} Preview`;
    }
    if (insight.type === "GAME_RECAP") {
      return `${away} @ ${home} Recap`;
    }
    return `${away} vs ${home}`;
  }

  if (insight.player) {
    return `${insight.player.name} Analysis`;
  }

  return "Basketball Insight";
}

export function LatestNews() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/ai/insights?limit=4");
        const data = await res.json();
        if (data.success) {
          setInsights(data.insights);
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInsights();
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
                padding: "25px",
                opacity: 0.5
              }}>
                <div style={{ height: "20px", background: "rgba(255,255,255,0.1)", marginBottom: "15px", width: "60px" }}></div>
                <div style={{ height: "24px", background: "rgba(255,255,255,0.1)", marginBottom: "10px" }}></div>
                <div style={{ height: "60px", background: "rgba(255,255,255,0.05)" }}></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (insights.length === 0) {
    return null; // Don't show section if no content
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
          {insights.map(insight => (
            <Link
              key={insight.id}
              href={`/news/${insight.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <article style={{
                background: "var(--dark-gray)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "25px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--orange)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              >
                {/* Type Badge */}
                <div style={{ marginBottom: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    background: getTypeColor(insight.type),
                    color: "var(--black)",
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "1px",
                    textTransform: "uppercase"
                  }}>
                    {getTypeLabel(insight.type)}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "20px",
                  marginBottom: "10px",
                  lineHeight: "1.3"
                }}>
                  {getArticleTitle(insight)}
                </h3>

                {/* Preview */}
                <p style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  flex: 1,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical"
                }}>
                  {insight.summary || insight.content.substring(0, 150)}...
                </p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LatestNews;
