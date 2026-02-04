import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface TeamAnalytics {
  id: string;
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  ppg: number;
  oppPpg: number;
  pace: number;
  offRtg: number;
  defRtg: number;
  netRtg: number;
  efgPct: number;
  tovPct: number;
  orbPct: number;
  ftRate: number;
}

// GET - Fetch team analytics with advanced stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const league = searchParams.get("league") || "NBA";

    // Get all teams with their stats
    const teams = await prisma.team.findMany({
      where: {
        league: league.toUpperCase() as any,
      },
      include: {
        homeGames: {
          where: { status: "FINAL" },
          select: { homeScore: true, awayScore: true },
        },
        awayGames: {
          where: { status: "FINAL" },
          select: { homeScore: true, awayScore: true },
        },
        teamStats: {
          take: 20,
          orderBy: { game: { gameDate: "desc" } },
        },
      },
    });

    const analytics: TeamAnalytics[] = teams.map((team) => {
      // Calculate wins/losses
      const homeWins = team.homeGames.filter((g) => (g.homeScore || 0) > (g.awayScore || 0)).length;
      const awayWins = team.awayGames.filter((g) => (g.awayScore || 0) > (g.homeScore || 0)).length;
      const wins = homeWins + awayWins;
      const losses = team.homeGames.length + team.awayGames.length - wins;

      // Calculate stats from team stats
      const stats = team.teamStats;
      const gamesPlayed = stats.length || 1;

      const ppg = stats.reduce((s, st) => s + st.points, 0) / gamesPlayed;
      const offRtg = stats.reduce((s, st) => s + (st.offensiveRating || 0), 0) / gamesPlayed || 110;
      const defRtg = stats.reduce((s, st) => s + (st.defensiveRating || 0), 0) / gamesPlayed || 110;
      const pace = stats.reduce((s, st) => s + (st.pace || 0), 0) / gamesPlayed || 100;

      // Calculate opponent PPG from games
      let oppPoints = 0;
      team.homeGames.forEach((g) => (oppPoints += g.awayScore || 0));
      team.awayGames.forEach((g) => (oppPoints += g.homeScore || 0));
      const oppPpg = (team.homeGames.length + team.awayGames.length) > 0
        ? oppPoints / (team.homeGames.length + team.awayGames.length)
        : 110;

      // Calculate four factors
      const totalFgm = stats.reduce((s, st) => s + st.fgm, 0);
      const totalFga = stats.reduce((s, st) => s + st.fga, 0);
      const totalTpm = stats.reduce((s, st) => s + st.tpm, 0);
      const totalTov = stats.reduce((s, st) => s + st.turnovers, 0);
      const totalReb = stats.reduce((s, st) => s + st.rebounds, 0);
      const totalFtm = stats.reduce((s, st) => s + st.ftm, 0);

      const efgPct = totalFga > 0 ? ((totalFgm + 0.5 * totalTpm) / totalFga) * 100 : 50;
      const tovPct = totalFga > 0 ? (totalTov / (totalFga + 0.44 * stats.reduce((s, st) => s + st.fta, 0) + totalTov)) * 100 : 12;
      const orbPct = 25; // Would need opponent data to calculate properly
      const ftRate = totalFga > 0 ? stats.reduce((s, st) => s + st.fta, 0) / totalFga : 0.22;

      return {
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        wins,
        losses,
        ppg: Math.round(ppg * 10) / 10 || 110,
        oppPpg: Math.round(oppPpg * 10) / 10 || 108,
        pace: Math.round(pace * 10) / 10 || 100,
        offRtg: Math.round(offRtg * 10) / 10 || 110,
        defRtg: Math.round(defRtg * 10) / 10 || 110,
        netRtg: Math.round((offRtg - defRtg) * 10) / 10,
        efgPct: Math.round(efgPct * 10) / 10,
        tovPct: Math.round(tovPct * 10) / 10,
        orbPct: Math.round(orbPct * 10) / 10,
        ftRate: Math.round(ftRate * 1000) / 1000,
      };
    });

    // Sort by net rating
    analytics.sort((a, b) => b.netRtg - a.netRtg);

    if (analytics.length === 0) {
      return NextResponse.json({
        success: true,
        teams: getFallbackTeams(),
        source: "fallback",
      });
    }

    return NextResponse.json({
      success: true,
      teams: analytics,
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching team analytics:", error);
    return NextResponse.json({
      success: true,
      teams: getFallbackTeams(),
      source: "fallback",
    });
  }
}

function getFallbackTeams(): TeamAnalytics[] {
  return [
    { id: "1", name: "Boston Celtics", abbreviation: "BOS", wins: 42, losses: 12, ppg: 120.5, oppPpg: 109.2, pace: 100.8, offRtg: 119.5, defRtg: 108.2, netRtg: 11.3, efgPct: 58.2, tovPct: 12.1, orbPct: 24.5, ftRate: 0.232 },
    { id: "2", name: "Oklahoma City Thunder", abbreviation: "OKC", wins: 40, losses: 14, ppg: 119.8, oppPpg: 108.5, pace: 99.8, offRtg: 120.0, defRtg: 108.6, netRtg: 11.4, efgPct: 57.2, tovPct: 12.5, orbPct: 28.2, ftRate: 0.228 },
    { id: "3", name: "Denver Nuggets", abbreviation: "DEN", wins: 38, losses: 16, ppg: 115.8, oppPpg: 110.5, pace: 98.2, offRtg: 117.8, defRtg: 112.3, netRtg: 5.5, efgPct: 56.8, tovPct: 13.2, orbPct: 26.8, ftRate: 0.215 },
    { id: "4", name: "Cleveland Cavaliers", abbreviation: "CLE", wins: 37, losses: 17, ppg: 114.2, oppPpg: 107.8, pace: 97.5, offRtg: 117.0, defRtg: 110.5, netRtg: 6.5, efgPct: 56.2, tovPct: 11.5, orbPct: 27.5, ftRate: 0.205 },
    { id: "5", name: "Milwaukee Bucks", abbreviation: "MIL", wins: 36, losses: 18, ppg: 118.2, oppPpg: 113.8, pace: 101.5, offRtg: 116.4, defRtg: 112.0, netRtg: 4.4, efgPct: 55.5, tovPct: 11.8, orbPct: 25.2, ftRate: 0.248 },
    { id: "6", name: "Phoenix Suns", abbreviation: "PHX", wins: 32, losses: 22, ppg: 116.5, oppPpg: 114.2, pace: 100.2, offRtg: 116.2, defRtg: 113.8, netRtg: 2.4, efgPct: 55.8, tovPct: 13.8, orbPct: 23.8, ftRate: 0.218 },
    { id: "7", name: "Los Angeles Lakers", abbreviation: "LAL", wins: 30, losses: 24, ppg: 115.2, oppPpg: 113.5, pace: 99.5, offRtg: 115.8, defRtg: 114.0, netRtg: 1.8, efgPct: 54.8, tovPct: 14.2, orbPct: 26.2, ftRate: 0.235 },
    { id: "8", name: "Miami Heat", abbreviation: "MIA", wins: 28, losses: 26, ppg: 110.8, oppPpg: 110.2, pace: 96.8, offRtg: 114.4, defRtg: 113.8, netRtg: 0.6, efgPct: 53.5, tovPct: 12.8, orbPct: 24.2, ftRate: 0.198 },
  ];
}
