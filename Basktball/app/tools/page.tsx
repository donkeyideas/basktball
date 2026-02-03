import { Header, Footer, ToolsGrid } from "@/components";

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
        </div>
      </main>
      <Footer />
    </>
  );
}
