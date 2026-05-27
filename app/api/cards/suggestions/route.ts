import { NextRequest, NextResponse } from "next/server";
import { statsCache, CacheTTL } from "@/lib/cache/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type League = "nba" | "wnba" | "ncaam" | "ncaaw";

type EspnArticle = {
  id: string | number;
  headline?: string;
  description?: string;
  published?: string;
  type?: string;
  images?: Array<{ url?: string }>;
};

export type CardSuggestion = {
  id: string;
  league: League;
  leagueLabel: string;
  template: "hot-take" | "stat-line";
  theme: "light" | "dark" | "orange";
  tag: string;
  seed: {
    template: string;
    theme: string;
    tag: string;
    headline?: string;
    context?: string;
    meta?: string;
    num?: string;
    unit?: string;
  };
  source: {
    headline: string;
    description: string;
    publishedAt: string;
  };
};

// ─── ESPN news fetch ─────────────────────────────────────────────────────────

const LEAGUE_MAP: Array<{ id: League; label: string; espn: string }> = [
  { id: "nba", label: "NBA", espn: "nba" },
  { id: "wnba", label: "WNBA", espn: "wnba" },
  { id: "ncaam", label: "NCAA M", espn: "mens-college-basketball" },
  { id: "ncaaw", label: "NCAA W", espn: "womens-college-basketball" },
];

async function fetchLeagueNews(espnLeague: string, limit = 5): Promise<EspnArticle[]> {
  const url = `https://site.web.api.espn.com/apis/site/v2/sports/basketball/${espnLeague}/news?limit=${limit}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const d = await res.json();
    return Array.isArray(d.articles) ? d.articles : [];
  } catch (err) {
    console.error(`ESPN news fetch failed for ${espnLeague}:`, err);
    return [];
  }
}

// ─── Transform article → card seed ───────────────────────────────────────────

function truncate(s: string, n: number) {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

function pickTheme(i: number): "light" | "dark" | "orange" {
  return (["orange", "dark", "light"] as const)[i % 3];
}

function articleToSuggestion(
  article: EspnArticle,
  leagueId: League,
  leagueLabel: string,
  index: number,
): CardSuggestion | null {
  const rawHeadline = (article.headline || "").trim();
  if (!rawHeadline) return null;

  const headline = truncate(rawHeadline.toUpperCase(), 90);
  const description = truncate((article.description || "").trim(), 220);
  const dateStr = article.published
    ? new Date(article.published).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).toUpperCase()
    : "";

  const theme = pickTheme(index);
  const tag = `${leagueLabel} · HOT TAKE`;

  return {
    id: `s_${article.id}`,
    league: leagueId,
    leagueLabel,
    template: "hot-take",
    theme,
    tag,
    seed: {
      template: "hot-take",
      theme,
      tag,
      headline,
      context: description,
      meta: `${leagueLabel} · ${dateStr}`,
    },
    source: {
      headline: rawHeadline,
      description: article.description || "",
      publishedAt: article.published || "",
    },
  };
}

// ─── Build the full set ──────────────────────────────────────────────────────

const CACHE_KEY = "cards:suggestions:v1";
const PER_LEAGUE = 2; // 2 suggestions × 4 leagues = 8 total

async function buildSuggestions(): Promise<CardSuggestion[]> {
  const all = await Promise.all(
    LEAGUE_MAP.map((lg) => fetchLeagueNews(lg.espn, PER_LEAGUE + 1)),
  );

  const suggestions: CardSuggestion[] = [];
  LEAGUE_MAP.forEach((lg, lgIdx) => {
    const arts = all[lgIdx] || [];
    let added = 0;
    for (const art of arts) {
      if (added >= PER_LEAGUE) break;
      const s = articleToSuggestion(art, lg.id, lg.label, suggestions.length);
      if (s) {
        suggestions.push(s);
        added++;
      }
    }
  });

  return suggestions;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("refresh") === "1";
  const filterLeague = searchParams.get("league") as League | null;

  let suggestions: CardSuggestion[] | null = null;

  if (!force) {
    try {
      const cached = await statsCache.get<{ suggestions: CardSuggestion[]; refreshedAt: string }>(
        CACHE_KEY,
      );
      if (cached?.suggestions?.length) {
        const filtered = filterLeague
          ? cached.suggestions.filter((s) => s.league === filterLeague)
          : cached.suggestions;
        return NextResponse.json({
          suggestions: filtered,
          refreshedAt: cached.refreshedAt,
          source: "cache",
        });
      }
    } catch {
      /* fall through to fresh fetch */
    }
  }

  suggestions = await buildSuggestions();
  const refreshedAt = new Date().toISOString();

  try {
    // 8 hours TTL — refreshed by cron 3x/day; this is a safety net if cron misses.
    await statsCache.set(
      CACHE_KEY,
      { suggestions, refreshedAt },
      8 * 60 * 60,
    );
  } catch {
    /* cache write best-effort */
  }

  const filtered = filterLeague
    ? suggestions.filter((s) => s.league === filterLeague)
    : suggestions;

  return NextResponse.json({
    suggestions: filtered,
    refreshedAt,
    source: "fresh",
  });
}
