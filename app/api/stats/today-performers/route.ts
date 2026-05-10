import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ESPN_LEAGUES = [
  { slug: "nba", label: "NBA" },
  { slug: "wnba", label: "WNBA" },
];

function espnBase(league: string) {
  return `https://site.api.espn.com/apis/site/v2/sports/basketball/${league}`;
}

// NBA.com headshot URL helper
const getNbaHeadshot = (nbaId: string) =>
  `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`;

interface TodayPerformer {
  playerId: string;
  name: string;
  team: string;
  teamName: string;
  teamLogo: string;
  points: number;
  rebounds: number;
  assists: number;
  imageUrl: string;
  gameId: string;
  gameStatus: "live" | "final";
  league: string;
}

// In-memory cache
let cachedData: { performers: TodayPerformer[]; timestamp: number; date: string } | null = null;
const CACHE_TTL = 60000; // 60 seconds

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Check cache
    if (cachedData && cachedData.date === today && Date.now() - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        performers: cachedData.performers,
        source: "cache",
        date: today,
      });
    }

    const allPerformers: TodayPerformer[] = [];

    // Fetch scoreboards from all leagues in parallel
    const leagueResults = await Promise.allSettled(
      ESPN_LEAGUES.map(async ({ slug, label }) => {
        const base = espnBase(slug);

        // Step 1: Fetch today's scoreboard
        const scoreboardRes = await fetch(`${base}/scoreboard`, {
          headers: { Accept: "application/json" },
        });
        if (!scoreboardRes.ok) return [];

        const scoreboard = await scoreboardRes.json();
        const events = scoreboard.events || [];

        // Step 2: Filter to live and completed games only
        const gamesWithStats = events.filter((event: any) => {
          const status = event.competitions?.[0]?.status?.type;
          return status?.state === "in" || status?.state === "post";
        });

        if (gamesWithStats.length === 0) return [];

        // Step 3: Fetch box scores for each game (in parallel, max 6 concurrent)
        const leaguePerformers: TodayPerformer[] = [];
        const batchSize = 6;

        for (let i = 0; i < gamesWithStats.length; i += batchSize) {
          const batch = gamesWithStats.slice(i, i + batchSize);
          const results = await Promise.allSettled(
            batch.map(async (event: any) => {
              const gameId = event.id;
              const competition = event.competitions?.[0];
              const gameState = competition?.status?.type?.state;

              const summaryRes = await fetch(
                `${base}/summary?event=${gameId}`,
                { headers: { Accept: "application/json" } }
              );
              if (!summaryRes.ok) return [];

              const summary = await summaryRes.json();
              const players: TodayPerformer[] = [];

              const defaultLabels = ["MIN", "FG", "3PT", "FT", "OREB", "DREB", "REB", "AST", "STL", "BLK", "TO", "PF", "PTS"];

              for (const teamPlayers of summary.boxscore?.players || []) {
                const teamInfo = teamPlayers.team;

                for (const statCategory of teamPlayers.statistics || []) {
                  const labels = statCategory.labels || defaultLabels;
                  const ptsIdx = labels.indexOf("PTS");
                  const rebIdx = labels.indexOf("REB");
                  const astIdx = labels.indexOf("AST");

                  for (const athlete of statCategory.athletes || []) {
                    if (athlete.didNotPlay) continue;

                    const stats = athlete.stats || [];
                    const pts = ptsIdx >= 0 ? parseInt(stats[ptsIdx] || "0") : 0;
                    const reb = rebIdx >= 0 ? parseInt(stats[rebIdx] || "0") : 0;
                    const ast = astIdx >= 0 ? parseInt(stats[astIdx] || "0") : 0;

                    if (pts > 0) {
                      const espnId = athlete.athlete?.id || "";
                      players.push({
                        playerId: espnId,
                        name: athlete.athlete?.displayName || "Unknown",
                        team: teamInfo?.abbreviation || "",
                        teamName: teamInfo?.displayName || "",
                        teamLogo: teamInfo?.logo || "",
                        points: pts,
                        rebounds: reb,
                        assists: ast,
                        imageUrl: athlete.athlete?.headshot?.href || (slug === "nba" ? getNbaHeadshot(espnId) : ""),
                        gameId,
                        gameStatus: gameState === "post" ? "final" : "live",
                        league: label,
                      });
                    }
                  }
                }
              }

              return players;
            })
          );

          for (const result of results) {
            if (result.status === "fulfilled" && Array.isArray(result.value)) {
              leaguePerformers.push(...result.value);
            }
          }
        }

        return leaguePerformers;
      })
    );

    for (const result of leagueResults) {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        allPerformers.push(...result.value);
      }
    }

    // Step 4: Sort by points (highest first) and take top 5
    allPerformers.sort((a, b) => b.points - a.points);
    const topPerformers = allPerformers.slice(0, 5);

    // Cache the result
    cachedData = { performers: topPerformers, timestamp: Date.now(), date: today };

    return NextResponse.json({
      success: true,
      performers: topPerformers,
      source: "live",
      date: today,
    });
  } catch (error) {
    console.error("Today performers API error:", error);
    return NextResponse.json({
      success: false,
      performers: [],
      error: "Failed to fetch today's performers",
    });
  }
}
