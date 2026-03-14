import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser } from "@/lib/mobile-auth";
import { detectPrediction } from "@/lib/court/prediction-detector";

// POST /api/mobile/takes - Create a take
export async function POST(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const { content, gameId, parentId, tags, pollOptions, pollDuration, quarter, gameClock } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ message: "Take must be 2,000 characters or less" }, { status: 400 });
    }

    const take = await prisma.take.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        gameId: gameId || null,
        parentId: parentId || null,
        tags: tags || [],
        quarter: quarter || null,
        gameClock: gameClock || null,
      },
      include: {
        author: {
          select: { id: true, displayName: true, name: true, avatarUrl: true, image: true },
        },
      },
    });

    // Create poll if options provided
    if (pollOptions && Array.isArray(pollOptions) && pollOptions.length >= 2 && pollOptions.length <= 4) {
      const durationHours = typeof pollDuration === "number" ? Math.min(pollDuration, 168) : 24;
      const endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

      await prisma.poll.create({
        data: {
          takeId: take.id,
          endsAt,
          options: {
            create: pollOptions
              .filter((opt: string) => typeof opt === "string" && opt.trim().length > 0)
              .slice(0, 4)
              .map((text: string, i: number) => ({
                text: text.trim().slice(0, 80),
                position: i,
              })),
          },
        },
      });
    }

    // Update denormalized counts
    await prisma.user.update({
      where: { id: user.id },
      data: { takeCount: { increment: 1 } },
    });

    if (parentId) {
      await prisma.take.update({
        where: { id: parentId },
        data: { replyCount: { increment: 1 } },
      });
    }

    // Fire-and-forget: detect if this take is a prediction
    detectPrediction(take.id, content.trim(), user.id, gameId || null).catch(() => {});

    return NextResponse.json(take, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Create take error:", error);
    return NextResponse.json({ message: "Failed to create take" }, { status: 500 });
  }
}
