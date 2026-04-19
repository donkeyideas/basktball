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

        {/* Social Proof Section */}
        <section style={{ maxWidth: "1200px", margin: "60px auto 0", padding: "0 20px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
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
