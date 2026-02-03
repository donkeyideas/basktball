import Link from "next/link";

const tools = [
  {
    id: 1,
    title: "Shot Chart Analyzer",
    description: "Visualize shooting patterns and identify hot zones with AI-powered analysis.",
    tags: ["AI-POWERED", "VISUAL"],
    href: "/tools/shot-chart",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "Player Comparison",
    description: "Compare any two players across every statistical category with detailed breakdowns.",
    tags: ["COMPARE", "STATS"],
    href: "/tools/compare",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="18" />
        <rect x="14" y="3" width="7" height="18" />
      </svg>
    ),
  },
  {
    id: 3,
    title: "Advanced Metrics",
    description: "Deep dive into PER, TS%, VORP, and other advanced basketball analytics.",
    tags: ["ADVANCED", "ANALYTICS"],
    href: "/tools/metrics",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-5" />
      </svg>
    ),
  },
  {
    id: 4,
    title: "Game Predictor",
    description: "AI-powered game predictions using historical data and current form analysis.",
    tags: ["AI", "PREDICTIONS"],
    href: "/tools/predictor",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    id: 5,
    title: "Fantasy Optimizer",
    description: "Maximize your fantasy lineup with smart player recommendations.",
    tags: ["FANTASY", "OPTIMIZE"],
    href: "/tools/fantasy",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 6,
    title: "Team Analytics",
    description: "Comprehensive team performance analysis including pace, efficiency, and trends.",
    tags: ["TEAM", "TRENDS"],
    href: "/tools/team-analytics",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 7,
    title: "Betting Insights",
    description: "Data-driven insights for spreads, totals, and props with historical accuracy.",
    tags: ["BETTING", "DATA"],
    href: "/tools/betting",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 8,
    title: "Draft Analyzer",
    description: "Historical draft data and prospect analysis for upcoming drafts.",
    tags: ["DRAFT", "PROSPECTS"],
    href: "/tools/draft",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    id: 9,
    title: "Historical Database",
    description: "Access decades of basketball history with searchable stats and records.",
    tags: ["HISTORY", "DATABASE"],
    href: "/tools/history",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
];

export function ToolsGrid() {
  return (
    <section className="tools-section">
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-anton), Anton, sans-serif",
          fontSize: "48px",
          marginBottom: "50px",
          textAlign: "center",
          position: "relative",
          display: "inline-block",
          width: "100%"
        }}>
          POWERFUL TOOLS
          <span style={{
            display: "block",
            width: "100px",
            height: "4px",
            background: "var(--orange)",
            margin: "10px auto 0"
          }}></span>
        </h2>
        <div className="tools-grid">
          {tools.map((tool) => (
            <Link key={tool.id} href={tool.href} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="tool-card">
                <div className="tool-number">
                  {String(tool.id).padStart(2, "0")}
                </div>
                <div className="tool-icon">{tool.icon}</div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <div className="tool-tags">
                  {tool.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ToolsGrid;
