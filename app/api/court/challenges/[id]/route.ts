import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getDualUser } from "@/lib/court/dual-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDualUser(request);
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        challenger: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            image: true,
            challengeWins: true,
            challengeLosses: true,
            predictionCount: true,
            correctPredictions: true,
          },
        },
        challenged: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            image: true,
            challengeWins: true,
            challengeLosses: true,
            predictionCount: true,
            correctPredictions: true,
          },
        },
        winner: {
          select: {
            id: true,
            displayName: true,
            name: true,
          },
        },
        challengerTake: {
          select: {
            id: true,
            content: true,
            fireCount: true,
            brickCount: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                displayName: true,
                name: true,
                avatarUrl: true,
                image: true,
              },
            },
          },
        },
        challengedTake: {
          select: {
            id: true,
            content: true,
            fireCount: true,
            brickCount: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                displayName: true,
                name: true,
                avatarUrl: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found" },
        { status: 404 }
      );
    }

    // Get the current user's vote if logged in
    let userVote: { votedForId: string } | null = null;
    if (user) {
      const vote = await prisma.challengeVote.findUnique({
        where: {
          challengeId_userId: {
            challengeId: id,
            userId: user.id,
          },
        },
        select: { votedForId: true },
      });
      userVote = vote;
    }

    return NextResponse.json({
      challenge: {
        ...challenge,
        userVote,
      },
    });
  } catch (error) {
    console.error("Challenge detail error:", error);
    return NextResponse.json(
      { message: "Failed to load challenge" },
      { status: 500 }
    );
  }
}
