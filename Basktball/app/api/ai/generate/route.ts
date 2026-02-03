import { NextRequest, NextResponse } from "next/server";
import {
  generateGameRecap,
  generatePlayerAnalysis,
  generateBettingInsights,
  generateFantasyTips,
  generateTrendingStory,
  generateGamePrediction,
  saveGeneratedContent,
  ContentType,
} from "@/lib/ai";

export const dynamic = "force-dynamic";

type GenerateType = "game-recap" | "player-analysis" | "betting" | "fantasy" | "trending" | "prediction";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, save = false } = body as {
      type: GenerateType;
      data: Record<string, unknown>;
      save?: boolean;
    };

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: "Missing type or data" },
        { status: 400 }
      );
    }

    let result;
    let contentType: ContentType | null = null;

    switch (type) {
      case "game-recap":
        contentType = "GAME_RECAP";
        result = await generateGameRecap(data as Parameters<typeof generateGameRecap>[0]);
        break;

      case "player-analysis":
        contentType = "PLAYER_ANALYSIS";
        result = await generatePlayerAnalysis(data as Parameters<typeof generatePlayerAnalysis>[0]);
        break;

      case "betting":
        contentType = "BETTING";
        result = await generateBettingInsights(data as Parameters<typeof generateBettingInsights>[0]);
        break;

      case "fantasy":
        contentType = "FANTASY";
        result = await generateFantasyTips(data as Parameters<typeof generateFantasyTips>[0]);
        break;

      case "trending":
        contentType = "TRENDING";
        result = await generateTrendingStory(data as Parameters<typeof generateTrendingStory>[0]);
        break;

      case "prediction":
        result = await generateGamePrediction(data as Parameters<typeof generateGamePrediction>[0]);
        return NextResponse.json({
          success: true,
          type,
          prediction: result,
        });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown content type: ${type}` },
          { status: 400 }
        );
    }

    // Optionally save to database
    let insightId: string | undefined;
    if (save && contentType && "content" in result) {
      insightId = await saveGeneratedContent(contentType, result.content, {
        playerId: (data as { id?: string }).id,
        gameId: (data as { id?: string }).id,
        confidence: result.confidence,
        tokenUsage: result.tokenUsage,
        metadata: result.metadata,
      });
    }

    return NextResponse.json({
      success: true,
      type,
      ...result,
      insightId,
    });
  } catch (error) {
    console.error("AI generate error:", error);

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        {
          success: false,
          error: "AI service not configured. Please add DEEPSEEK_API_KEY to environment variables.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate content",
      },
      { status: 500 }
    );
  }
}
