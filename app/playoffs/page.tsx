import { Header, Footer } from "@/components";

export const metadata = {
  title: "Playoffs | BASKTBALL",
  description:
    "Follow the 2026 NBA Playoffs with live bracket updates, series results, and playoff analytics on BASKTBALL.",
};

export default function PlayoffsPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "60px 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>

          {/* Page Title */}
          <h1
            style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "56px",
              marginBottom: "10px",
              color: "var(--white)",
              letterSpacing: "4px",
            }}
          >
            PLAYOFFS
            <span
              style={{
                display: "block",
                width: "120px",
                height: "4px",
                background: "var(--orange)",
                margin: "15px auto 0",
              }}
            />
          </h1>

          {/* Bracket Visual */}
          <div
            style={{
              margin: "60px auto",
              maxWidth: "600px",
              position: "relative",
            }}
          >
            {/* Basketball Court Outline */}
            <svg
              viewBox="0 0 600 360"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%", height: "auto", opacity: 0.12 }}
            >
              {/* Court outline */}
              <rect
                x="2"
                y="2"
                width="596"
                height="356"
                rx="4"
                stroke="var(--orange)"
                strokeWidth="2"
              />
              {/* Center line */}
              <line
                x1="300"
                y1="2"
                x2="300"
                y2="358"
                stroke="var(--orange)"
                strokeWidth="2"
              />
              {/* Center circle */}
              <circle
                cx="300"
                cy="180"
                r="60"
                stroke="var(--orange)"
                strokeWidth="2"
              />
              {/* Left three-point arc */}
              <path
                d="M 2 80 Q 180 180 2 280"
                stroke="var(--orange)"
                strokeWidth="2"
              />
              {/* Right three-point arc */}
              <path
                d="M 598 80 Q 420 180 598 280"
                stroke="var(--orange)"
                strokeWidth="2"
              />
              {/* Left key */}
              <rect
                x="2"
                y="110"
                width="130"
                height="140"
                stroke="var(--orange)"
                strokeWidth="2"
              />
              {/* Right key */}
              <rect
                x="468"
                y="110"
                width="130"
                height="140"
                stroke="var(--orange)"
                strokeWidth="2"
              />
              {/* Left free-throw circle */}
              <circle
                cx="132"
                cy="180"
                r="45"
                stroke="var(--orange)"
                strokeWidth="2"
                strokeDasharray="8 6"
              />
              {/* Right free-throw circle */}
              <circle
                cx="468"
                cy="180"
                r="45"
                stroke="var(--orange)"
                strokeWidth="2"
                strokeDasharray="8 6"
              />
              {/* Left basket */}
              <circle
                cx="22"
                cy="180"
                r="10"
                stroke="var(--orange)"
                strokeWidth="2"
              />
              {/* Right basket */}
              <circle
                cx="578"
                cy="180"
                r="10"
                stroke="var(--orange)"
                strokeWidth="2"
              />
            </svg>

            {/* Overlay Message */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "28px",
                  color: "var(--white)",
                  lineHeight: "1.4",
                  letterSpacing: "2px",
                }}
              >
                2026 NBA PLAYOFFS
              </div>
              <div
                style={{
                  fontFamily: "var(--font-roboto-mono), monospace",
                  fontSize: "14px",
                  color: "var(--orange)",
                  marginTop: "8px",
                  letterSpacing: "1px",
                }}
              >
                BEGIN IN APRIL
              </div>
            </div>
          </div>

          {/* Bracket Outline Preview */}
          <div
            style={{
              margin: "0 auto 60px",
              maxWidth: "500px",
              padding: "30px",
              background: "var(--dark-gray)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <svg
              viewBox="0 0 500 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%", height: "auto" }}
            >
              {/* Left side - Round 1 */}
              <rect x="10" y="10" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <rect x="10" y="40" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <rect x="10" y="80" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <rect x="10" y="110" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <rect x="10" y="150" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <rect x="10" y="180" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <rect x="10" y="210" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

              {/* Left side - Round 2 */}
              <rect x="120" y="25" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <rect x="120" y="95" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <rect x="120" y="165" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

              {/* Left connectors */}
              <line x1="90" y1="20" x2="120" y2="35" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="90" y1="50" x2="120" y2="35" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="90" y1="90" x2="120" y2="105" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="90" y1="120" x2="120" y2="105" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="90" y1="160" x2="120" y2="175" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="90" y1="190" x2="120" y2="175" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

              {/* Conference Finals */}
              <rect x="230" y="60" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1="200" y1="35" x2="230" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <line x1="200" y1="105" x2="230" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

              {/* Finals */}
              <rect x="340" y="105" width="100" height="30" rx="3" stroke="var(--orange)" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x="390" y="125" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">FINALS</text>
              <line x1="310" y1="70" x2="340" y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

              {/* Right side hint */}
              <rect x="340" y="165" width="80" height="20" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1="420" y1="175" x2="440" y2="135" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

              {/* Trophy icon */}
              <text x="470" y="125" textAnchor="middle" fill="var(--orange)" fontSize="22" style={{ opacity: 0.3 }}>&#127942;</text>
            </svg>
          </div>

          {/* Info Text */}
          <p
            style={{
              fontFamily: "var(--font-roboto-mono), monospace",
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              lineHeight: "1.8",
              maxWidth: "550px",
              margin: "0 auto",
              letterSpacing: "0.5px",
            }}
          >
            Check back during the postseason for live bracket updates,
            series results, and playoff analytics.
          </p>

          {/* Countdown Bars */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginTop: "50px",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "FIRST ROUND", month: "APR" },
              { label: "CONF SEMIS", month: "MAY" },
              { label: "CONF FINALS", month: "MAY" },
              { label: "NBA FINALS", month: "JUN" },
            ].map((round) => (
              <div
                key={round.label}
                style={{
                  background: "var(--dark-gray)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "16px 24px",
                  textAlign: "center",
                  minWidth: "140px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "13px",
                    letterSpacing: "2px",
                    color: "var(--white)",
                    marginBottom: "6px",
                  }}
                >
                  {round.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-roboto-mono), monospace",
                    fontSize: "12px",
                    color: "var(--orange)",
                  }}
                >
                  {round.month} 2026
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
