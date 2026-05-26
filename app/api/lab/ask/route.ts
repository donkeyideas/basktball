import { NextRequest, NextResponse } from "next/server";
import { deepseek } from "@/lib/ai/deepseek";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Metric =
  | "points"
  | "rebounds"
  | "assists"
  | "steals"
  | "blocks"
  | "threes"
  | "turnovers"
  | "minutes"
  | null;

type Comparator = "gte" | "lte" | "eq" | null;

type ParsedQuery = {
  playerName: string | null;
  metric: Metric;
  comparator: Comparator;
  value: number | null;
  opponentTeam: string | null;
  opponentFilter: "top_def" | "bottom_def" | "top_off" | null;
  opponentRank: number | null;
  season: string | null;
  isHome: boolean | null;
  isClutch: boolean | null;
  notes?: string;
};

// ─── DeepSeek NL → structured query ──────────────────────────────────────────

const PARSE_SYSTEM_PROMPT = `You are a structured-query parser for basketball stat questions.

Output ONLY valid JSON matching this exact schema:
{
  "playerName": string | null,
  "metric": "points" | "rebounds" | "assists" | "steals" | "blocks" | "threes" | "turnovers" | "minutes" | null,
  "comparator": "gte" | "lte" | "eq" | null,
  "value": number | null,
  "opponentTeam": string | null,
  "opponentFilter": "top_def" | "bottom_def" | "top_off" | null,
  "opponentRank": number | null,
  "season": string | null,
  "isHome": true | false | null,
  "isClutch": true | false | null,
  "notes": string | null
}

Rules:
- Map natural-language metric words to the enum: boards->rebounds, dimes->assists, blocks->blocks, threes/3pt/3-pointers->threes, turnovers/TOs->turnovers.
- For thresholds like "10+ assists" set comparator="gte" and value=10.
- For "vs a top-10 defense" set opponentFilter="top_def" and opponentRank=10.
- For "vs Lakers" or "vs Bucks" use opponentTeam with the team abbreviation (LAL, MIL, etc.).
- If a field is not mentioned, set it to null.
- "this season" or no season mention → null (defaults to current).
- "clutch" or "in the 4th" → isClutch=true.
- Output ONLY the JSON, no markdown fences, no prose.`;

function teamAbbrFromName(name: string): string {
  const map: Record<string, string> = {
    lakers: "LAL", warriors: "GSW", celtics: "BOS", nuggets: "DEN",
    bucks: "MIL", heat: "MIA", knicks: "NYK", nets: "BKN",
    bulls: "CHI", spurs: "SAS", rockets: "HOU", mavericks: "DAL",
    mavs: "DAL", suns: "PHX", clippers: "LAC", kings: "SAC", thunder: "OKC",
    timberwolves: "MIN", wolves: "MIN", grizzlies: "MEM", pelicans: "NOP",
    jazz: "UTA", hawks: "ATL", hornets: "CHA", magic: "ORL",
    pistons: "DET", pacers: "IND", cavaliers: "CLE", cavs: "CLE",
    raptors: "TOR", sixers: "PHI", "76ers": "PHI", wizards: "WAS",
    blazers: "POR", trailblazers: "POR",
  };
  const key = name.toLowerCase().trim();
  return map[key] || name.toUpperCase().slice(0, 3);
}

function heuristicParse(q: string): ParsedQuery {
  const lower = q.toLowerCase();
  const result: ParsedQuery = {
    playerName: null, metric: null, comparator: null, value: null,
    opponentTeam: null, opponentFilter: null, opponentRank: null,
    season: null, isHome: null, isClutch: null,
  };
  if (/\bast|assist|dime/.test(lower)) result.metric = "assists";
  else if (/\breb|board/.test(lower)) result.metric = "rebounds";
  else if (/\bblk|block/.test(lower)) result.metric = "blocks";
  else if (/\bstl|steal/.test(lower)) result.metric = "steals";
  else if (/\bthree|3pt|3-point/.test(lower)) result.metric = "threes";
  else if (/\btov|turnover/.test(lower)) result.metric = "turnovers";
  else if (/\bpts|point|score/.test(lower)) result.metric = "points";

  const m = lower.match(/(\d+)\s*\+/);
  if (m) {
    result.value = parseInt(m[1], 10);
    result.comparator = "gte";
  }

  if (/clutch|4th|fourth\s*quarter/.test(lower)) result.isClutch = true;
  return result;
}

