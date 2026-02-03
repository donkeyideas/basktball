import Link from "next/link";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg"></div>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1>
          DOMINATE
          <span>THE DATA</span>
        </h1>
        <p>
          Real-time basketball analytics, AI-powered insights, and comprehensive stats
          for every league. From the NBA to international courts.
        </p>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
          <Link href="/live" className="btn btn-primary">
            LIVE SCORES
          </Link>
          <Link href="/tools" className="btn btn-secondary">
            EXPLORE TOOLS
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;
