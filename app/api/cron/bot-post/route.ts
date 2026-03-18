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

async function runBotPosts() {
  const activeBots = await prisma.user.findMany({
    where: { isBot: true, botActive: true, status: "ACTIVE" },
    select: { id: true, name: true },
  });

  if (activeBots.length === 0) {
    return { success: true, posted: 0, reacted: 0 };
  }

  let posted = 0;
  let reacted = 0;
  let replied = 0;
  let reposted = 0;
  const errors: string[] = [];

  for (const bot of activeBots) {
    // Each bot has a 60% chance of posting each cycle
    if (Math.random() > 0.6) continue;

    try {
      const takeId = await postBotTake(bot.id);
      if (takeId) posted++;
    } catch (error) {
      errors.push(`Post failed for ${bot.name}: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      await botReactToTakes(bot.id);
      reacted++;
    } catch (error) {
      errors.push(`React failed for ${bot.name}: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      await botReplyToTakes(bot.id);
      replied++;
    } catch (error) {
      errors.push(`Reply failed for ${bot.name}: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      await botRepostTakes(bot.id);
      reposted++;
    } catch (error) {
      errors.push(`Repost failed for ${bot.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    success: true,
    totalBots: activeBots.length,
    posted,
    reacted,
    replied,
    reposted,
    errors: errors.length > 0 ? errors : undefined,
  };
}
