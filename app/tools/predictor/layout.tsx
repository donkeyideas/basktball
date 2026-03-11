import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Predictor",
  description:
    "AI-powered NBA game predictions. Win probability, projected scores, key matchup analysis, and data-driven game outcome forecasts.",
  keywords: [
    "game predictor",
    "NBA predictions",
    "win probability",
    "score prediction",
    "basketball forecast",
    "AI predictions",
  ],
  openGraph: {
    title: "Game Predictor | BASKTBALL",
    description:
      "AI-powered NBA game predictions with win probability and projected scores.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NBA Game Predictor",
  description:
    "AI-powered game predictions with win probability, projected scores, and key matchup analysis.",
  url: "https://basktball.com/tools/predictor",
  applicationCategory: "SportsApplication",
  isPartOf: { "@type": "WebSite", name: "BASKTBALL", url: "https://basktball.com" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
