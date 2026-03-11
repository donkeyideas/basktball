import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getLeagueLeaders } from "@/lib/api/live-stats";

interface PropBet {
  id: string;
  player: string;
  team: string;
  stat: string;
  line: number;
  odds: { over: number; under: number };
  projection: number;
  edge: number;
}

// GET - Fetch player props with projections
export async function GET(request: NextRequest) {
  try {
    // Get players with recent stats for props
    const players = await prisma.player.findMany({
      where: {
        isActive: true,
        team: { isNot: null },
      },
      include: {
        team: true,
        stats: {
          orderBy: { game: { gameDate: "desc" } },
          take: 10,
        },
      },
      take: 20,
    });

    const props: PropBet[] = [];

    for (const player of players) {
      if (player.stats.length < 5) continue;

      // Calculate averages
      const avgPts = player.stats.reduce((s, st) => s + st.points, 0) / player.stats.length;
      const avgReb = player.stats.reduce((s, st) => s + st.rebounds, 0) / player.stats.length;
      const avgAst = player.stats.reduce((s, st) => s + st.assists, 0) / player.stats.length;
      const avgTpm = player.stats.reduce((s, st) => s + st.tpm, 0) / player.stats.length;

      // Generate props for high-volume players
      if (avgPts > 15) {
        const line = Math.round(avgPts * 2 - 0.5) / 2; // Round to nearest 0.5, slightly under
        const projection = Math.round(avgPts * 10) / 10;
        const edge = Math.round((projection - line) * 10) / 10;

        props.push({
          id: `${player.id}-pts`,
          player: player.name,
          team: player.team?.abbreviation || "FA",
          stat: "Points",
          line,
          odds: { over: -115, under: -105 },
          projection,
          edge,
        });
      }

      if (avgAst > 5) {
        const line = Math.round(avgAst * 2 - 0.5) / 2;
        const projection = Math.round(avgAst * 10) / 10;
        const edge = Math.round((projection - line) * 10) / 10;

        props.push({
          id: `${player.id}-ast`,
          player: player.name,
          team: player.team?.abbreviation || "FA",
          stat: "Assists",
          line,
          odds: { over: -110, under: -110 },
          projection,
          edge,
        });
      }

      if (avgReb > 6) {
        const line = Math.round(avgReb * 2 - 0.5) / 2;
        const projection = Math.round(avgReb * 10) / 10;
        const edge = Math.round((projection - line) * 10) / 10;

        props.push({
          id: `${player.id}-reb`,
          player: player.name,
          team: player.team?.abbreviation || "FA",
          stat: "Rebounds",
          line,
          odds: { over: -105, under: -115 },
          projection,
          edge,
        });
      }

      if (avgTpm > 2) {
        const line = Math.round(avgTpm * 2 - 0.5) / 2;
        const projection = Math.round(avgTpm * 10) / 10;
        const edge = Math.round((projection - line) * 10) / 10;

        props.push({
          id: `${player.id}-3pm`,
          player: player.name,
          team: player.team?.abbreviation || "FA",
          stat: "3-Pointers Made",
          line,
          odds: { over: -120, under: 100 },
          projection,
          edge,
        });
      }

      // PRA combos for star players
      if (avgPts > 20) {
        const pra = avgPts + avgReb + avgAst;
        const line = Math.round(pra * 2 - 0.5) / 2;
        const projection = Math.round(pra * 10) / 10;
        const edge = Math.round((projection - line) * 10) / 10;

        props.push({
          id: `${player.id}-pra`,
          player: player.name,
          team: player.team?.abbreviation || "FA",
          stat: "Pts+Reb+Ast",
          line,
          odds: { over: -110, under: -110 },
          projection,
          edge,
        });
      }
    }

    // Sort by edge (best value first)
    props.sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge));

    if (props.length === 0) {
      const liveProps = await generateLiveProps();
      if (liveProps.length > 0) {
        return NextResponse.json({
          success: true,
          props: liveProps,
          source: "espn_live",
        });
      }
      return NextResponse.json({
        success: true,
        props: [],
        source: "unavailable",
      });
    }

    return NextResponse.json({
      success: true,
      props: props.slice(0, 20),
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching player props:", error);
    try {
      const liveProps = await generateLiveProps();
      if (liveProps.length > 0) {
        return NextResponse.json({
          success: true,
          props: liveProps,
          source: "espn_live",
        });
      }
    } catch {
      // ESPN also failed
    }
    return NextResponse.json({
      success: true,
      props: [],
      source: "unavailable",
    });
  }
}

// Generate props from real ESPN season leader data
async function generateLiveProps(): Promise<PropBet[]> {
  const [scorers, rebounders, assisters] = await Promise.all([
    getLeagueLeaders("ppg", 15),
    getLeagueLeaders("rpg", 10),
    getLeagueLeaders("apg", 10),
  ]);

  const props: PropBet[] = [];

  for (const player of scorers.slice(0, 8)) {
    const line = Math.round(player.value * 2 - 0.5) / 2;
    props.push({
      id: `${player.playerId}-pts`,
      player: player.name,
      team: player.team,
      stat: "Points",
      line,
      odds: { over: -115, under: -105 },
      projection: player.value,
      edge: Math.round((player.value - line) * 10) / 10,
    });
  }

  for (const player of rebounders.slice(0, 5)) {
    if (player.value > 6) {
      const line = Math.round(player.value * 2 - 0.5) / 2;
      props.push({
        id: `${player.playerId}-reb`,
        player: player.name,
        team: player.team,
        stat: "Rebounds",
        line,
        odds: { over: -105, under: -115 },
        projection: player.value,
        edge: Math.round((player.value - line) * 10) / 10,
      });
    }
  }

  for (const player of assisters.slice(0, 5)) {
    if (player.value > 5) {
      const line = Math.round(player.value * 2 - 0.5) / 2;
      props.push({
        id: `${player.playerId}-ast`,
        player: player.name,
        team: player.team,
        stat: "Assists",
        line,
        odds: { over: -110, under: -110 },
        projection: player.value,
        edge: Math.round((player.value - line) * 10) / 10,
      });
    }
  }

  props.sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge));
  return props.slice(0, 20);
}
