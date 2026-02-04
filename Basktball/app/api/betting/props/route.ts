import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

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
      return NextResponse.json({
        success: true,
        props: getFallbackProps(),
        source: "fallback",
      });
    }

    return NextResponse.json({
      success: true,
      props: props.slice(0, 20),
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching player props:", error);
    return NextResponse.json({
      success: true,
      props: getFallbackProps(),
      source: "fallback",
    });
  }
}

function getFallbackProps(): PropBet[] {
  return [
    { id: "1", player: "Jayson Tatum", team: "BOS", stat: "Points", line: 28.5, odds: { over: -115, under: -105 }, projection: 31.2, edge: 2.7 },
    { id: "2", player: "Nikola Jokic", team: "DEN", stat: "Assists", line: 8.5, odds: { over: -110, under: -110 }, projection: 9.8, edge: 1.3 },
    { id: "3", player: "Giannis Antetokounmpo", team: "MIL", stat: "Rebounds", line: 11.5, odds: { over: -105, under: -115 }, projection: 12.8, edge: 1.3 },
    { id: "4", player: "Stephen Curry", team: "GSW", stat: "3-Pointers Made", line: 4.5, odds: { over: -120, under: 100 }, projection: 5.2, edge: 0.7 },
    { id: "5", player: "LeBron James", team: "LAL", stat: "Pts+Reb+Ast", line: 45.5, odds: { over: -110, under: -110 }, projection: 48.5, edge: 3.0 },
    { id: "6", player: "Luka Doncic", team: "DAL", stat: "Points", line: 32.5, odds: { over: -110, under: -110 }, projection: 34.2, edge: 1.7 },
    { id: "7", player: "Shai Gilgeous-Alexander", team: "OKC", stat: "Points", line: 30.5, odds: { over: -115, under: -105 }, projection: 31.8, edge: 1.3 },
    { id: "8", player: "Anthony Edwards", team: "MIN", stat: "Points", line: 25.5, odds: { over: -110, under: -110 }, projection: 27.1, edge: 1.6 },
  ];
}
