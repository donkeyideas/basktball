import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getMobileUser, requireMobileUser, AuthError } from "@/lib/mobile-auth";

// GET /api/mobile/takes/[id] - Get take with replies
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const take = await prisma.take.findUnique({
      where: { id, isDeleted: false },
      include: {
        author: {
          select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, role: true },
        },
        replies: {
          where: { isDeleted: false },
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, role: true },
            },
          },
        },
      },
    });

    if (!take) {
      return NextResponse.json({ message: "Take not found" }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    prisma.take.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    return NextResponse.json(take);
  } catch (error) {
    console.error("Get take error:", error);
    return NextResponse.json({ message: "Failed to load take" }, { status: 500 });
  }
}

// DELETE /api/mobile/takes/[id] - Delete a take (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireMobileUser(request);
    const { id } = await params;

    const take = await prisma.take.findUnique({
      where: { id },
      select: { authorId: true, parentId: true },
    });

    if (!take) {
      return NextResponse.json({ message: "Take not found" }, { status: 404 });
    }

    const isOwner = take.authorId === user.id;
    const isMod = user.role === "ADMIN" || user.role === "MODERATOR";
    if (!isOwner && !isMod) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    await prisma.take.update({
      where: { id },
      data: { isDeleted: true },
    });

    await prisma.user.update({
      where: { id: take.authorId },
      data: { takeCount: { decrement: 1 } },
    });

    if (take.parentId) {
      await prisma.take.update({
        where: { id: take.parentId },
        data: { replyCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ message: "Take deleted" });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Delete take error:", error);
    return NextResponse.json({ message: "Failed to delete take" }, { status: 500 });
  }
}
