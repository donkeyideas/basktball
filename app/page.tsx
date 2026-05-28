"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Header,
  Footer,
  Hero,
  LeagueSelector,
  LiveScores,
  FeaturedPlayers,
  ToolsGrid,
  LatestNews,
  FAQ,
} from "@/components";

const HOME_FAQ = [
  {
    question: "What is BASKTBALL?",
    answer: "BASKTBALL is a real-time basketball analytics platform providing live scores, player stats, team standings, and advanced analytics for the NBA, WNBA, NCAA, and international basketball leagues.",
  },
  {
    question: "What basketball leagues does BASKTBALL cover?",
    answer: "BASKTBALL covers the NBA, WNBA, NCAA Men's and Women's basketball, EuroLeague, and other international basketball leagues with live scores, standings, and player statistics.",
  },
  {
    question: "How often are live scores updated?",
    answer: "Live scores are updated in near real-time during active games, with data refreshed every 15-30 seconds from official sources including ESPN and the NBA's data feeds.",
  },
  {
    question: "Are the stats and analytics free to use?",
    answer: "Yes, all core features including live scores, player stats, team standings, and stat leaders are completely free. Advanced tools like player comparisons, shot charts, and game predictions are also available at no cost.",
  },
];

type League = "nba" | "wnba" | "ncaam" | "ncaaw" | "euro" | "intl";

export default function HomePage() {
  const [selectedLeague, setSelectedLeague] = useState<League>("nba");

  return (
    <>
      {/* Organization entity reference for AEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "BASKTBALL - Dominate The Data",
            description: "Real-time basketball stats, analytics, and insights for NBA, WNBA, NCAA, and international leagues.",
            url: "https://basktball.com",
            isPartOf: { "@id": "https://basktball.com/#website" },
            about: { "@id": "https://basktball.com/#organization" },
            speakable: {
              "@type": "SpeakableSpecification",
              cssSelector: [".hero-content p", ".section-title"],
            },
          }),
        }}
      />
      <Header />
      <main>
        <Hero />
        <LeagueSelector
          defaultLeague={selectedLeague}
          onLeagueChange={(league) => setSelectedLeague(league as League)}
        />
        <LiveScores league={selectedLeague} />
        <FeaturedPlayers />
        <LatestNews />
        {process.env.NEXT_PUBLIC_SHOW_WIP_PAGES && <ToolsGrid />}

        {/* New Features Section */}
        <section style={{ maxWidth: "1200px", margin: "60px auto 0", padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              border: "1px solid var(--orange)",
              color: "var(--orange)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "12px",
              letterSpacing: "2px",
              marginBottom: "16px",
              borderRadius: "4px",
            }}>
              NEW
            </div>
            <h2 style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "40px",
              marginBottom: "12px",
            }}>
              TWO NEW WAYS TO FLEX
            </h2>
            <p style={{
              color: "var(--text-muted)",
              fontSize: "16px",
              maxWidth: "600px",
              margin: "0 auto",
            }}>
              Ask any basketball question in plain English. Turn any stat into a shareable card.
            </p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}>
            {/* The Lab card */}
            <Link href="/cards?tab=lab" style={{
              display: "block",
              padding: "32px 28px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.2s ease",
            }}>
              <div style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "12px",
                letterSpacing: "2.5px",
                color: "var(--orange)",
                marginBottom: "12px",
              }}>
                STAT LAB · AI POWERED
              </div>
              <div style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "28px",
                letterSpacing: "1px",
                marginBottom: "10px",
              }}>
                ASK THE LAB
              </div>
              <div style={{
                color: "var(--text-muted)",
                fontSize: "15px",
                lineHeight: 1.55,
                marginBottom: "16px",
              }}>
                Plain-English stat queries. &ldquo;Show me every Jokic 10-assist game vs a top-10 defense.&rdquo; Get every matching box score.
              </div>
              <div style={{
                color: "var(--orange)",
                fontFamily: "var(--font-inter)",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "1px",
              }}>
                EXPLORE THE LAB ›
              </div>
            </Link>

            {/* Take Cards card */}
            <Link href="/cards" style={{
              display: "block",
              padding: "32px 28px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.2s ease",
            }}>
              <div style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "12px",
                letterSpacing: "2.5px",
                color: "var(--orange)",
                marginBottom: "12px",
              }}>
                SHARE ENGINE · 5 TEMPLATES
              </div>
              <div style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "28px",
                letterSpacing: "1px",
                marginBottom: "10px",
              }}>
                TAKE CARDS
              </div>
              <div style={{
                color: "var(--text-muted)",
                fontSize: "15px",
                lineHeight: 1.55,
                marginBottom: "16px",
              }}>
                Turn any stat into a shareable card. Five templates, three themes, AI-drafted captions. Post to X, Instagram, Facebook, or Reddit.
              </div>
              <div style={{
                color: "var(--orange)",
                fontFamily: "var(--font-inter)",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "1px",
              }}>
                START A CARD ›
              </div>
            </Link>
          </div>
        </section>

        {/* Social Proof Section */}
        <section style={{ maxWidth: "1200px", margin: "60px auto 0", padding: "0 20px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            textAlign: "center",
          }}>
            <div style={{
              padding: "32px 20px",
              background: "var(--input-bg)",
              border: "1px solid var(--border-subtle)",
            }}>
              <div style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "36px",
                color: "var(--orange)",
                marginBottom: "8px",
              }}>
                5,000+
              </div>
              <div style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                Basketball Fans
              </div>
            </div>
            <div style={{
              padding: "32px 20px",
              background: "var(--input-bg)",
              border: "1px solid var(--border-subtle)",
            }}>
              <div style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "36px",
                color: "var(--orange)",
                marginBottom: "8px",
              }}>
                30+
              </div>
              <div style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                NBA Teams Tracked Live
              </div>
            </div>
            <div style={{
              padding: "32px 20px",
              background: "var(--input-bg)",
              border: "1px solid var(--border-subtle)",
            }}>
              <div style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "36px",
                color: "var(--orange)",
                marginBottom: "8px",
              }}>
                1,000+
              </div>
              <div style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                Takes Shared on The Court
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Link
              href="/court"
              style={{
                color: "var(--orange)",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "1px",
              }}
            >
              JOIN THE COMMUNITY &rarr;
            </Link>
          </div>
        </section>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <FAQ items={HOME_FAQ} />
        </div>
      </main>
      <Footer />
    </>
  );
}
