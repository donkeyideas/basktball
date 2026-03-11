import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/forum/utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = 50;

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { gameId },
      select: { id: true },
    });

    if (!chatRoom) {
      return NextResponse.json({ messages: [], nextCursor: null });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId: chatRoom.id,
        isDeleted: false,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, role: true, favoriteTeamId: true },
        },
      },
    });

    const nextCursor = messages.length === limit
      ? messages[messages.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await auth();
    const user = requireAuth(session);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { gameId } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (content.trim().length > 500) {
      return NextResponse.json({ error: "Message must be 500 characters or less" }, { status: 400 });
    }

    let chatRoom = await prisma.chatRoom.findUnique({
      where: { gameId },
    });

    if (!chatRoom) {
      // Auto-create room
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: {
          homeTeam: { select: { abbreviation: true } },
          awayTeam: { select: { abbreviation: true } },
        },
      });

      if (!game) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }

      chatRoom = await prisma.chatRoom.create({
        data: {
          gameId,
          name: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
          isActive: true,
        },
      });
    }

    if (!chatRoom.isActive) {
      return NextResponse.json({ error: "This chat room is no longer active" }, { status: 403 });
    }

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.create({
        data: {
          roomId: chatRoom!.id,
          authorId: user.id,
          content: content.trim(),
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, role: true, favoriteTeamId: true },
          },
        },
      });

      await tx.chatRoom.update({
        where: { id: chatRoom!.id },
        data: { messageCount: { increment: 1 } },
      });

      return msg;
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending chat message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
