import { NextRequest, NextResponse } from "next/server";
import { calculateWinProbability } from "@/lib/analytics/win-probability";
import { calculateMomentum } from "@/lib/analytics/momentum";
import { generateGameInsights } from "@/lib/analytics/insights";

export const dynamic = "force-dynamic";

interface EspnPlayer {
  athlete: {
    id: string;
    displayName: string;
    shortName: string;
    headshot?: { href: string };
    jersey?: string;
    position?: { abbreviation: string };
  };
  stats: string[];
  starter: boolean;
  didNotPlay: boolean;
  reason?: string;
}

interface EspnTeamBoxscore {
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo: string;
  };
  statistics: Array<{
    name: string;
    displayValue: string;
    label: string;
  }>;
}

interface EspnBoxscore {
  teams: EspnTeamBoxscore[];
  players: Array<{
    team: { id: string; displayName: string };
    statistics: Array<{
      names: string[];
      labels: string[];
      athletes: EspnPlayer[];
    }>;
  }>;
}

interface EspnGameSummary {
  boxscore: EspnBoxscore;
  header: {
    competitions: Array<{
      competitors: Array<{
        id: string;
        homeAway: string;
        score: string;
        team: {
          id: string;
          displayName: string;
          abbreviation: string;
          logo?: string;
          logos?: Array<{ href: string }>;
        };
        winner?: boolean;
        linescores?: Array<{ displayValue: string }>;
        record?: Array<{ displayValue: string; type?: string }>;
      }>;
      status: {
        type: {
          state: string;
          completed: boolean;
          description: string;
        };
        period: number;
        displayClock: string;
      };
      date: string;
    }>;
  };
  gameInfo?: {
    venue?: {
      fullName: string;
      address?: {
        city: string;
        state: string;
      };
    };
    pickcenter?: Array<{
      provider?: { name: string };
      details?: string;
      overUnder?: number;
      spread?: number;
      awayTeamOdds?: { moneyLine?: number };
      homeTeamOdds?: { moneyLine?: number };
    }>;
    seasonseries?: Array<{
      summary?: string;
    }>;
  };
}

// Map league param to ESPN sport slug
const ESPN_SPORT_SLUGS: Record<string, string> = {
  nba: "basketball/nba",
  wnba: "basketball/wnba",
  ncaam: "basketball/mens-college-basketball",
  ncaaw: "basketball/womens-college-basketball",
};