async function callParser(query: string): Promise<ParsedQuery> {
  if (!process.env.DEEPSEEK_API_KEY) return heuristicParse(query);
  try {
    const result = await deepseek.generate(query, PARSE_SYSTEM_PROMPT, {
      temperature: 0,
      maxTokens: 400,
    });
    const cleaned = result.content
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<ParsedQuery>;
    return {
      playerName: parsed.playerName ?? null,
      metric: (parsed.metric ?? null) as Metric,
      comparator: (parsed.comparator ?? null) as Comparator,
      value: typeof parsed.value === "number" ? parsed.value : null,
      opponentTeam: parsed.opponentTeam ?? null,
      opponentFilter: parsed.opponentFilter ?? null,
      opponentRank: typeof parsed.opponentRank === "number" ? parsed.opponentRank : null,
      season: parsed.season ?? null,
      isHome: parsed.isHome ?? null,
      isClutch: parsed.isClutch ?? null,
      notes: parsed.notes ?? undefined,
    };
  } catch (err) {
    console.error("lab/ask parser error:", err);
    return heuristicParse(query);
  }
}

// ─── ESPN data layer ─────────────────────────────────────────────────────────

type EspnPlayer = {
  id: string;
  name: string;
  teamAbbr?: string;
  position?: string;
};

