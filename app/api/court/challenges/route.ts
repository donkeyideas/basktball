import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getDualUser } from "@/lib/court/dual-auth";
import { createNotification } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
    const status = searchParams.get("status");

    const validStatuses = ["OPEN", "ACTIVE", "VOTING"];
    const statusFilter = status && validStatuses.includes(status)
      ? [status]
      : validStatuses;

    const challenges = await prisma.challenge.findMany({
      where: {
        status: { in: statusFilter as Array<"OPEN" | "ACTIVE" | "VOTING"> },
      },
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
          },
        },
        challengerTake: {
          select: { id: true, content: true, createdAt: true },
        },
        challengedTake: {
          select: { id: true, content: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (challenges.length > limit) {
      challenges.pop();
      nextCursor = challenges[challenges.length - 1].id;
    }

    return NextResponse.json({ challenges, nextCursor });
  } catch (error) {
    console.error("List challenges error:", error);
    return NextResponse.json(
      { message: "Failed to load challenges" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getDualUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topic, challengedId, challengerTakeId } = body;

    // Validate required fields
    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json(
        { message: "Topic is required" },
        { status: 400 }
      );
    }

    if (topic.trim().length > 500) {
      return NextResponse.json(
        { message: "Topic must be 500 characters or less" },
        { status: 400 }
      );
    }

    if (!challengedId || typeof challengedId !== "string") {
      return NextResponse.json(
        { message: "Challenged user ID is required" },
        { status: 400 }
      );
    }

    // Cannot challenge yourself
    if (challengedId === user.id) {
      return NextResponse.json(
        { message: "You cannot challenge yourself" },
        { status: 400 }
      );
    }

    // Verify challenged user exists
    const challengedUser = await prisma.user.findUnique({
      where: { id: challengedId },
      select: { id: true, status: true },
    });

    if (!challengedUser || challengedUser.status !== "ACTIVE") {
      return NextResponse.json(
        { message: "Challenged user not found" },
        { status: 404 }
      );
    }

    // If a challenger take is provided, verify it exists and belongs to the user
    if (challengerTakeId) {
      const challengerTake = await prisma.take.findUnique({
        where: { id: challengerTakeId },
        select: { authorId: true, isDeleted: true },
      });

      if (!challengerTake || challengerTake.isDeleted) {
        return NextResponse.json(
          { message: "Challenger take not found" },
          { status: 404 }
        );
      }

      if (challengerTake.authorId !== user.id) {
        return NextResponse.json(
          { message: "You can only link your own takes" },
          { status: 403 }
        );
      }
    }

    // Set expiration to 48 hours from now
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const challenge = await prisma.challenge.create({
      data: {
        topic: topic.trim(),
        challengerId: user.id,
        challengedId,
        challengerTakeId: challengerTakeId || null,
        status: "OPEN",
        expiresAt,
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

    // Notify the challenged user
    createNotification({
      userId: challengedId,
      type: "CHALLENGE",
      title: "You've been challenged!",
      body: topic.trim().slice(0, 100),
      data: { challengeId: challenge.id },
      actorId: user.id,
    }).catch(() => {});

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error("Create challenge error:", error);
    return NextResponse.json(
      { message: "Failed to create challenge" },
      { status: 500 }
    );
  }
}
