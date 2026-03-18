import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { deepseek } from "@/lib/ai";
import { createNotification } from "@/lib/notifications/service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await resolvePredictions();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function resolvePredictions() {
  // Find PENDING predictions where the linked game is FINAL
  const pendingPredictions = await prisma.prediction.findMany({
    where: {
      status: "PENDING",
      game: {
        status: "FINAL",
      },
    },
    include: {
      game: {
        include: {
          homeTeam: true,
          awayTeam: true,
          playerStats: {
            include: {
              player: true,
            },
          },
        },
      },
    },
  });

  let resolvedCount = 0;
  let receiptCount = 0;
  let bustCount = 0;
  const errors: string[] = [];

  const systemPrompt =
    'You are a sports prediction judge. Given a prediction claim and actual game results, determine if the prediction was correct. Return JSON: { "verdict": "RECEIPT" | "BUST", "explanation": "brief reason" }';

  for (const prediction of pendingPredictions) {
    try {
      if (!prediction.game) continue;

      const game = prediction.game;

      // Build player stats string if the prediction references a player
      let playerStatsStr = "";
      if (prediction.playerId) {
        const relevantStats = game.playerStats.filter(
          (ps) => ps.playerId === prediction.playerId
        );
        if (relevantStats.length > 0) {
          const stat = relevantStats[0];
          playerStatsStr = `${stat.player.name}: ${stat.points} PTS, ${stat.rebounds} REB, ${stat.assists} AST, ${stat.steals} STL, ${stat.blocks} BLK, ${stat.turnovers} TO, ${stat.fgm}/${stat.fga} FG, ${stat.tpm}/${stat.tpa} 3PT, ${stat.ftm}/${stat.fta} FT, ${stat.minutes} MIN`;
        }
      } else {
        // Include top performers if no specific player
        const topStats = game.playerStats
          .sort((a, b) => b.points - a.points)
          .slice(0, 5)
          .map(
            (ps) =>
              `${ps.player.name}: ${ps.points} PTS, ${ps.rebounds} REB, ${ps.assists} AST`
          )
          .join("\n");
        if (topStats) {
          playerStatsStr = topStats;
        }
      }

      const userPrompt = `Prediction: ${prediction.claim}\n\nGame Result: ${game.homeTeam.name} ${game.homeScore} - ${game.awayTeam.name} ${game.awayScore}${playerStatsStr ? `\n\nPlayer Stats:\n${playerStatsStr}` : ""}`;

      const aiResponse = await deepseek.generate(userPrompt, systemPrompt, {
        temperature: 0.1,
        maxTokens: 200,
      });

      // Parse the AI response
      let verdict: "RECEIPT" | "BUST" = "BUST";
      let explanation = "";

      try {
        // Extract JSON from the response (handle markdown code blocks)
        const jsonMatch = aiResponse.content.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.verdict === "RECEIPT" || parsed.verdict === "BUST") {
            verdict = parsed.verdict;
          }
          explanation = parsed.explanation || "";
        }
      } catch {
        // If JSON parsing fails, try to infer from text
        if (aiResponse.content.toUpperCase().includes("RECEIPT")) {
          verdict = "RECEIPT";
        }
        explanation = "AI response parsing fallback";
      }

      // Update prediction
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          status: verdict,
          result: explanation,
          resolvedAt: new Date(),
        },
      });

      // Update user stats
      const userUpdate: { predictionCount: { increment: number }; correctPredictions?: { increment: number } } = {
        predictionCount: { increment: 1 },
      };
      if (verdict === "RECEIPT") {
        userUpdate.correctPredictions = { increment: 1 };
        receiptCount++;
      } else {
        bustCount++;
      }

      await prisma.user.update({
        where: { id: prediction.userId },
        data: userUpdate,
      });

      // Notify user about prediction resolution
      createNotification({
        userId: prediction.userId,
        type: "PREDICTION_RESOLVED",
        title: verdict === "RECEIPT" ? "RECEIPT! Your prediction was correct!" : "BUST! Your prediction was wrong",
        body: prediction.claim.slice(0, 100),
        data: { predictionId: prediction.id, takeId: prediction.takeId, verdict },
      }).catch(() => {});

      resolvedCount++;
    } catch (error) {
      const errMsg = `Failed to resolve prediction ${prediction.id}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errMsg);
      errors.push(errMsg);
    }
  }

  return {
    success: true,
    total: pendingPredictions.length,
    resolvedCount,
    receiptCount,
    bustCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}
