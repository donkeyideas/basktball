import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
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
  | "fgPct"
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

const PARSE_SYSTEM_PROMPT = `You are a structured-query parser for basketball stat questions.

Output ONLY valid JSON matching this exact schema:
{
  "playerName": string | null,
  "metric": "points" | "rebounds" | "assists" | "steals" | "blocks" | "threes" | "turnovers" | "minutes" | "fgPct" | null,
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
- Map natural-language metric words to the enum: boards->rebounds, dimes->rebounds (wrong) — actually dimes->assists, blocks->blocks, threes/3pt/3-pointers->threes, turnovers/TOs->turnovers.
- For thresholds like "10+ assists" set comparator="gte" and value=10.
- For "vs a top-10 defense" set opponentFilter="top_def" and opponentRank=10.
- For "vs Lakers" or "vs Bucks" use opponentTeam with the team abbreviation (LAL, MIL, etc.).
- If a field is not mentioned, set it to null.
- "this season" → null season (default to current).
- "clutch" or "in the 4th" → isClutch=true.
- Do not invent values. Output ONLY the JSON, no markdown fences, no prose.`;

function teamAbbrFromName(name: string): string {
  // Conservative mapping — fall back to first 3 chars uppercased
  const map: Record<string, string> = {
    lakers: "LAL", warriors: "GSW", celtics: "BOS", nuggets: "DEN",
    bucks: "MIL", heat: "MIA", knicks: "NYK", nets: "BKN",
    bulls: "CHI", spurs: "SAS", rockets: "HOU", mavericks: "DAL",
    suns: "PHX", clippers: "LAC", kings: "SAC", thunder: "OKC",
    timberwolves: "MIN", grizzlies: "MEM", pelicans: "NOP",
    jazz: "UTA", hawks: "ATL", hornets: "CHA", magic: "ORL",
    pistons: "DET", pacers: "IND", cavaliers: "CLE", raptors: "TOR",
    sixers: "PHI", "76ers": "PHI", wizards: "WAS", blazers: "POR",
    trailblazers: "POR",
  };
  const key = name.toLowerCase().trim();
  return map[key] || name.toUpperCase().slice(0, 3);
}

async function callParser(query: string): Promise<ParsedQuery> {
  if (!process.env.DEEPSEEK_API_KEY) {
    // Heuristic fallback parser (very limited)
    return heuristicParse(query);
  }
  try {
    const result = await deepseek.generate(query, PARSE_SYSTEM_PROMPT, {
      temperature: 0,
      maxTokens: 400,
    });
    // Strip ```json fences if present
    const cleaned = result.content
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as ParsedQuery;
    return normalizeParsed(parsed);
  } catch (err) {
    console.error("lab/ask parser error:", err);
    return heuristicParse(query);
  }
}

function normalizeParsed(p: Partial<ParsedQuery>): ParsedQuery {
  return {
    playerName: p.playerName ?? null,
    metric: (p.metric ?? null) as Metric,
    comparator: (p.comparator ?? null) as Comparator,
    value: typeof p.value === "number" ? p.value : null,
    opponentTeam: p.opponentTeam ?? null,
    opponentFilter: p.opponentFilter ?? null,
    opponentRank: typeof p.opponentRank === "number" ? p.opponentRank : null,
    season: p.season ?? null,
    isHome: p.isHome ?? null,
    isClutch: p.isClutch ?? null,
    notes: p.notes ?? undefined,
  };
}

function heuristicParse(q: string): ParsedQuery {
  const lower = q.toLowerCase();
  const result: ParsedQuery = {
    playerName: null,
    metric: null,
    comparator: null,
    value: null,
    opponentTeam: null,
    opponentFilter: null,
    opponentRank: null,
    season: null,
    isHome: null,
    isClutch: null,
  };
  // Metric
  if (/\bast|assist|dime/.test(lower)) result.metric = "assists";
  else if (/\breb|board/.test(lower)) result.metric = "rebounds";
  else if (/\bblk|block/.test(lower)) result.metric = "blocks";
  else if (/\bstl|steal/.test(lower)) result.metric = "steals";
  else if (/\bthree|3pt|3-point/.test(lower)) result.metric = "threes";
  else if (/\btov|turnover/.test(lower)) result.metric = "turnovers";
  else if (/\bpts|point|score/.test(lower)) result.metric = "points";

  // Threshold
  const m = lower.match(/(\d+)\s*\+/);
  if (m) {
    result.value = parseInt(m[1], 10);
    result.comparator = "gte";
  }

  if (/clutch|4th|fourth\s*quarter/.test(lower)) result.isClutch = true;
  if (/top.{0,4}(\d+).{0,5}defense/.test(lower)) {
    const r = lower.match(/top.{0,4}(\d+)/);
    if (r) result.opponentRank = parseInt(r[1], 10);
    result.opponentFilter = "top_def";
  }
  return result;
}

