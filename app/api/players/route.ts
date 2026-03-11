import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ESPN_SEARCH = "https://site.web.api.espn.com/apis/common/v3/search";
const ESPN_CORE = "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba";

interface EspnSearchItem {
  id: string;
  displayName: string;
  shortName: string;
  jersey?: string;
  isActive: boolean;
  headshot?: { href: string; alt: string };
  teamRelationships?: Array<{
    displayName: string;
    core: {
      id: string;
      abbreviation: string;
      logos?: Array<{ href: string }>;
    };
  }>;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || searchParams.get("search");
  const playerId = searchParams.get("id");

  try {
    // Get single player by ID (ESPN athlete endpoint)
    if (playerId) {
      const res = await fetch(`${ESPN_CORE}/athletes/${playerId}`, {
        next: { revalidate: 3600 },
      } as RequestInit);

      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: "Player not found" },
          { status: 404 }
        );
      }

      const data = await res.json();

      // Resolve team info if it's a $ref
      let teamInfo: { id: string; name: string; abbreviation: string } | undefined;
      if (data.team?.$ref) {
        try {
          const teamRes = await fetch(data.team.$ref);
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            teamInfo = {
              id: teamData.id?.toString(),
              name: teamData.displayName || teamData.name,
              abbreviation: teamData.abbreviation,
            };
          }
        } catch {
          // Team fetch failed, continue without
        }
      }

      const player = {
        id: data.id?.toString() || playerId,
        name: data.displayName || data.fullName || "Unknown",
        firstName: data.firstName,
        lastName: data.lastName,
        position: data.position?.abbreviation,
        height: data.displayHeight,
        weight: data.displayWeight ? parseInt(data.displayWeight, 10) : undefined,
        jerseyNumber: data.jersey,
        headshotUrl:
          data.headshot?.href ||
          `https://a.espncdn.com/i/headshots/nba/players/full/${playerId}.png`,
        team: teamInfo,
      };

      return NextResponse.json({ success: true, player });
    }

    // Search players by name using ESPN Search API
    if (query) {
      const url = new URL(ESPN_SEARCH);
      url.searchParams.set("query", query);
      url.searchParams.set("limit", "10");
      url.searchParams.set("type", "player");
      url.searchParams.set("sport", "basketball");
      url.searchParams.set("league", "nba");

      const res = await fetch(url.toString());
      if (!res.ok) {
        return NextResponse.json({
          success: true,
          query,
          count: 0,
          players: [],
        });
      }

      const data = await res.json();
      const items: EspnSearchItem[] = data.items || [];

      const players = items
        .filter((item) => item.isActive)
        .map((item) => {
          const team = item.teamRelationships?.[0];
          return {
            id: item.id,
            name: item.displayName,
            headshotUrl: item.headshot?.href,
            team: team
              ? {
                  name: team.displayName,
                  abbreviation: team.core?.abbreviation,
                }
              : undefined,
          };
        });

      return NextResponse.json({
        success: true,
        query,
        count: players.length,
        players,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Please provide a search query (q) or player ID (id)",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Players API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch player data" },
      { status: 500 }
    );
  }
}
