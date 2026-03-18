import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { postBotTake, botReactToTakes, botReplyToTakes, botRepostTakes } from "@/lib/bots/engine";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBotPosts();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Bot post cron failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function runBotPosts() {
  const activeBots = await prisma.user.findMany({
    where: { isBot: true, botActive: true, status: "ACTIVE" },
    select: { id: true, name: true, lastActiveAt: true },
  });

  if (activeBots.length === 0) {
    return { success: true, posted: 0, reacted: 0 };
  }

  // Stagger: pick 1-2 random bots per run instead of all at once
  // This runs every hour, so each bot posts ~2-4 times per day with natural spacing
  const maxBotsPerRun = Math.min(2, activeBots.length);
  const numBots = Math.random() < 0.5 ? 1 : maxBotsPerRun;
  const shuffled = shuffleArray(activeBots);
  const selectedBots = shuffled.slice(0, numBots);

  let posted = 0;
  let reacted = 0;
  let replied = 0;
  let reposted = 0;
  const errors: string[] = [];

  for (const bot of selectedBots) {
    // 70% chance to post a new take
    if (Math.random() < 0.7) {
      try {
        const takeId = await postBotTake(bot.id);
        if (takeId) posted++;
      } catch (error) {
        errors.push(`Post failed for ${bot.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 60% chance to react to some takes
    if (Math.random() < 0.6) {
      try {
        await botReactToTakes(bot.id);
        reacted++;
      } catch (error) {
        errors.push(`React failed for ${bot.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 40% chance to reply
    if (Math.random() < 0.4) {
      try {
        await botReplyToTakes(bot.id);
        replied++;
      } catch (error) {
        errors.push(`Reply failed for ${bot.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 25% chance to repost
    if (Math.random() < 0.25) {
      try {
        await botRepostTakes(bot.id);
        reposted++;
      } catch (error) {
        errors.push(`Repost failed for ${bot.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Update last active timestamp
    await prisma.user.update({
      where: { id: bot.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {});
  }

  return {
    success: true,
    totalBots: activeBots.length,
    selectedBots: selectedBots.map((b) => b.name),
    posted,
    reacted,
    replied,
    reposted,
    errors: errors.length > 0 ? errors : undefined,
  };
}
