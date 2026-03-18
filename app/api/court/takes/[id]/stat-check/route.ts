import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getDualUser } from "@/lib/court/dual-auth";
import { gemini } from "@/lib/ai/gemini";
import { createNotification } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

const STAT_CHECK_SYSTEM_PROMPT = `You are a basketball statistics fact-checker. Extract statistical claims from this post, then verify each against the provided data. Return JSON: { "claims": [{ "claim": "...", "verdict": "VERIFIED" | "FALSE" | "UNVERIFIABLE", "evidence": "..." }], "overall": "VERIFIED" | "FALSE" | "UNVERIFIABLE" }`;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const statCheck = await prisma.statCheck.findUnique({
      where: { takeId: id },
      include: {
        take: {
          select: {
            id: true,
            content: true,
            authorId: true,
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            image: true,
          },
        },
      },
    });

    if (!statCheck) {
      return NextResponse.json({ statCheck: null });
    }

    return NextResponse.json({ statCheck });
  } catch (error) {
    console.error("Get stat check error:", error);
    return NextResponse.json(
      { message: "Failed to load stat check" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDualUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Load the take with associated game and player data
    const take = await prisma.take.findUnique({
      where: { id, isDeleted: false },
      include: {
        author: {
          select: { id: true, displayName: true, name: true },
        },
      },
    });

    if (!take) {
      return NextResponse.json(
        { message: "Take not found" },
        { status: 404 }
      );
    }

    // Gather real stats context if the take references a game
    let statsContext = "";

    if (take.gameId) {
      const game = await prisma.game.findUnique({
        where: { id: take.gameId },
        include: {
          homeTeam: { select: { name: true, abbreviation: true } },
          awayTeam: { select: { name: true, abbreviation: true } },
        },
      });

      if (game) {
        statsContext += `\nGame: ${game.awayTeam.name} @ ${game.homeTeam.name} (${game.status})`;
        if (game.homeScore !== null && game.awayScore !== null) {
          statsContext += ` | Score: ${game.awayTeam.abbreviation} ${game.awayScore} - ${game.homeTeam.abbreviation} ${game.homeScore}`;
        }

        // Get player stats for this game
        const playerStats = await prisma.playerStat.findMany({
          where: { gameId: take.gameId },
          include: {
            player: { select: { name: true, position: true } },
          },
          orderBy: { points: "desc" },
          take: 10,
        });

        if (playerStats.length > 0) {
          statsContext += "\n\nPlayer Stats:";
          for (const ps of playerStats) {
            statsContext += `\n- ${ps.player.name} (${ps.player.position}): ${ps.points} PTS, ${ps.rebounds} REB, ${ps.assists} AST, ${ps.steals} STL, ${ps.blocks} BLK, ${ps.fgm}/${ps.fga} FG, ${ps.tpm}/${ps.tpa} 3PT, ${ps.ftm}/${ps.fta} FT, ${ps.minutes} MIN`;
          }
        }

        // Get team stats for this game
        const teamStats = await prisma.teamStat.findMany({
          where: { gameId: take.gameId },
          include: {
            team: { select: { name: true, abbreviation: true } },
          },
        });

        if (teamStats.length > 0) {
          statsContext += "\n\nTeam Stats:";
          for (const ts of teamStats) {
            statsContext += `\n- ${ts.team.name}: ${ts.points} PTS, ${ts.rebounds} REB, ${ts.assists} AST, ${ts.fgm}/${ts.fga} FG, ${ts.tpm}/${ts.tpa} 3PT`;
          }
        }
      }
    }

    const userPrompt = `Take content: "${take.content}"${
      statsContext
        ? `\n\nAvailable verified statistics:\n${statsContext}`
        : "\n\nNo specific game statistics available for verification."
    }`;

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { message: "AI service not configured. Add GEMINI_API_KEY to environment." },
        { status: 503 }
      );
    }

    // Call Gemini AI for fact-checking
    const aiResult = await gemini.generate(
      userPrompt,
      STAT_CHECK_SYSTEM_PROMPT,
      { temperature: 0.3, maxTokens: 1000 }
    );

    // Parse the AI response
    let claims: Array<{ claim: string; verdict: string; evidence: string }> = [];
    let overall: string = "UNVERIFIABLE";

    try {
      // Extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        claims = parsed.claims || [];
        overall = parsed.overall || "UNVERIFIABLE";
      }
    } catch {
      // If parsing fails, create a single claim from the raw response
      claims = [
        {
          claim: "Could not parse AI response",
          verdict: "UNVERIFIABLE",
          evidence: aiResult.content,
        },
      ];
      overall = "UNVERIFIABLE";
    }

    // Map overall status to enum
    const overallStatusMap: Record<string, "VERIFIED" | "FALSE" | "UNVERIFIABLE" | "PENDING"> = {
      VERIFIED: "VERIFIED",
      FALSE: "FALSE",
      UNVERIFIABLE: "UNVERIFIABLE",
    };
    const overallStatus = overallStatusMap[overall] || "UNVERIFIABLE";

    // Create or update the StatCheck record
    const statCheck = await prisma.statCheck.upsert({
      where: { takeId: id },
      create: {
        takeId: id,
        userId: user.id,
        claims: claims,
        overallStatus,
        aiResponse: aiResult.content,
        checkedAt: new Date(),
      },
      update: {
        userId: user.id,
        claims: claims,
        overallStatus,
        aiResponse: aiResult.content,
        checkedAt: new Date(),
      },
    });

    // Notify take author about stat check result
    if (take.author.id !== user.id) {
      createNotification({
        userId: take.author.id,
        type: "STAT_CHECK",
        title: `Stat Check: ${overallStatus}`,
        body: take.content.slice(0, 100),
        data: { takeId: id, status: overallStatus },
        actorId: user.id,
      }).catch(() => {});
    }

    return NextResponse.json({
      statCheck,
      tokenUsage: {
        total: aiResult.tokenUsage,
        prompt: aiResult.promptTokens,
        completion: aiResult.completionTokens,
      },
    });
  } catch (error) {
    console.error("Stat check error:", error);
    return NextResponse.json(
      { message: "Failed to run stat check" },
      { status: 500 }
    );
  }
}