async function resolveEspnPlayer(name: string): Promise<EspnPlayer | null> {
  const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(
    name,
  )}&type=player&limit=5&sport=basketball&league=nba`;
  try {
    const r = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const d = await r.json();
    const items: Array<Record<string, unknown>> = d?.items ?? [];
    if (!items.length) return null;
    // Prefer an active player over retired ones.
    const sorted = [...items].sort((a, b) => {
      const aActive = a.isActive === true ? 0 : 1;
      const bActive = b.isActive === true ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return (Number(b.relevance) || 0) - (Number(a.relevance) || 0);
    });
    const it = sorted[0];
    const teamRel = (it.teamRelationships as Array<Record<string, unknown>> | undefined)?.[0];
    const teamCore = (teamRel?.core as Record<string, unknown> | undefined) ?? undefined;
    return {
      id: String(it.id),
      name: String(it.displayName ?? name),
      teamAbbr: teamCore?.abbreviation ? String(teamCore.abbreviation) : undefined,
      position: undefined,
    };
  } catch (err) {
    console.error("ESPN player search failed:", err);
    return null;
  }
}

type EspnGameLog = {
  labels?: string[];
  events?: Record<string, EspnEvent>;
  seasonTypes?: Array<{
    displayName?: string;
    categories?: Array<{
      type?: string;
      splitType?: string;
      displayName?: string;
      events?: Array<{ eventId: string; stats: string[] }>;
    }>;
  }>;
};

type EspnEvent = {
  id: string;
  gameDate: string;
  atVs?: string;
  opponent?: { abbreviation?: string; displayName?: string };
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamScore?: string | number;
  awayTeamScore?: string | number;
  gameResult?: string;
  eventNote?: string;
};

async function fetchEspnGameLog(
  playerId: string,
  season: string,
): Promise<EspnGameLog | null> {
  const url = `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/gamelog?season=${season}`;
  try {
    const r = await fetch(url, {
      next: { revalidate: 600 },
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    return (await r.json()) as EspnGameLog;
  } catch (err) {
    console.error("ESPN gamelog fetch failed:", err);
    return null;
  }
}

type ParsedGame = {
  eventId: string;
  date: string;
  opponentAbbr: string;
  atVs: "vs" | "@";
  result: "W" | "L" | "—";
  playerScore: number; // player team's score
  oppScore: number;
  stats: {
    min: number;
    fgm: number;
    fga: number;
    tpm: number;
    tpa: number;
    ftm: number;
    fta: number;
    reb: number;
    ast: number;
    blk: number;
    stl: number;
    tov: number;
    pts: number;
  };
};

function parseGameLog(gamelog: EspnGameLog, playerTeamAbbr?: string): ParsedGame[] {
  const events = gamelog.events ?? {};
  const labels = gamelog.labels ?? [];
  const ix = (lbl: string) => labels.indexOf(lbl);
  const I = {
    MIN: ix("MIN"), FG: ix("FG"), TPT: ix("3PT"), FT: ix("FT"),
    REB: ix("REB"), AST: ix("AST"), BLK: ix("BLK"), STL: ix("STL"),
    TO: ix("TO"), PTS: ix("PTS"),
  };

  const num = (s: string | undefined) => {
    if (!s) return 0;
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };
  const split = (s: string | undefined): [number, number] => {
    if (!s) return [0, 0];
    const [a, b] = s.split("-");
    return [num(a), num(b)];
  };

  const games: ParsedGame[] = [];
  const seen = new Set<string>();

  for (const st of gamelog.seasonTypes ?? []) {
    const isRegOrPlayoff =
      st.displayName?.toLowerCase().includes("regular") ||
      st.displayName?.toLowerCase().includes("postseason");
    if (!isRegOrPlayoff) continue;

    for (const cat of st.categories ?? []) {
      if (cat.type !== "event") continue;
      for (const ev of cat.events ?? []) {
        if (!ev?.eventId || seen.has(ev.eventId)) continue;
        seen.add(ev.eventId);
        const meta = events[ev.eventId];
        if (!meta || !Array.isArray(ev.stats)) continue;

        const [fgm, fga] = split(ev.stats[I.FG]);
        const [tpm, tpa] = split(ev.stats[I.TPT]);
        const [ftm, fta] = split(ev.stats[I.FT]);

        const atVs = meta.atVs === "@" ? "@" : "vs";
        const home = num(String(meta.homeTeamScore));
        const away = num(String(meta.awayTeamScore));
        // Player's team is the home team if atVs == 'vs', else away.
        const playerScore = atVs === "vs" ? home : away;
        const oppScore = atVs === "vs" ? away : home;
        const result: "W" | "L" | "—" =
          meta.gameResult === "W" ? "W" : meta.gameResult === "L" ? "L" : "—";

        games.push({
          eventId: ev.eventId,
          date: meta.gameDate,
          opponentAbbr: meta.opponent?.abbreviation || "—",
          atVs,
          result,
          playerScore,
          oppScore,
          stats: {
            min: num(ev.stats[I.MIN]),
            fgm, fga, tpm, tpa, ftm, fta,
            reb: num(ev.stats[I.REB]),
            ast: num(ev.stats[I.AST]),
            blk: num(ev.stats[I.BLK]),
            stl: num(ev.stats[I.STL]),
            tov: num(ev.stats[I.TO]),
            pts: num(ev.stats[I.PTS]),
          },
        });
      }
    }
  }

  // Newest first
  games.sort((a, b) => (a.date > b.date ? -1 : 1));
  // Suppress unused warning — kept for future home/away filtering
  void playerTeamAbbr;
  return games;
}

// ─── Filtering ────────────────────────────────────────────────────────────────

const metricToField: Record<Exclude<Metric, null>, keyof ParsedGame["stats"]> = {
  points: "pts",
  rebounds: "reb",
  assists: "ast",
  steals: "stl",
  blocks: "blk",
  threes: "tpm",
  turnovers: "tov",
  minutes: "min",
};

function applyFilters(games: ParsedGame[], parsed: ParsedQuery): ParsedGame[] {
  let out = games;

  if (parsed.metric && parsed.comparator && parsed.value != null) {
    const field = metricToField[parsed.metric];
    const v = parsed.value;
    out = out.filter((g) => {
      const stat = g.stats[field];
      if (parsed.comparator === "gte") return stat >= v;
      if (parsed.comparator === "lte") return stat <= v;
      if (parsed.comparator === "eq") return stat === v;
      return true;
    });
  }

  if (parsed.opponentTeam) {
    const opp = parsed.opponentTeam.toUpperCase();
    out = out.filter((g) => g.opponentAbbr.toUpperCase() === opp);
  }

  return out;
}

// ─── Response shaping (mobile + web client) ──────────────────────────────────

function shapeResult(g: ParsedGame, player: EspnPlayer) {
  // Mobile UI expects { home, away, homeScore, awayScore } and uses
  // "{away.abbr} @ {home.abbr}". We reconstruct from atVs + opponent.
  const home =
    g.atVs === "vs"
      ? { id: player.teamAbbr || "—", abbreviation: player.teamAbbr || "—", name: player.teamAbbr || "" }
      : { id: g.opponentAbbr, abbreviation: g.opponentAbbr, name: g.opponentAbbr };
  const away =
    g.atVs === "vs"
      ? { id: g.opponentAbbr, abbreviation: g.opponentAbbr, name: g.opponentAbbr }
      : { id: player.teamAbbr || "—", abbreviation: player.teamAbbr || "—", name: player.teamAbbr || "" };

  return {
    date: g.date,
    gameId: g.eventId,
    home,
    away,
    homeScore: g.atVs === "vs" ? g.playerScore : g.oppScore,
    awayScore: g.atVs === "vs" ? g.oppScore : g.playerScore,
    status: g.result,
    player: { id: player.id, name: player.name },
    stats: {
      pts: g.stats.pts,
      reb: g.stats.reb,
      ast: g.stats.ast,
      stl: g.stats.stl,
      blk: g.stats.blk,
      tpm: g.stats.tpm,
      fgm: g.stats.fgm,
      fga: g.stats.fga,
      min: g.stats.min,
      pm: 0,
    },
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

const CURRENT_SEASON = "2026";

export async function POST(req: NextRequest) {
  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const query = (body.query || "").trim();
  if (!query) return NextResponse.json({ error: "Empty query" }, { status: 400 });
  if (query.length > 500) {
    return NextResponse.json({ error: "Query too long (max 500 chars)" }, { status: 400 });
  }

  const parsed = await callParser(query);
  if (parsed.opponentTeam && parsed.opponentTeam.length > 3) {
    parsed.opponentTeam = teamAbbrFromName(parsed.opponentTeam);
  }

  // Need a player to query the game log.
  if (!parsed.playerName) {
    return NextResponse.json({
      parsed,
      resolvedPlayer: null,
      results: [],
      count: 0,
      limitations: [
        "Mention a specific player by name (e.g. 'LeBron', 'Jokic', 'Curry'). Multi-player queries aren't supported yet.",
      ],
    });
  }

  const player = await resolveEspnPlayer(parsed.playerName);
  if (!player) {
    return NextResponse.json({
      parsed,
      resolvedPlayer: null,
      results: [],
      count: 0,
      limitations: [`Couldn't find an NBA player matching "${parsed.playerName}".`],
    });
  }

  const season = parsed.season || CURRENT_SEASON;
  const gamelog = await fetchEspnGameLog(player.id, season);
  if (!gamelog || !gamelog.events) {
    return NextResponse.json({
      parsed,
      resolvedPlayer: { id: player.id, name: player.name },
      results: [],
      count: 0,
      limitations: [`No game log available for ${player.name} in season ${season}.`],
    });
  }

  const allGames = parseGameLog(gamelog, player.teamAbbr);
  const filtered = applyFilters(allGames, parsed);

  const limitations: string[] = [];
  if (parsed.opponentFilter) {
    limitations.push(
      `Opponent filter "${parsed.opponentFilter}" (defensive-rating buckets) isn't supported yet — showing without that filter.`,
    );
  }
  if (parsed.isHome != null || parsed.isClutch) {
    limitations.push(
      "Home/away and clutch splits aren't broken out in the game log — showing whole-game stats.",
    );
  }

  return NextResponse.json({
    parsed,
    resolvedPlayer: { id: player.id, name: player.name, teamAbbr: player.teamAbbr },
    results: filtered.slice(0, 50).map((g) => shapeResult(g, player)),
    count: filtered.length,
    limitations,
  });
}
