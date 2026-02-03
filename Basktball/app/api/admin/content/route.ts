import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get pending content (not yet approved)
    const pendingContent = await prisma.aiInsight.findMany({
      where: {
        approved: false,
      },
      include: {
        player: { select: { name: true } },
        game: {
          select: {
            homeTeam: { select: { abbreviation: true } },
            awayTeam: { select: { abbreviation: true } },
            gameDate: true,
          },
        },
      },
      orderBy: { generatedAt: "desc" },
      take: 50,
    });

    // Get stats for today
    const approvedToday = await prisma.aiInsight.count({
      where: {
        approved: true,
        updatedAt: { gte: today },
      },
    });

    const totalApproved = await prisma.aiInsight.count({
      where: { approved: true },
    });

    const totalRejected = await prisma.aiInsight.count({
      where: { approved: false, published: false },
    });

    const formattedContent = pendingContent.map((insight) => {
      const gameInfo = insight.game
        ? `${insight.game.awayTeam.abbreviation} @ ${insight.game.homeTeam.abbreviation} - ${new Date(insight.game.gameDate).toLocaleDateString()}`
        : null;

      return {
        id: insight.id,
        type: insight.type,
        content: insight.content,
        confidence: insight.confidence || 0,
        generatedAt: insight.generatedAt.toISOString(),
        metadata: {
          playerName: insight.player?.name || null,
          gameInfo,
          issues: insight.confidence && insight.confidence < 0.7 ? ["Low confidence score"] : [],
        },
      };
    });

    const avgConfidence = pendingContent.length > 0
      ? pendingContent.reduce((sum, c) => sum + (c.confidence || 0), 0) / pendingContent.length
      : 0;

    return NextResponse.json({
      success: true,
      pendingContent: formattedContent,
      stats: {
        pending: pendingContent.length,
        approvedToday,
        totalApproved,
        totalRejected,
        avgConfidence: parseFloat((avgConfidence * 100).toFixed(0)),
      },
    });
  } catch (error) {
    console.error("Content API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch content data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action, content } = body;

    if (action === "approve") {
      await prisma.aiInsight.update({
        where: { id },
        data: {
          approved: true,
          published: true,
          content: content || undefined,
        },
      });
    } else if (action === "reject") {
      await prisma.aiInsight.update({
        where: { id },
        data: {
          approved: false,
          published: false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update content" },
      { status: 500 }
    );
  }
}
