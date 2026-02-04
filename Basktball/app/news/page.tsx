"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components";

type ContentType = "ALL" | "GAME_PREVIEW" | "GAME_RECAP" | "PLAYER_ANALYSIS" | "BETTING" | "FANTASY" | "TRENDING";

interface Insight {
  id: string;
  type: string;
  title: string | null;
  content: string;
  summary: string | null;
  generatedAt: string;
  game: {
    id: string;
    gameDate: string;
    homeTeam: { name: string; abbreviation: string };
    awayTeam: { name: string; abbreviation: string };
    homeScore: number | null;
    awayScore: number | null;
  } | null;
  player: {
    id: string;
    name: string;
    team: { name: string; abbreviation: string } | null;
  } | null;
}

const contentTypes: { id: ContentType; name: string }[] = [
  { id: "ALL", name: "All Content" },
  { id: "GAME_PREVIEW", name: "Game Previews" },
  { id: "GAME_RECAP", name: "Game Recaps" },
  { id: "PLAYER_ANALYSIS", name: "Player Analysis" },
  { id: "BETTING", name: "Betting Insights" },
  { id: "FANTASY", name: "Fantasy Tips" },
  { id: "TRENDING", name: "Trending" },
];

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

export default function NewsPage() {
  const [contentType, setContentType] = useState<ContentType>("ALL");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      setIsLoading(true);
      setError(null);
      try {
        const typeParam = contentType !== "ALL" ? `&type=${contentType}` : "";
        const res = await fetch(`/api/ai/insights?limit=50${typeParam}`);
        const data = await res.json();
        if (data.success) {
          setInsights(data.insights);
        } else {
          setError(data.error || "Failed to load content");
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setIsLoading(false);
      }
    }
    fetchInsights();
  }, [contentType]);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Page Header */}
          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "40px",
            textAlign: "center"
          }}>
            NEWS & INSIGHTS
            <span style={{
              display: "block",
              width: "100px",
              height: "4px",
              background: "var(--orange)",
              margin: "15px auto 0"
            }}></span>
          </h1>

          {/* Filter Tabs */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginBottom: "40px",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            {contentTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setContentType(type.id)}
                style={{
                  padding: "12px 24px",
                  background: contentType === type.id ? "var(--orange)" : "var(--dark-gray)",
                  border: "2px solid",
                  borderColor: contentType === type.id ? "var(--orange)" : "rgba(255,255,255,0.1)",
                  color: "var(--white)",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontSize: "14px",
                  fontWeight: "600",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                {type.name}
              </button>
            ))}
          </div>

          {/* Content Grid */}
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading content...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "var(--red)" }}>{error}</p>
            </div>
          ) : insights.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>No content available yet.</p>
              <p style={{ color: "rgba(255,255,255,0.3)", marginTop: "10px", fontSize: "14px" }}>
                AI-generated content will appear here once approved.
              </p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: "30px"
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
                    <div style={{ marginBottom: "15px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        background: getTypeColor(insight.type),
                        color: "var(--black)",
                        fontSize: "11px",
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
                      fontSize: "22px",
                      marginBottom: "12px",
                      lineHeight: "1.3"
                    }}>
                      {getArticleTitle(insight)}
                    </h3>

                    {/* Game/Player Info */}
                    {insight.game && (
                      <p style={{
                        color: "var(--orange)",
                        fontSize: "13px",
                        marginBottom: "12px",
                        fontWeight: "600"
                      }}>
                        {insight.game.awayTeam.name} vs {insight.game.homeTeam.name}
                      </p>
                    )}
                    {insight.player && !insight.game && (
                      <p style={{
                        color: "var(--orange)",
                        fontSize: "13px",
                        marginBottom: "12px",
                        fontWeight: "600"
                      }}>
                        {insight.player.name} {insight.player.team ? `• ${insight.player.team.name}` : ""}
                      </p>
                    )}

                    {/* Summary/Preview */}
                    <p style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      flex: 1,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical"
                    }}>
                      {insight.summary || insight.content.substring(0, 200)}...
                    </p>

                    {/* Date */}
                    <p style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "12px",
                      marginTop: "15px",
                      fontFamily: "var(--font-roboto-mono), monospace"
                    }}>
                      {formatDate(insight.generatedAt)}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
