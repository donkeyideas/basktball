import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await resolveChallenges();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function resolveChallenges() {
  const now = new Date();

  // Find ACTIVE or VOTING challenges past their expiration
  const expiredChallenges = await prisma.challenge.findMany({
    where: {
      status: { in: ["ACTIVE", "VOTING"] },
      expiresAt: { lte: now },
    },
  });

  let completedCount = 0;
  let expiredCount = 0;
  const errors: string[] = [];

  for (const challenge of expiredChallenges) {
    try {
      if (challenge.votesChallenger === challenge.votesChallenged) {
        // Tied - mark as EXPIRED with no winner
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: { status: "EXPIRED" },
        });
        expiredCount++;
      } else {
        // Determine winner and loser
        const challengerWins =
          challenge.votesChallenger > challenge.votesChallenged;
        const winnerId = challengerWins
          ? challenge.challengerId
          : challenge.challengedId;
        const loserId = challengerWins
          ? challenge.challengedId
          : challenge.challengerId;

        // Update challenge
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: {
            status: "COMPLETED",
            winnerId,
          },
        });

        // Update winner stats
        await prisma.user.update({
          where: { id: winnerId },
          data: { challengeWins: { increment: 1 } },
        });

        // Update loser stats
        await prisma.user.update({
          where: { id: loserId },
          data: { challengeLosses: { increment: 1 } },
        });

        completedCount++;
      }
    } catch (error) {
      const errMsg = `Failed to resolve challenge ${challenge.id}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errMsg);
      errors.push(errMsg);
    }
  }

  return {
    success: true,
    total: expiredChallenges.length,
    completedCount,
    expiredCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}
