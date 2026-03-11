import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { deepseek } from "@/lib/ai/deepseek";
import { generateSlug } from "@/lib/forum/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the bot user
    const botUser = await prisma.user.findUnique({
      where: { email: "bot@basktball.com" },
    });

    if (!botUser) {
      return NextResponse.json({ error: "Bot user not found" }, { status: 500 });
    }

    // Get NBA Discussion category
    const category = await prisma.forumCategory.findUnique({
      where: { slug: "nba-discussion" },
    });

    if (!category) {
      return NextResponse.json({ error: "NBA Discussion category not found" }, { status: 500 });
    }

    // Get yesterday's games
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

    const games = await prisma.game.findMany({
      where: {
        gameDate: { gte: startOfDay, lte: endOfDay },
        status: "FINAL",
        league: "NBA",
      },
      select: {
        homeTeam: { select: { name: true, abbreviation: true } },
        awayTeam: { select: { name: true, abbreviation: true } },
        homeScore: true,
        awayScore: true,
      },
      take: 15,
    });

    let gamesContext = "No NBA games were played yesterday.";
    if (games.length > 0) {
      gamesContext = games
        .map((g) => `${g.awayTeam.name} ${g.awayScore} - ${g.homeScore} ${g.homeTeam.name}`)
        .join("\n");
    }

    const result = await deepseek.generate(
      `Based on yesterday's NBA results, generate an engaging daily discussion topic for a basketball forum.\n\nYesterday's scores:\n${gamesContext}\n\nCreate a discussion prompt with:\n1. A catchy title (under 100 chars)\n2. A 2-3 sentence post body that sparks debate\n\nFormat your response as:\nTITLE: [your title]\nBODY: [your post body]`,
      "You are a basketball discussion moderator who creates daily engaging posts for a forum. Focus on the biggest storylines, upsets, or standout performances. Make it conversational and invite hot takes. If no games were played, create a discussion about a trending basketball topic.",
      { maxTokens: 300, temperature: 0.8 }
    );

    // Parse the AI response
    const titleMatch = result.content.match(/TITLE:\s*(.+)/i);
    const bodyMatch = result.content.match(/BODY:\s*([\s\S]+)/i);

    const title = titleMatch?.[1]?.trim() || "Daily Discussion Thread";
    const body = bodyMatch?.[1]?.trim() || result.content;

    // Unpin yesterday's daily discussion
    await prisma.forumThread.updateMany({
      where: {
        authorId: botUser.id,
        categoryId: category.id,
        isPinned: true,
      },
      data: { isPinned: false },
    });

    // Create the new thread
    const slug = generateSlug(title);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const thread = await tx.forumThread.create({
        data: {
          title,
          slug,
          categoryId: category.id,
          authorId: botUser.id,
          isPinned: true,
          tags: ["daily-discussion", "bot-generated"],
          postCount: 1,
          lastPostAt: now,
          lastPostBy: botUser.id,
        },
      });

      await tx.forumPost.create({
        data: {
          content: body,
          threadId: thread.id,
          authorId: botUser.id,
          postNumber: 1,
        },
      });

      await tx.forumCategory.update({
        where: { id: category.id },
        data: {
          threadCount: { increment: 1 },
          postCount: { increment: 1 },
        },
      });
    });

    return NextResponse.json({ success: true, title, tokenUsage: result.tokenUsage });
  } catch (error) {
    console.error("Error creating daily discussion:", error);
    return NextResponse.json({ error: "Failed to create daily discussion" }, { status: 500 });
  }
}
