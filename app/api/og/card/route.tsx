import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import type { ReactElement } from "react";

// Edge runtime — Vercel's documented pattern for @vercel/og. Fonts are loaded
// via fetch(new URL('./_fonts/X.ttf', import.meta.url)) which resolves to a
// static asset URL at build time. Most reliable approach in Vercel serverless.
export const runtime = "edge";

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

// Fonts are loaded via fetch(new URL(...)) — Edge runtime bundles them as
// static assets at build time. This is @vercel/og's documented pattern.
async function loadAdjacentFont(filename: string): Promise<ArrayBuffer> {
  const url = new URL(`./_fonts/${filename}`, import.meta.url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font ${filename} failed (${res.status})`);
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
    const avatarUrlRaw = searchParams.get("avatarUrl") || "";
    // Only accept https URLs from a few trusted CDNs/hosts so we don't fetch arbitrary content.
    // Supabase project domains all look like https://<project>.supabase.co/storage/...
    const avatarUrl = /^https:\/\/([a-z0-9-]+\.supabase\.co\/storage\/|res\.cloudinary\.com\/|lh3\.googleusercontent\.com\/|pbs\.twimg\.com\/|avatars\.githubusercontent\.com\/|cdn\.basktball\.com\/|graph\.facebook\.com\/)/.test(avatarUrlRaw)
      ? avatarUrlRaw
      : "";
    const brand = (searchParams.get("brand") || "BASKTBALL.COM").toUpperCase();

    const p = paletteFor(theme);

    const [bebas, archivo500, archivo700, archivo800, jbMono400, jbMono700] = await Promise.all([
      loadAdjacentFont("BebasNeue-Regular.ttf"),
      loadAdjacentFont("Archivo-500.ttf"),
      loadAdjacentFont("Archivo-700.ttf"),
      loadAdjacentFont("Archivo-800.ttf"),
      loadAdjacentFont("JetBrainsMono-400.ttf"),
      loadAdjacentFont("JetBrainsMono-700.ttf"),
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
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              width={84}
              height={84}
              style={{
                width: 84,
                height: 84,
                borderRadius: 9999,
                border: `3px solid ${p.fg}`,
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 9999,
                background: `linear-gradient(135deg, ${p.fg}, ${theme === "orange" ? "rgba(0,0,0,0.7)" : "rgba(255,94,26,0.9)"})`,
                border: `3px solid ${p.fg}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Bebas Neue",
                fontSize: 38,
                color: theme === "orange" ? p.bg : COLORS.white,
                letterSpacing: 1,
              }}
            >
              {avatar}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 22,
                letterSpacing: 3,
                color: p.fg,
                opacity: 0.65,
                textTransform: "uppercase",
              }}
            >
              SHARED BY
            </div>
            <div
              style={{
                fontFamily: "Archivo",
                fontWeight: 800,
                fontSize: 40,
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
              fontSize: 22,
              letterSpacing: 3,
              color: p.fg,
              opacity: 0.65,
              textTransform: "uppercase",
            }}
          >
            POWERED BY
          </div>
          <div
            style={{
              fontFamily: "Bebas Neue",
              fontSize: 44,
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
                  fontSize: 460,
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
                  fontSize: 460,
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
            fontSize: 56,
            letterSpacing: 6,
            color: p.fg,
            opacity: 0.75,
            marginTop: 6,
          }}
        >
          {label}
        </div>
      </div>
    );

    // Adaptive sizing — long content shouldn't blow past the footer.
    const fitHeadline = (s: string) => {
      const len = s.length;
      if (len <= 18) return 200;
      if (len <= 30) return 160;
      if (len <= 50) return 130;
      if (len <= 75) return 100;
      return 80;
    };
    const fitContext = (s: string, hasHeadline: boolean) => {
      const len = s.length;
      // When paired with a big headline, leave more room and shrink the context.
      if (hasHeadline) {
        if (len <= 80) return 44;
        if (len <= 140) return 38;
        return 32;
      }
      // Stat Line — no competing headline, context can be larger.
      if (len <= 90) return 60;
      if (len <= 160) return 50;
      return 42;
    };

    const Context = ({ text, withHeadline = false }: { text: string; withHeadline?: boolean }) => {
      const size = fitContext(text, withHeadline);
      return (
        <div
          style={{
            fontFamily: "Archivo",
            fontWeight: 700,
            fontSize: size,
            lineHeight: 1.25,
            color: p.fg,
            marginTop: withHeadline ? 28 : 40,
            maxWidth: 820,
            letterSpacing: -0.5,
          }}
        >
          {text}
        </div>
      );
    };

    const Headline = ({ text }: { text: string }) => (
      <div
        style={{
          fontFamily: "Bebas Neue",
          fontSize: fitHeadline(text),
          lineHeight: 0.92,
          letterSpacing: -2,
          color: p.fg,
          marginTop: 24,
          display: "flex",
        }}
      >
        {text}
      </div>
    );

    let Body: ReactElement;

    if (template === "comparison") {
      const [left, right] = headline.split("|");
      const leftText = (left || "PLAYER A").toUpperCase().trim();
      const rightText = (right || "PLAYER B").toUpperCase().trim();
      const nameSize = Math.max(leftText.length, rightText.length) <= 8 ? 180 : 140;
      Body = (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 20 }}>
          <div
            style={{
              fontFamily: "Bebas Neue",
              fontSize: nameSize,
              lineHeight: 1,
              letterSpacing: -3,
              color: p.fg,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex" }}>{leftText}</div>
            <div
              style={{
                display: "flex",
                fontSize: nameSize * 0.5,
                color: p.accent,
                margin: "8px 0",
                letterSpacing: 6,
              }}
            >
              VS
            </div>
            <div style={{ display: "flex" }}>{rightText}</div>
          </div>
          {context && <Context text={context} withHeadline />}
        </div>
      );
    } else if (template === "hot-take") {
      Body = (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Headline text={headline || "ADD YOUR HOT TAKE"} />
          {context && <Context text={context} withHeadline />}
        </div>
      );
    } else if (template === "quote") {
      const quoteText = headline || "ADD A QUOTE";
      const qlen = quoteText.length;
      const quoteSize = qlen <= 40 ? 92 : qlen <= 80 ? 72 : 56;
      Body = (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
          <div
            style={{
              fontFamily: "Bebas Neue",
              fontSize: 260,
              lineHeight: 0.7,
              color: p.accent,
              opacity: 0.9,
              display: "flex",
              marginBottom: -36,
            }}
          >
            “
          </div>
          <div
            style={{
              fontFamily: "Archivo",
              fontWeight: 800,
              fontStyle: "italic",
              fontSize: quoteSize,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: p.fg,
              display: "flex",
              paddingLeft: 28,
              maxWidth: 860,
            }}
          >
            {quoteText}
          </div>
          {context && <Context text={context} withHeadline />}
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              position: "relative",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            {Body}
            {meta && (
              <div
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 34,
                  letterSpacing: 2,
                  color: p.fg,
                  opacity: 0.6,
                  marginTop: "auto",
                  paddingBottom: 12,
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
