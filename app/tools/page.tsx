import Link from "next/link";
import { Header, Footer, ToolsGrid, FAQ } from "@/components";

const TOOLS_FAQ = [
  {
    question: "What analytics tools does BASKTBALL offer?",
    answer: "BASKTBALL offers six free basketball analytics tools: Player Comparison for head-to-head stat breakdowns, Advanced Metrics for PER, TS%, and VORP analysis, an AI-powered Game Predictor, Fantasy Optimizer for lineup recommendations, Team Analytics for performance trends, and a Draft Board for prospect evaluation.",
  },
  {
    question: "How do player comparisons work?",
    answer: "The Player Comparison tool lets you select any two NBA, WNBA, or NCAA players and compares them across every statistical category including points, rebounds, assists, shooting percentages, and advanced metrics. Data is pulled from live sources and updated throughout the season.",
  },
  {
    question: "Is the game predictor AI-powered?",
    answer: "Yes, the Game Predictor uses AI-powered analysis combining historical matchup data, current team form, home/away records, and player availability to generate win probability predictions for upcoming games.",
  },
  {
    question: "Are the analytics tools free to use?",
    answer: "Yes, all BASKTBALL analytics tools are completely free to use with no signup required. This includes player comparisons, advanced metrics, game predictions, fantasy optimization, team analytics, and draft analysis.",
  },
];

export default function ToolsPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Page Header */}
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h1 style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "48px",
              marginBottom: "20px"
            }}>
              ANALYTICS TOOLS
              <span style={{
                display: "block",
                width: "100px",
                height: "4px",
                background: "var(--orange)",
                margin: "15px auto 0"
              }}></span>
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "18px",
              maxWidth: "600px",
              margin: "0 auto"
            }}>
              Powerful basketball analytics tools to help you dominate the data.
              From shot charts to fantasy optimization.
            </p>
          </div>

          {/* Tools Grid */}
          <ToolsGrid />

          {/* CTA Section */}
          <div style={{
            textAlign: "center",
            margin: "60px auto 0",
            maxWidth: "600px",
          }}>
            <p style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "16px",
              marginBottom: "20px",
            }}>
              All tools are completely free — no signup required.
            </p>
            <Link
              href="/tools/compare"
              className="btn btn-primary"
              style={{ fontSize: "16px", padding: "14px 32px" }}
            >
              Start Comparing Players Now
            </Link>
          </div>

          {/* FAQ */}
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
            <FAQ items={TOOLS_FAQ} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
