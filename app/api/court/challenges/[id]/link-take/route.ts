import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getDualUser } from "@/lib/court/dual-auth";

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
    const { takeId, side } = body;

    if (!takeId || !side || !["challenger", "challenged"].includes(side)) {
      return NextResponse.json(
        { message: "takeId and side (challenger/challenged) are required" },
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
        challengerTakeId: true,
        challengedTakeId: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found" },
        { status: 404 }
      );
    }

    // Must be ACTIVE or VOTING
    if (challenge.status !== "ACTIVE" && challenge.status !== "VOTING") {
      return NextResponse.json(
        { message: "Challenge is not active" },
        { status: 400 }
      );
    }

    // Verify the user is the correct participant
    if (side === "challenger" && challenge.challengerId !== user.id) {
      return NextResponse.json(
        { message: "Only the challenger can link a take to the challenger side" },
        { status: 403 }
      );
    }
    if (side === "challenged" && challenge.challengedId !== user.id) {
      return NextResponse.json(
        { message: "Only the challenged user can link a take to the challenged side" },
        { status: 403 }
      );
    }

    // Verify the take exists and belongs to the user
    const take = await prisma.take.findUnique({
      where: { id: takeId },
      select: { authorId: true, isDeleted: true },
    });

    if (!take || take.isDeleted || take.authorId !== user.id) {
      return NextResponse.json(
        { message: "Take not found or does not belong to you" },
        { status: 400 }
      );
    }

    // Link the take
    const updateField = side === "challenger" ? "challengerTakeId" : "challengedTakeId";
    const updated = await prisma.challenge.update({
      where: { id },
      data: { [updateField]: takeId },
      include: {
        challenger: {
          select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, challengeWins: true, challengeLosses: true },
        },
        challenged: {
          select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, challengeWins: true, challengeLosses: true },
        },
        challengerTake: {
          select: { id: true, content: true, fireCount: true, brickCount: true, createdAt: true, author: { select: { id: true, displayName: true, name: true, avatarUrl: true, image: true } } },
        },
        challengedTake: {
          select: { id: true, content: true, fireCount: true, brickCount: true, createdAt: true, author: { select: { id: true, displayName: true, name: true, avatarUrl: true, image: true } } },
        },
      },
    });

    return NextResponse.json({ challenge: updated });
  } catch (error) {
    console.error("Link take error:", error);
    return NextResponse.json(
      { message: "Failed to link take" },
      { status: 500 }
    );
  }
}
