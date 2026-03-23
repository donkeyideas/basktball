import Link from "next/link";
import Image from "next/image";

const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.basktball.app";
const APP_STORE_URL = "https://apps.apple.com/us/app/basktball/id6760516741";

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
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/live" className="btn btn-primary">
            LIVE SCORES
          </Link>
          <Link href="/tools" className="btn btn-secondary">
            EXPLORE TOOLS
          </Link>
        </div>
        {/* App Download Badges */}
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          marginTop: "30px",
          alignItems: "center",
        }}>
          {GOOGLE_PLAY_URL && (
            <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" style={{ transition: "transform 0.2s" }}>
              <Image src="/images/google-play-badge.svg" alt="Get it on Google Play" width={150} height={45} loading="eager" />
            </a>
          )}
          {APP_STORE_URL && (
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ transition: "transform 0.2s" }}>
              <Image src="/images/app-store-badge.svg" alt="Download on the App Store" width={150} height={45} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;
