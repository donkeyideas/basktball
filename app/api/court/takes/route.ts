import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getCourtUser } from "@/lib/court/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = getCourtUser(session);
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { content, tags, parentId, gameId, pollOptions, pollDuration } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }
    if (content.length > 280) {
      return NextResponse.json({ message: "Take must be 280 characters or less" }, { status: 400 });
    }

    const take = await prisma.take.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        tags: tags || [],
        parentId: parentId || null,
        gameId: gameId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            avatarUrl: true,
            role: true,
          },
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

    return NextResponse.json({ take }, { status: 201 });
  } catch (error) {
    console.error("Create take error:", error);
    return NextResponse.json({ message: "Failed to create take" }, { status: 500 });
  }
}
