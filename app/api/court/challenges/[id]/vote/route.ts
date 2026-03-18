import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getDualUser } from "@/lib/court/dual-auth";
import { createNotification } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

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

    const body = await request.json();
    const { votedForId } = body;

    if (!votedForId || typeof votedForId !== "string") {
      return NextResponse.json(
        { message: "votedForId is required" },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: {
        id: true,
        challengerId: true,
        challengedId: true,
        status: true,
        votesChallenger: true,
        votesChallenged: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found" },
        { status: 404 }
      );
    }

    // Challenge must be ACTIVE or VOTING to accept votes
    if (challenge.status !== "ACTIVE" && challenge.status !== "VOTING") {
      return NextResponse.json(
        { message: `Cannot vote on a challenge with status: ${challenge.status}` },
        { status: 400 }
      );
    }

    // votedForId must be either the challenger or challenged
    if (votedForId !== challenge.challengerId && votedForId !== challenge.challengedId) {
      return NextResponse.json(
        { message: "votedForId must be either the challenger or challenged user" },
        { status: 400 }
      );
    }

    // Check if user already voted on this challenge
    const existingVote = await prisma.challengeVote.findUnique({
      where: {
        challengeId_userId: {
          challengeId: id,
          userId: user.id,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { message: "You have already voted on this challenge" },
        { status: 409 }
      );
    }

    // Determine which counter to increment
    const isVoteForChallenger = votedForId === challenge.challengerId;

    // Create the vote and update counts in a transaction
    const [vote, updatedChallenge] = await prisma.$transaction([
      prisma.challengeVote.create({
        data: {
          challengeId: id,
          userId: user.id,
          votedForId,
        },
      }),
      prisma.challenge.update({
        where: { id },
        data: {
          ...(isVoteForChallenger
            ? { votesChallenger: { increment: 1 } }
            : { votesChallenged: { increment: 1 } }),
          // If challenge was ACTIVE, transition to VOTING
          ...(challenge.status === "ACTIVE" ? { status: "VOTING" } : {}),
        },
        select: {
          id: true,
          status: true,
          votesChallenger: true,
          votesChallenged: true,
        },
      }),
    ]);

    // Notify both participants about the vote
    createNotification({
      userId: challenge.challengerId,
      type: "CHALLENGE_VOTE",
      title: "Someone voted on your challenge!",
      data: { challengeId: id },
      actorId: user.id,
    }).catch(() => {});

    createNotification({
      userId: challenge.challengedId,
      type: "CHALLENGE_VOTE",
      title: "Someone voted on your challenge!",
      data: { challengeId: id },
      actorId: user.id,
    }).catch(() => {});

    return NextResponse.json({
      vote: {
        id: vote.id,
        votedForId: vote.votedForId,
      },
      challenge: updatedChallenge,
    });
  } catch (error) {
    console.error("Challenge vote error:", error);
    return NextResponse.json(
      { message: "Failed to vote on challenge" },
      { status: 500 }
    );
  }
}
