import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { StreakType } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await computeStreaks();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function computeStreaks() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find all users who have takes in the last 7 days with 2+ total reactions
  const usersWithRecentTakes = await prisma.user.findMany({
    where: {
      takes: {
        some: {
          createdAt: { gte: sevenDaysAgo },
          isDeleted: false,
        },
      },
    },
    select: { id: true },
  });

  const userIds = usersWithRecentTakes.map((u) => u.id);

  let updatedCount = 0;

  for (const userId of userIds) {
    // Get last 10 takes from the past 7 days that have 2+ total reactions
    const qualifyingTakes = await prisma.take.findMany({
      where: {
        authorId: userId,
        createdAt: { gte: sevenDaysAgo },
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fireCount: true,
        brickCount: true,
      },
    });

    // Filter to takes with 2+ total reactions
    const reacted = qualifyingTakes.filter(
      (t) => t.fireCount + t.brickCount >= 2
    );

    if (reacted.length === 0) {
      // No qualifying takes - reset to neutral
      await prisma.user.update({
        where: { id: userId },
        data: { streakType: StreakType.NEUTRAL, streakCount: 0 },
      });
      updatedCount++;
      continue;
    }

    // Take last 10 qualifying takes
    const last10 = reacted.slice(0, 10);

    // Compute fire ratio
    const totalFire = last10.reduce((sum, t) => sum + t.fireCount, 0);
    const totalBrick = last10.reduce((sum, t) => sum + t.brickCount, 0);
    const totalReactions = totalFire + totalBrick;
    const fireRatio = totalReactions > 0 ? totalFire / totalReactions : 0.5;

    let streakType: StreakType;
    if (fireRatio >= 0.7) {
      streakType = StreakType.HOT;
    } else if (fireRatio <= 0.3) {
      streakType = StreakType.COLD;
    } else {
      streakType = StreakType.NEUTRAL;
    }

    // Compute streak count: consecutive takes from most recent matching the streak direction
    let streakCount = 0;
    if (streakType === StreakType.HOT) {
      // Count consecutive takes where fire > brick
      for (const take of reacted) {
        if (take.fireCount > take.brickCount) {
          streakCount++;
        } else {
          break;
        }
      }
    } else if (streakType === StreakType.COLD) {
      // Count consecutive takes where brick > fire
      for (const take of reacted) {
        if (take.brickCount > take.fireCount) {
          streakCount++;
        } else {
          break;
        }
      }
    } else {
      streakCount = 0;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { streakType, streakCount },
    });
    updatedCount++;
  }

  // Reset users with no recent qualifying takes who still have a streak
  const resetResult = await prisma.user.updateMany({
    where: {
      id: { notIn: userIds },
      OR: [
        { streakType: { not: StreakType.NEUTRAL } },
        { streakCount: { gt: 0 } },
      ],
    },
    data: { streakType: StreakType.NEUTRAL, streakCount: 0 },
  });

  return {
    success: true,
    updatedCount,
    resetCount: resetResult.count,
  };
}
