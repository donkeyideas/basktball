"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components";

interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  content?: string;
  pubDate: string;
  source: string;
  sourceLogo?: string;
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [articleId, setArticleId] = useState<string>("");

  useEffect(() => {
    params.then(({ id }) => setArticleId(id));
  }, [params]);

  useEffect(() => {
    if (!articleId) return;

    async function loadArticle() {
      try {
        // Fetch all articles and find the matching one by ID
        const res = await fetch("/api/news?limit=50");
        const data = await res.json();
        if (data.success && data.articles) {
          const found = data.articles.find((a: NewsArticle) => a.id === articleId);
          if (found) {
            setArticle(found);
            // Scrape richer content from the article source
            if (!found.content) {
              fetch(`/api/news/scrape?url=${encodeURIComponent(found.link)}`)
                .then((r) => r.json())
                .then((d) => {
                  if (d.success && d.content) {
                    setArticle((prev) => prev ? { ...prev, content: d.content } : prev);
                  }
                })
                .catch(() => {});
            }
          } else {
            setError("Article not found");
          }
        } else {
          setError("Failed to load news");
        }
      } catch {
        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [articleId]);

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ height: "400px", background: "var(--input-bg)", marginBottom: "30px" }} />
            <div style={{ height: "20px", background: "var(--border-color)", width: "80px", marginBottom: "20px" }} />
            <div style={{ height: "40px", background: "var(--border-color)", marginBottom: "15px" }} />
            <div style={{ height: "100px", background: "var(--input-bg)" }} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !article) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "80px 20px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "18px", marginBottom: "20px" }}>
            {error || "Article not found"}
          </p>
          <Link href="/news" style={{ color: "var(--orange)", textDecoration: "none", fontWeight: "600" }}>
            &larr; Back to News
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const leagueColor = LEAGUE_COLORS[article.league] || "var(--orange)";
  const leagueLabel = LEAGUE_LABELS[article.league] || article.league.toUpperCase();

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Back link */}
          <Link
            href="/news"
            style={{
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "30px",
              transition: "color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--orange)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            &larr; Back to News
          </Link>

          {/* Hero image */}
          {article.imageUrl && (
            <div
              style={{
                width: "100%",
                height: "400px",
                overflow: "hidden",
                marginBottom: "30px",
                background: "var(--input-bg)",
              }}
            >
              <img
                src={article.imageUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => {
                  (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* League badge + date */}
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-block",
                padding: "5px 14px",
                background: leagueColor,
                color: "var(--black)",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              {leagueLabel}
            </span>
            <span style={{ color: "var(--text-faint)", fontSize: "13px", fontFamily: "var(--font-roboto-mono), monospace" }}>
              {formatDate(article.pubDate)}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "clamp(28px, 5vw, 48px)",
              lineHeight: "1.2",
              marginBottom: "25px",
            }}
          >
            {article.title}
          </h1>

          {/* Source */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "30px" }}>
            <span style={{ color: "var(--text-faint)", fontSize: "14px" }}>via</span>
            <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>{article.source}</span>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--border-color)", marginBottom: "30px" }} />

          {/* Article content */}
          <div style={{ marginBottom: "40px" }}>
            {(article.content || article.description).split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "17px",
                  lineHeight: "1.8",
                  marginBottom: "20px",
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Read full article button */}
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              padding: "18px",
              background: "var(--orange)",
              color: "var(--black)",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "16px",
              letterSpacing: "1px",
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            READ FULL ARTICLE AT {article.source.toUpperCase()} &rarr;
          </a>

          {/* Bottom back link */}
          <div style={{ textAlign: "center", marginTop: "40px", paddingBottom: "40px" }}>
            <Link
              href="/news"
              style={{
                color: "var(--text-faint)",
                textDecoration: "none",
                fontSize: "14px",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "var(--orange)")}
              onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
            >
              &larr; Back to News
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
