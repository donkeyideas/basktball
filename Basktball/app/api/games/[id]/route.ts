import { NextRequest, NextResponse } from "next/server";

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
          logo: string;
        };
        winner?: boolean;
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
  };
}

// GET - Fetch game details and box score from ESPN
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${id}`,
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

    // ESPN CDN fallback for team logos
    const getTeamLogo = (abbr: string, providedLogo?: string) => {
      if (providedLogo) return providedLogo;
      return `https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`;
    };

    const gameInfo = {
      id,
      date: competition.date,
      status: competition.status.type.state === "post"
        ? "final"
        : competition.status.type.state === "in"
          ? "live"
          : "scheduled",
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
        logo: getTeamLogo(homeTeamData?.team.abbreviation || "", homeTeamData?.team.logo),
        score: parseInt(homeTeamData?.score || "0"),
        winner: homeTeamData?.winner,
      },
      awayTeam: {
        id: awayTeamData?.team.id,
        name: awayTeamData?.team.displayName,
        abbreviation: awayTeamData?.team.abbreviation,
        logo: getTeamLogo(awayTeamData?.team.abbreviation || "", awayTeamData?.team.logo),
        score: parseInt(awayTeamData?.score || "0"),
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

    // Stat column order from ESPN (typical basketball box score)
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

    return NextResponse.json({
      success: true,
      game: gameInfo,
      teamStats,
      playerStats,
    });
  } catch (error) {
    console.error("Error fetching game details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch game details" },
      { status: 500 }
    );
  }
}