// GET - Fetch game details and box score from ESPN
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const league = searchParams.get("league") || "nba";
    const sportSlug = ESPN_SPORT_SLUGS[league] || "basketball/nba";

    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${sportSlug}/summary?event=${id}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 30 },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    const data: EspnGameSummary = await response.json();

    // Extract game info
    const competition = data.header?.competitions?.[0];
    if (!competition) {
      return NextResponse.json(
        { success: false, error: "Game data not available" },
        { status: 404 }
      );
    }

    const homeTeamData = competition.competitors.find(c => c.homeAway === "home");
    const awayTeamData = competition.competitors.find(c => c.homeAway === "away");

    // Extract logo from ESPN data — handles both "logo" (string) and "logos" (array)
    const extractLogo = (team?: { logo?: string; logos?: Array<{ href: string }> }) => {
      if (!team) return undefined;
      if (team.logo) return team.logo;
      if (team.logos?.[0]?.href) return team.logos[0].href;
      return undefined;
    };

    // ESPN CDN fallback for team logos
    const getTeamLogo = (teamId: string, abbr: string, providedLogo?: string) => {
      if (providedLogo) return providedLogo;
      if (league === "ncaam" || league === "ncaaw") {
        return `https://a.espncdn.com/i/teamlogos/ncaa/500/${teamId}.png`;
      }
      if (league === "wnba") {
        return `https://a.espncdn.com/i/teamlogos/wnba/500/${teamId}.png`;
      }
      return `https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`;
    };

    const gameStatus = competition.status.type.state === "post"
      ? "final" as const
      : competition.status.type.state === "in"
        ? "live" as const
        : "scheduled" as const;

    const homeScore = parseInt(homeTeamData?.score || "0");
    const awayScore = parseInt(awayTeamData?.score || "0");

    const gameInfo = {
      id,
      date: competition.date,
      status: gameStatus,
      statusDescription: competition.status.type.description,
      period: competition.status.period,
      clock: competition.status.displayClock,
      venue: data.gameInfo?.venue?.fullName,
      location: data.gameInfo?.venue?.address
        ? `${data.gameInfo.venue.address.city}, ${data.gameInfo.venue.address.state}`
        : undefined,
      homeTeam: {
        id: homeTeamData?.team.id,
        name: homeTeamData?.team.displayName,
        abbreviation: homeTeamData?.team.abbreviation,
        logo: getTeamLogo(homeTeamData?.team.id || "", homeTeamData?.team.abbreviation || "", extractLogo(homeTeamData?.team)),
        score: homeScore,
        winner: homeTeamData?.winner,
      },
      awayTeam: {
        id: awayTeamData?.team.id,
        name: awayTeamData?.team.displayName,
        abbreviation: awayTeamData?.team.abbreviation,
        logo: getTeamLogo(awayTeamData?.team.id || "", awayTeamData?.team.abbreviation || "", extractLogo(awayTeamData?.team)),
        score: awayScore,
        winner: awayTeamData?.winner,
      },
    };

    // Extract team stats
    const teamStats: Record<string, Record<string, string>> = {};
    for (const team of data.boxscore?.teams || []) {
      const stats: Record<string, string> = {};
      for (const stat of team.statistics) {
        stats[stat.name] = stat.displayValue;
      }
      teamStats[team.team.abbreviation] = stats;
    }

    // Extract player stats
    const playerStats: Array<{
      teamId: string;
      teamName: string;
      players: Array<{
        id: string;
        name: string;
        shortName: string;
        headshot?: string;
        jersey?: string;
        position?: string;
        starter: boolean;
        dnp: boolean;
        dnpReason?: string;
        stats: Record<string, string>;
      }>;
    }> = [];

    const statLabels = ["MIN", "FG", "3PT", "FT", "OREB", "DREB", "REB", "AST", "STL", "BLK", "TO", "PF", "PTS"];

    for (const teamPlayers of data.boxscore?.players || []) {
      const teamPlayerStats: Array<{
        id: string;
        name: string;
        shortName: string;
        headshot?: string;
        jersey?: string;
        position?: string;
        starter: boolean;
        dnp: boolean;
        dnpReason?: string;
        stats: Record<string, string>;
      }> = [];

      for (const statCategory of teamPlayers.statistics) {
        const labels = statCategory.labels || statLabels;

        for (const player of statCategory.athletes) {
          const playerStatMap: Record<string, string> = {};
          player.stats.forEach((value, index) => {
            const label = labels[index] || `stat${index}`;
            playerStatMap[label] = value;
          });

          teamPlayerStats.push({
            id: player.athlete.id,
            name: player.athlete.displayName,
            shortName: player.athlete.shortName,
            headshot: player.athlete.headshot?.href,
            jersey: player.athlete.jersey,
            position: player.athlete.position?.abbreviation,
            starter: player.starter,
            dnp: player.didNotPlay,
            dnpReason: player.reason,
            stats: playerStatMap,
          });
        }
      }

      playerStats.push({
        teamId: teamPlayers.team.id,
        teamName: teamPlayers.team.displayName,
        players: teamPlayerStats,
      });
    }

    // === NEW: Extract additional ESPN data ===

    // Quarter scores (linescores)
    const homeLinescores = homeTeamData?.linescores?.map(ls => ls.displayValue) || [];
    const awayLinescores = awayTeamData?.linescores?.map(ls => ls.displayValue) || [];

    // Team records
    const homeRecord = homeTeamData?.record?.[0]?.displayValue || null;
    const awayRecord = awayTeamData?.record?.[0]?.displayValue || null;

    // Betting odds
    const pickcenter = data.gameInfo?.pickcenter?.[0];
    const odds = pickcenter ? {
      spread: pickcenter.spread ?? null,
      overUnder: pickcenter.overUnder ?? null,
      homeMoneyline: pickcenter.homeTeamOdds?.moneyLine ?? null,
      awayMoneyline: pickcenter.awayTeamOdds?.moneyLine ?? null,
      details: pickcenter.details || null,
      provider: pickcenter.provider?.name || null,
    } : null;

    // Season series
    const seasonSeries = data.gameInfo?.seasonseries?.[0]?.summary || null;

    // === NEW: Compute analytics ===

    const winProbability = calculateWinProbability({
      homeScore,
      awayScore,
      period: competition.status.period,
      clock: competition.status.displayClock,
      gameStatus,
      homeRecord: homeRecord || undefined,
      awayRecord: awayRecord || undefined,
      homeWinner: homeTeamData?.winner,
    });

    const homeAbbr = gameInfo.homeTeam.abbreviation || "";
    const awayAbbr = gameInfo.awayTeam.abbreviation || "";

    const momentum = gameStatus === "live" ? calculateMomentum({
      homeLinescores: homeLinescores.map(Number),
      awayLinescores: awayLinescores.map(Number),
      homeTeamStats: teamStats[homeAbbr] || {},
      awayTeamStats: teamStats[awayAbbr] || {},
      period: competition.status.period,
      gameStatus,
    }) : null;

    // AI insights — only for live/final games (non-blocking)
    let insights: string[] = [];
    if (gameStatus !== "scheduled") {
      try {
        insights = await generateGameInsights(id, {
          homeTeamName: gameInfo.homeTeam.name || "",
          awayTeamName: gameInfo.awayTeam.name || "",
          homeTeamAbbr: homeAbbr,
          awayTeamAbbr: awayAbbr,
          homeScore,
          awayScore,
          gameStatus,
          homeTeamStats: teamStats[homeAbbr] || {},
          awayTeamStats: teamStats[awayAbbr] || {},
          seasonSeries: seasonSeries || undefined,
          homeRecord: homeRecord || undefined,
          awayRecord: awayRecord || undefined,
        });
      } catch {
        // Non-blocking — insights are optional
      }
    }

    return NextResponse.json({
      success: true,
      game: gameInfo,
      teamStats,
      playerStats,
      linescores: {
        home: homeLinescores,
        away: awayLinescores,
      },
      records: {
        home: homeRecord,
        away: awayRecord,
      },
      odds,
      seasonSeries,
      analytics: {
        winProbability,
        momentum,
        insights,
      },
    });
  } catch (error) {
    console.error("Error fetching game details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch game details" },
      { status: 500 }
    );
  }
}
