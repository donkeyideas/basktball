"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components";

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

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    GAME_PREVIEW: "Game Preview",
    GAME_RECAP: "Game Recap",
    PLAYER_ANALYSIS: "Player Analysis",
    BETTING: "Betting Insights",
    FANTASY: "Fantasy Tips",
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
    weekday: "long",
    month: "long",
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

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsight() {
      try {
        const res = await fetch(`/api/ai/insights/${resolvedParams.id}`);
        const data = await res.json();
        if (data.success) {
          setInsight(data.insight);
        } else {
          setError(data.error || "Article not found");
        }
      } catch {
        setError("Failed to load article");
      } finally {
        setIsLoading(false);
      }
    }
    fetchInsight();
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading article...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !insight) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", padding: "60px" }}>
            <h1 style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "36px",
              marginBottom: "20px"
            }}>
              Article Not Found
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "30px" }}>
              {error || "This article doesn't exist or has been removed."}
            </p>
            <Link
              href="/news"
              style={{
                display: "inline-block",
                padding: "12px 30px",
                background: "var(--orange)",
                color: "var(--black)",
                fontWeight: "700",
                textDecoration: "none"
              }}
            >
              Back to News
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <article style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Back Link */}
          <Link
            href="/news"
            style={{
              display: "inline-flex",
              alignItems: "center",
              color: "rgba(255,255,255,0.6)",
              textDecoration: "none",
              fontSize: "14px",
              marginBottom: "30px",
              transition: "color 0.3s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "var(--orange)"}
            onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
          >
            ← Back to News
          </Link>

          {/* Type Badge */}
          <div style={{ marginBottom: "20px" }}>
            <span style={{
              display: "inline-block",
              padding: "6px 16px",
              background: getTypeColor(insight.type),
              color: "var(--black)",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase"
            }}>
              {getTypeLabel(insight.type)}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "42px",
            lineHeight: "1.2",
            marginBottom: "20px"
          }}>
            {getArticleTitle(insight)}
          </h1>

          {/* Meta Info */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "30px",
            paddingBottom: "30px",
            borderBottom: "1px solid rgba(255,255,255,0.1)"
          }}>
            <p style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "14px",
              fontFamily: "var(--font-roboto-mono), monospace"
            }}>
              {formatDate(insight.generatedAt)}
            </p>

            {insight.game && (
              <Link
                href={`/game/${insight.game.id}`}
                style={{
                  color: "var(--orange)",
                  fontSize: "14px",
                  textDecoration: "none"
                }}
              >
                {insight.game.awayTeam.name} @ {insight.game.homeTeam.name}
                {insight.game.awayScore !== null && insight.game.homeScore !== null && (
                  <span style={{ marginLeft: "10px", fontWeight: "bold" }}>
                    ({insight.game.awayScore} - {insight.game.homeScore})
                  </span>
                )}
              </Link>
            )}

            {insight.player && (
              <Link
                href={`/player/${insight.player.id}`}
                style={{
                  color: "var(--orange)",
                  fontSize: "14px",
                  textDecoration: "none"
                }}
              >
                {insight.player.name}
                {insight.player.team && ` • ${insight.player.team.name}`}
              </Link>
            )}
          </div>

          {/* Content */}
          <div style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: "17px",
            lineHeight: "1.8",
            whiteSpace: "pre-wrap"
          }}>
            {insight.content}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "50px",
            paddingTop: "30px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            textAlign: "center"
          }}>
            <p style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "12px",
              marginBottom: "20px"
            }}>
              AI-Generated Content • For entertainment purposes only
            </p>
            <Link
              href="/news"
              style={{
                display: "inline-block",
                padding: "12px 30px",
                background: "var(--orange)",
                color: "var(--black)",
                fontWeight: "700",
                textDecoration: "none"
              }}
            >
              More News
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
