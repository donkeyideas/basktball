import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import type { ReactElement } from "react";

// Node runtime. Fonts ship in /public/fonts/ and we fetch them via HTTP from the
// request origin — Vercel doesn't bundle the public/ folder into serverless
// function filesystems, so fs.readFile fails in prod even though files exist.
export const runtime = "nodejs";

type Theme = "light" | "dark" | "orange";
type Template = "stat-line" | "comparison" | "hot-take" | "quote" | "ranking";

const COLORS = {
  black: "#0a0a0a",
  ink: "#141414",
  orange: "#ff5e1a",
  orangeDeep: "#e54a0a",
  white: "#ffffff",
  cream: "#f5f1ea",
};

function paletteFor(theme: Theme) {
  switch (theme) {
    case "dark":
      return { bg: COLORS.black, fg: COLORS.white, accent: COLORS.orange, mute: "rgba(255,255,255,0.55)", border: "rgba(255,255,255,0.15)" };
    case "orange":
      return { bg: COLORS.orange, fg: COLORS.black, accent: COLORS.black, mute: "rgba(0,0,0,0.6)", border: "rgba(0,0,0,0.2)" };
    default:
      return { bg: COLORS.cream, fg: COLORS.black, accent: COLORS.orange, mute: "rgba(10,10,10,0.55)", border: "rgba(0,0,0,0.15)" };
  }
}

