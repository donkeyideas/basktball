import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getTeamAnalytics } from "@/lib/api/live-stats";
import { deepseek } from "@/lib/ai";

interface Prediction {
  homeWinProb: number;
  awayWinProb: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  spread: number;
  total: number;
  confidence: number;
  factors: { name: string; impact: number; description: string }[];
  aiAnalysis?: string;
}

// POST - Generate prediction for a matchup using live ESPN data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeTeamId, awayTeamId, useAI = false } = body;

    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json(
        { success: false, error: "Both homeTeamId and awayTeamId are required" },
        { status: 400 }
      );
    }

    // Get team data from DB (for names/abbreviations)
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: homeTeamId } }),
      prisma.team.findUnique({ where: { id: awayTeamId } }),
    ]);

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { success: false, error: "One or both teams not found" },
        { status: 404 }
      );
    }

    // Fetch real team stats from ESPN
    const espnTeams = await getTeamAnalytics();
    const espnHome = espnTeams.find(
      (t) => t.abbreviation === homeTeam.abbreviation
    );
    const espnAway = espnTeams.find(
      (t) => t.abbreviation === awayTeam.abbreviation
    );

    // Use real data or sensible per-team fallbacks
    const homePpg = espnHome?.ppg || 110;
    const awayPpg = espnAway?.ppg || 108;
    const homeOppPpg = espnHome?.oppPpg || 110;
    const awayOppPpg = espnAway?.oppPpg || 110;
    const homeWins = espnHome?.wins || 0;
    const homeLosses = espnHome?.losses || 0;
    const awayWins = espnAway?.wins || 0;
    const awayLosses = espnAway?.losses || 0;
    const homeOffRtg = espnHome?.offRtg || 110;
    const homeDefRtg = espnHome?.defRtg || 110;
    const awayOffRtg = espnAway?.offRtg || 110;
    const awayDefRtg = espnAway?.defRtg || 110;

    const homeGames = homeWins + homeLosses;
    const awayGames = awayWins + awayLosses;
    const homeWinPct = homeGames > 0 ? homeWins / homeGames : 0.5;
    const awayWinPct = awayGames > 0 ? awayWins / awayGames : 0.5;

    // --- Calculate predictions ---
    const homeAdvantage = 3.5;

    // Predict scores: average of team's offense vs opponent's defense
    const predictedHomeScore = Math.round(
      (homePpg + awayOppPpg) / 2 + homeAdvantage / 2
    );
    const predictedAwayScore = Math.round(
      (awayPpg + homeOppPpg) / 2 - homeAdvantage / 2
    );

    // Win probability from win% differential + home advantage
    const winPctDiff = (homeWinPct - awayWinPct) * 100;
    const scoreDiff = predictedHomeScore - predictedAwayScore;
    const homeWinProb = Math.min(
      85,
      Math.max(15, 50 + scoreDiff * 2.5 + winPctDiff * 0.3)
    );

    // Calculate factors
    const factors = [
      {
        name: "Home Court Advantage",
        impact: homeAdvantage,
        description: "Historical home win rate and crowd factor",
      },
      {
        name: "Offensive Rating",
        impact: Math.round((homeOffRtg - awayOffRtg) * 10) / 10,
        description: `${homeTeam.abbreviation}: ${homeOffRtg.toFixed(1)} vs ${awayTeam.abbreviation}: ${awayOffRtg.toFixed(1)}`,
      },
      {
        name: "Defensive Rating",
        impact: Math.round((awayDefRtg - homeDefRtg) * 10) / 10,
        description: `${homeTeam.abbreviation}: ${homeDefRtg.toFixed(1)} vs ${awayTeam.abbreviation}: ${awayDefRtg.toFixed(1)}`,
      },
      {
        name: "Recent Form",
        impact: Math.round((homeWinPct - awayWinPct) * 50) / 10,
        description: `${homeTeam.abbreviation} ${homeWins}-${homeLosses} (${(homeWinPct * 100).toFixed(0)}%) vs ${awayTeam.abbreviation} ${awayWins}-${awayLosses} (${(awayWinPct * 100).toFixed(0)}%)`,
      },
      {
        name: "Scoring Pace",
        impact: Math.round((homePpg - awayPpg) * 10) / 10,
        description: `${homeTeam.abbreviation} ${homePpg.toFixed(1)} PPG vs ${awayTeam.abbreviation} ${awayPpg.toFixed(1)} PPG`,
      },
    ];

    // Confidence based on whether we have real data
    const hasData = espnHome && espnAway && homeGames > 0 && awayGames > 0;
    const confidence = hasData ? Math.min(85, 65 + Math.min(homeGames, awayGames) * 0.2) : 40;

    const prediction: Prediction = {
      homeWinProb: Math.round(homeWinProb),
      awayWinProb: Math.round(100 - homeWinProb),
      predictedHomeScore,
      predictedAwayScore,
      spread: -(predictedHomeScore - predictedAwayScore),
      total: predictedHomeScore + predictedAwayScore,
      confidence: Math.round(confidence),
      factors,
    };

    // Optional AI analysis
    if (useAI) {
      try {
        const prompt = `Analyze this NBA matchup:

Home Team: ${homeTeam.name} (${homeTeam.abbreviation}) — Record: ${homeWins}-${homeLosses}
- PPG: ${homePpg.toFixed(1)}, Opp PPG: ${homeOppPpg.toFixed(1)}
- Offensive Rating: ${homeOffRtg.toFixed(1)}, Defensive Rating: ${homeDefRtg.toFixed(1)}

Away Team: ${awayTeam.name} (${awayTeam.abbreviation}) — Record: ${awayWins}-${awayLosses}
- PPG: ${awayPpg.toFixed(1)}, Opp PPG: ${awayOppPpg.toFixed(1)}
- Offensive Rating: ${awayOffRtg.toFixed(1)}, Defensive Rating: ${awayDefRtg.toFixed(1)}

Predicted Score: ${predictedHomeScore}-${predictedAwayScore}

Provide a brief 2-3 sentence analysis of this matchup focusing on key factors that could influence the outcome.`;

        const aiResponse = await deepseek.generate(prompt, undefined, {
          temperature: 0.7,
          maxTokens: 150,
        });

        prediction.aiAnalysis = aiResponse.content;
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
      }
    }

    return NextResponse.json({
      success: true,
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        abbreviation: homeTeam.abbreviation,
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        abbreviation: awayTeam.abbreviation,
      },
      prediction,
    });
  } catch (error) {
    console.error("Error generating prediction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}