async function executeQuery(p: ParsedQuery) {
  // Resolve player by name. The DB has duplicate entries for many players
  // (legacy IDs vs current ESPN IDs); the right one is the player who actually
  // has PlayerStat rows. Filter to those and prefer active players.
  let playerId: string | null = null;
  let playerName: string | null = null;
  if (p.playerName) {
    const nameFilter = {
      OR: [
        { name: { contains: p.playerName, mode: "insensitive" as const } },
        { lastName: { contains: p.playerName, mode: "insensitive" as const } },
      ],
    };
    // First try: player with name match AND at least one PlayerStat row.
    let player = await prisma.player.findFirst({
      where: { AND: [nameFilter, { stats: { some: {} } }, { isActive: true }] },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    // Fall back to any active player matching the name.
    if (!player) {
      player = await prisma.player.findFirst({
        where: { AND: [nameFilter, { isActive: true }] },
        select: { id: true, name: true },
      });
    }
    // Last resort: any player matching the name.
    if (!player) {
      player = await prisma.player.findFirst({
        where: nameFilter,
        select: { id: true, name: true },
      });
    }
    if (player) {
      playerId = player.id;
      playerName = player.name;
    }
  }

  // Build the metric filter
  const metricMap: Record<Exclude<Metric, null | "fgPct">, string> = {
    points: "points",
    rebounds: "rebounds",
    assists: "assists",
    steals: "steals",
    blocks: "blocks",
    threes: "tpm",
    turnovers: "turnovers",
    minutes: "minutes",
  };

  const where: Record<string, unknown> = {};
  if (playerId) where.playerId = playerId;

  if (p.metric && p.comparator && p.value != null) {
    const field = p.metric === "fgPct" ? null : metricMap[p.metric];
    if (field) {
      const op = p.comparator === "gte" ? "gte" : p.comparator === "lte" ? "lte" : "equals";
      where[field] = { [op]: p.value };
    }
  }

  // Opponent team filter
  let opponentTeamId: string | null = null;
  if (p.opponentTeam) {
    const team = await prisma.team.findFirst({
      where: { abbreviation: p.opponentTeam.toUpperCase() },
      select: { id: true, name: true, abbreviation: true },
    });
    if (team) opponentTeamId = team.id;
  }

  const stats = await prisma.playerStat.findMany({
    where: where as never,
    take: 30,
    orderBy: { game: { gameDate: "desc" } },
    select: {
      points: true,
      rebounds: true,
      assists: true,
      steals: true,
      blocks: true,
      tpm: true,
      turnovers: true,
      fgm: true,
      fga: true,
      minutes: true,
      plusMinus: true,
      player: { select: { id: true, name: true } },
      game: {
        select: {
          id: true,
          gameDate: true,
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
          status: true,
          homeTeam: { select: { id: true, abbreviation: true, name: true } },
          awayTeam: { select: { id: true, abbreviation: true, name: true } },
        },
      },
    },
  });

  // Post-filter for opponent if specified — depends on the player's team being home or away
  let filteredStats = stats;
  if (opponentTeamId && playerId) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { teamId: true },
    });
    const playerTeamId = player?.teamId;
    filteredStats = stats.filter((s) => {
      const home = s.game.homeTeamId;
      const away = s.game.awayTeamId;
      if (playerTeamId === home) return away === opponentTeamId;
      if (playerTeamId === away) return home === opponentTeamId;
      // Fallback: just check either side matches the opponent
      return home === opponentTeamId || away === opponentTeamId;
    });
  }

  // Note: opponent "top defense" filter is not yet computable without a defensive
  // rating table. Surface this in the response so the UI can show "coming soon".
  const limitations: string[] = [];
  if (p.opponentFilter) {
    limitations.push(
      `Opponent filter "${p.opponentFilter}" is not yet computable — defensive rating cache pending. Showing unfiltered results.`,
    );
  }
  if (p.isHome != null || p.isClutch) {
    limitations.push(
      "Home/away and clutch filters require play-by-play data not yet ingested. Showing season-level results.",
    );
  }
  if (p.metric === "fgPct") {
    limitations.push("FG% threshold filter is not yet supported. Showing unfiltered results.");
  }

  return {
    resolvedPlayer: playerName ? { id: playerId, name: playerName } : null,
    results: filteredStats.map((s) => ({
      date: s.game.gameDate,
      gameId: s.game.id,
      home: s.game.homeTeam,
      away: s.game.awayTeam,
      homeScore: s.game.homeScore,
      awayScore: s.game.awayScore,
      status: s.game.status,
      stats: {
        pts: s.points,
        reb: s.rebounds,
        ast: s.assists,
        stl: s.steals,
        blk: s.blocks,
        tpm: s.tpm,
        fgm: s.fgm,
        fga: s.fga,
        min: s.minutes,
        pm: s.plusMinus,
      },
      player: s.player,
    })),
    limitations,
  };
}

export async function POST(req: NextRequest) {
  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const query = (body.query || "").trim();
  if (!query) {
    return NextResponse.json({ error: "Empty query" }, { status: 400 });
  }
  if (query.length > 500) {
    return NextResponse.json({ error: "Query too long (max 500 chars)" }, { status: 400 });
  }

  const parsed = await callParser(query);

  // If the parser produced a name-looking string, normalize team abbreviations
  if (parsed.opponentTeam && parsed.opponentTeam.length > 3) {
    parsed.opponentTeam = teamAbbrFromName(parsed.opponentTeam);
  }

  let executed;
  try {
    executed = await executeQuery(parsed);
  } catch (err) {
    console.error("lab/ask execution error:", err);
    return NextResponse.json(
      {
        parsed,
        results: [],
        limitations: ["Query execution failed."],
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    parsed,
    resolvedPlayer: executed.resolvedPlayer,
    results: executed.results,
    count: executed.results.length,
    limitations: executed.limitations,
  });
}
