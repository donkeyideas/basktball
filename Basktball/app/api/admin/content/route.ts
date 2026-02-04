import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get all content
    const allContent = await prisma.aiInsight.findMany({
      include: {
        player: { select: { name: true } },
        game: {
          select: {
            homeTeam: { select: { abbreviation: true } },
            awayTeam: { select: { abbreviation: true } },
          },
        },
      },
      orderBy: { generatedAt: "desc" },
      take: 100,
    });

    const formattedContent = allContent.map((insight) => ({
      id: insight.id,
      title: insight.title || null,
      type: insight.type,
      content: insight.content,
      approved: insight.approved,
      generatedAt: insight.generatedAt.toISOString(),
      player: insight.player,
      game: insight.game,
    }));

    return NextResponse.json({
      success: true,
      content: formattedContent,
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing content ID" },
        { status: 400 }
      );
    }

    await prisma.aiInsight.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete content" },
      { status: 500 }
    );
  }
}