async function loadFont(origin: string, filename: string): Promise<ArrayBuffer> {
  const res = await fetch(`${origin}/fonts/${filename}`);
  if (!res.ok) throw new Error(`Font fetch failed (${res.status}) for ${filename}`);
  return await res.arrayBuffer();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const theme = (searchParams.get("theme") || "light") as Theme;
    const template = (searchParams.get("template") || "stat-line") as Template;
    const tag = searchParams.get("tag") || template.replace("-", " ").toUpperCase();
    const num = searchParams.get("num") || "";
    const unit = searchParams.get("unit") || "";
    const headline = searchParams.get("headline") || "";
    const context = searchParams.get("context") || "";
    const meta = searchParams.get("meta") || "";
    const handle = searchParams.get("handle") || "basktball";
    const avatar = (searchParams.get("avatar") || handle.slice(0, 2)).toUpperCase().slice(0, 2);
    const brand = (searchParams.get("brand") || "BASKTBALL.APP").toUpperCase();

    const p = paletteFor(theme);

    const origin = new URL(req.url).origin;
    const [bebas, archivo500, archivo700, archivo800, jbMono400, jbMono700] = await Promise.all([
      loadFont(origin, "BebasNeue-Regular.ttf"),
      loadFont(origin, "Archivo-500.ttf"),
      loadFont(origin, "Archivo-700.ttf"),
      loadFont(origin, "Archivo-800.ttf"),
      loadFont(origin, "JetBrainsMono-400.ttf"),
      loadFont(origin, "JetBrainsMono-700.ttf"),
    ]);

    const Decoration = () => (
      <>
        <div
          style={{
            position: "absolute",
            bottom: -160,
            right: -160,
            width: 720,
            height: 720,
            borderRadius: 9999,
            border: `4px solid ${p.fg}`,
            opacity: 0.08,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: 9999,
            border: `4px solid ${p.fg}`,
            opacity: 0.08,
          }}
        />
      </>
    );

    const Header = () => (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontFamily: "Bebas Neue",
            fontSize: 38,
            letterSpacing: 5,
            color: p.fg,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              background: p.accent,
              borderRadius: 9999,
              marginRight: 14,
            }}
          />
          BASKTBALL
        </div>
        <div
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: 18,
            letterSpacing: 4,
            color: p.fg,
            opacity: 0.7,
            border: `2px solid ${p.fg}`,
            padding: "6px 14px",
            borderRadius: 5,
          }}
        >
          {tag}
        </div>
      </div>
    );

    const Attribution = () => (
      <div
        style={{
          marginTop: "auto",
          paddingTop: 26,
          borderTop: `2px solid ${p.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 9999,
              background: `linear-gradient(135deg, ${p.fg}, ${theme === "orange" ? "rgba(0,0,0,0.7)" : "rgba(255,94,26,0.9)"})`,
              border: `3px solid ${p.fg}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Bebas Neue",
              fontSize: 28,
              color: theme === "orange" ? p.bg : COLORS.white,
              letterSpacing: 1,
            }}
          >
            {avatar}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 16,
                letterSpacing: 3,
                color: p.fg,
                opacity: 0.6,
                textTransform: "uppercase",
              }}
            >
              SHARED BY
            </div>
            <div
              style={{
                fontFamily: "Archivo",
                fontWeight: 800,
                fontSize: 28,
                color: p.fg,
                marginTop: 4,
                letterSpacing: -0.5,
              }}
            >
              {`@${handle}`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: 16,
              letterSpacing: 3,
              color: p.fg,
              opacity: 0.6,
              textTransform: "uppercase",
            }}
          >
            POWERED BY
          </div>
          <div
            style={{
              fontFamily: "Bebas Neue",
              fontSize: 30,
              letterSpacing: 4,
              color: p.fg,
              marginTop: 4,
            }}
          >
            {brand}
          </div>
        </div>
      </div>
    );

    const BigNumber = ({ value, label }: { value: string; label: string }) => (
      <div style={{ display: "flex", flexDirection: "column", marginTop: 48 }}>
        <div
          style={
            theme === "light"
              ? {
                  fontFamily: "Bebas Neue",
                  fontSize: 280,
                  lineHeight: 0.85,
                  letterSpacing: -4,
                  color: "transparent",
                  backgroundImage: `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.orangeDeep})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  display: "flex",
                }
              : {
                  fontFamily: "Bebas Neue",
                  fontSize: 280,
                  lineHeight: 0.85,
                  letterSpacing: -4,
                  color: p.fg,
                  display: "flex",
                }
          }
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: "Bebas Neue",
            fontSize: 36,
            letterSpacing: 5,
            color: p.fg,
            opacity: 0.7,
            marginTop: 4,
          }}
        >
          {label}
        </div>
      </div>
    );

    const Context = ({ text }: { text: string }) => (
      <div
        style={{
          fontFamily: "Archivo",
          fontWeight: 500,
          fontSize: 26,
          lineHeight: 1.35,
          color: p.fg,
          marginTop: 28,
          maxWidth: 800,
        }}
      >
        {text}
      </div>
    );

    const Headline = ({ text }: { text: string }) => (
      <div
        style={{
          fontFamily: "Bebas Neue",
          fontSize: 120,
          lineHeight: 0.95,
          letterSpacing: -1,
          color: p.fg,
          marginTop: 28,
          display: "flex",
        }}
      >
        {text}
      </div>
    );

    let Body: ReactElement;

    if (template === "comparison") {
      const [left, right] = headline.split("|");
      Body = (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
          <div
            style={{
              fontFamily: "Bebas Neue",
              fontSize: 130,
              lineHeight: 1,
              letterSpacing: -2,
              color: p.fg,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex" }}>{(left || "PLAYER A").toUpperCase()}</div>
            <div
              style={{
                display: "flex",
                fontSize: 60,
                color: p.accent,
                margin: "8px 0",
                letterSpacing: 4,
              }}
            >
              VS
            </div>
            <div style={{ display: "flex" }}>{(right || "PLAYER B").toUpperCase()}</div>
          </div>
          {context && <Context text={context} />}
        </div>
      );
    } else if (template === "hot-take" || template === "quote") {
      Body = (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Headline text={headline || "HOT TAKE"} />
          {context && <Context text={context} />}
        </div>
      );
    } else if (template === "ranking") {
      const items = (headline || "").split("|").slice(0, 5);
      Body = (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 20,
                paddingTop: 14,
                paddingBottom: 14,
                borderBottom: `1px solid ${p.border}`,
              }}
            >
              <div
                style={{
                  fontFamily: "Bebas Neue",
                  fontSize: 56,
                  color: p.accent,
                  width: 60,
                  display: "flex",
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontFamily: "Archivo",
                  fontWeight: 700,
                  fontSize: 30,
                  color: p.fg,
                  display: "flex",
                  flex: 1,
                }}
              >
                {item.trim()}
              </div>
            </div>
          ))}
          {context && <Context text={context} />}
        </div>
      );
    } else {
      Body = (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {num && <BigNumber value={num} label={unit} />}
          {context && <Context text={context} />}
        </div>
      );
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: p.bg,
            padding: 60,
            position: "relative",
            fontFamily: "Archivo",
          }}
        >
          <Decoration />
          <Header />
          <div style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative" }}>
            {Body}
            {meta && (
              <div
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 18,
                  letterSpacing: 2,
                  color: p.fg,
                  opacity: 0.55,
                  marginTop: 24,
                  textTransform: "uppercase",
                }}
              >
                {meta}
              </div>
            )}
          </div>
          <Attribution />
        </div>
      ),
      {
        width: 1024,
        height: 1280,
        fonts: [
          { name: "Bebas Neue", data: bebas, weight: 400, style: "normal" },
          { name: "Archivo", data: archivo500, weight: 500, style: "normal" },
          { name: "Archivo", data: archivo700, weight: 700, style: "normal" },
          { name: "Archivo", data: archivo800, weight: 800, style: "normal" },
          { name: "JetBrains Mono", data: jbMono400, weight: 400, style: "normal" },
          { name: "JetBrains Mono", data: jbMono700, weight: 700, style: "normal" },
        ],
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.error("OG card error:", err);
    return new Response("Failed to generate card", { status: 500 });
  }
}
