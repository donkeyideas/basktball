import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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

// POST - Generate AI prediction for a matchup
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

    // Get team data
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

    // Get recent team stats
    const [homeStats, awayStats] = await Promise.all([
      prisma.teamStat.findMany({
        where: { teamId: homeTeamId },
        orderBy: { game: { gameDate: "desc" } },
        take: 10,
        include: { game: true },
      }),
      prisma.teamStat.findMany({
        where: { teamId: awayTeamId },
        orderBy: { game: { gameDate: "desc" } },
        take: 10,
        include: { game: true },
      }),
    ]);

    // Calculate averages
    const calcAvg = (stats: typeof homeStats, field: keyof (typeof homeStats)[0]) => {
      if (stats.length === 0) return 0;
      return stats.reduce((sum, s) => sum + (Number(s[field]) || 0), 0) / stats.length;
    };

    const homePpg = calcAvg(homeStats, "points") || 110;
    const awayPpg = calcAvg(awayStats, "points") || 108;
    const homeOffRtg = calcAvg(homeStats, "offensiveRating") || 112;
    const homeDefRtg = calcAvg(homeStats, "defensiveRating") || 110;
    const awayOffRtg = calcAvg(awayStats, "offensiveRating") || 111;
    const awayDefRtg = calcAvg(awayStats, "defensiveRating") || 111;

    // Calculate predictions
    const homeAdvantage = 3.5;

    // Predict scores based on offensive/defensive ratings
    const predictedHomeScore = Math.round(
      ((homeOffRtg + awayDefRtg) / 2) * 0.01 * 100 + homeAdvantage
    );
    const predictedAwayScore = Math.round(
      ((awayOffRtg + homeDefRtg) / 2) * 0.01 * 100
    );

    const scoreDiff = predictedHomeScore - predictedAwayScore;
    const homeWinProb = Math.min(85, Math.max(15, 50 + scoreDiff * 3));

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
        impact: Math.round((homePpg - awayPpg) / 5 * 10) / 10,
        description: `Last 10 games scoring: ${homeTeam.abbreviation} ${homePpg.toFixed(1)} PPG vs ${awayTeam.abbreviation} ${awayPpg.toFixed(1)} PPG`,
      },
      {
        name: "Sample Size",
        impact: homeStats.length >= 5 ? 0 : -1,
        description: `Based on ${Math.min(homeStats.length, awayStats.length)} games of data`,
      },
    ];

    // Calculate confidence based on data quality
    const confidence = Math.min(85, 60 + Math.min(homeStats.length, awayStats.length) * 2);

    const prediction: Prediction = {
      homeWinProb: Math.round(homeWinProb),
      awayWinProb: Math.round(100 - homeWinProb),
      predictedHomeScore,
      predictedAwayScore,
      spread: -(predictedHomeScore - predictedAwayScore),
      total: predictedHomeScore + predictedAwayScore,
      confidence,
      factors,
    };

    // Optional AI analysis
    if (useAI) {
      try {
        const prompt = `Analyze this NBA matchup:

Home Team: ${homeTeam.name} (${homeTeam.abbreviation})
- Recent PPG: ${homePpg.toFixed(1)}
- Offensive Rating: ${homeOffRtg.toFixed(1)}
- Defensive Rating: ${homeDefRtg.toFixed(1)}

Away Team: ${awayTeam.name} (${awayTeam.abbreviation})
- Recent PPG: ${awayPpg.toFixed(1)}
- Offensive Rating: ${awayOffRtg.toFixed(1)}
- Defensive Rating: ${awayDefRtg.toFixed(1)}

Predicted Score: ${predictedHomeScore}-${predictedAwayScore}

Provide a brief 2-3 sentence analysis of this matchup focusing on key factors that could influence the outcome.`;

        const aiResponse = await deepseek.generate(prompt, undefined, {
          temperature: 0.7,
          maxTokens: 150,
        });

        prediction.aiAnalysis = aiResponse.content;
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
        // Continue without AI analysis
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
