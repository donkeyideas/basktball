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

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: {
        id: true,
        challengedId: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found" },
        { status: 404 }
      );
    }

    // Must be the challenged user
    if (challenge.challengedId !== user.id) {
      return NextResponse.json(
        { message: "Only the challenged user can accept this challenge" },
        { status: 403 }
      );
    }

    // Must be in OPEN status
    if (challenge.status !== "OPEN") {
      return NextResponse.json(
        { message: `Challenge cannot be accepted (current status: ${challenge.status})` },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > challenge.expiresAt) {
      // Mark as expired
      await prisma.challenge.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { message: "Challenge has expired" },
        { status: 400 }
      );
    }

    // Optional: link a response take
    let challengedTakeId: string | null = null;
    try {
      const body = await request.json();
      if (body.takeId && typeof body.takeId === "string") {
        const take = await prisma.take.findUnique({
          where: { id: body.takeId },
          select: { authorId: true, isDeleted: true },
        });

        if (take && !take.isDeleted && take.authorId === user.id) {
          challengedTakeId = body.takeId;
        }
      }
    } catch {
      // No body or invalid JSON — that's fine, takeId is optional
    }

    const updatedChallenge = await prisma.challenge.update({
      where: { id },
      data: {
        status: "ACTIVE",
        ...(challengedTakeId ? { challengedTakeId } : {}),
      },
      include: {
        challenger: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            image: true,
          },
        },
        challenged: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            image: true,
          },
        },
      },
    });

    // Notify the challenger that their challenge was accepted
    createNotification({
      userId: updatedChallenge.challenger.id,
      type: "CHALLENGE_ACCEPT",
      title: "Your challenge was accepted!",
      body: updatedChallenge.topic,
      data: { challengeId: id },
      actorId: user.id,
    }).catch(() => {});

    return NextResponse.json({ challenge: updatedChallenge });
  } catch (error) {
    console.error("Accept challenge error:", error);
    return NextResponse.json(
      { message: "Failed to accept challenge" },
      { status: 500 }
    );
  }
}
