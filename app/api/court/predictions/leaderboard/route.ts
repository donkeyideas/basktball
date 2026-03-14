import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getDualUser } from "@/lib/court/dual-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getDualUser(request);

    const users = await prisma.user.findMany({
      where: {
        predictionCount: { gt: 0 },
        status: "ACTIVE",
      },
      select: {
        id: true,
        displayName: true,
        name: true,
        avatarUrl: true,
        image: true,
        predictionCount: true,
        correctPredictions: true,
      },
      orderBy: { correctPredictions: "desc" },
      take: 20,
    });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      displayName: user.displayName,
      name: user.name,
      avatarUrl: user.avatarUrl,
      image: user.image,
      predictionCount: user.predictionCount,
      correctPredictions: user.correctPredictions,
      accuracy:
        user.predictionCount > 0
          ? Math.round((user.correctPredictions / user.predictionCount) * 1000) / 10
          : 0,
      isCurrentUser: currentUser ? user.id === currentUser.id : false,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Predictions leaderboard error:", error);
    return NextResponse.json(
      { message: "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}
