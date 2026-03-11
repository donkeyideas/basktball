import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getCourtUser } from "@/lib/court/auth";
import { getMobileUser } from "@/lib/mobile-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    let user = getCourtUser(session);

    if (!user) {
      const mobileUser = await getMobileUser(request);
      if (mobileUser) {
        user = { id: mobileUser.id, role: mobileUser.role };
      }
    }
    const { id } = await params;

    const take = await prisma.take.findUnique({
      where: { id },
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
        replies: {
          where: { isDeleted: false },
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
            ...(user
              ? {
                  reactions: {
                    where: { userId: user.id },
                    select: { type: true },
                  },
                  bookmarks: {
                    where: { userId: user.id },
                    select: { id: true },
                  },
                }
              : {}),
          },
          orderBy: { createdAt: "asc" },
        },
        ...(user
          ? {
              reactions: {
                where: { userId: user.id },
                select: { type: true },
              },
              bookmarks: {
                where: { userId: user.id },
                select: { id: true },
              },
              reposts: {
                where: { userId: user.id },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    if (!take || take.isDeleted) {
      return NextResponse.json({ message: "Take not found" }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    prisma.take.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    return NextResponse.json({ take });
  } catch (error) {
    console.error("Take detail error:", error);
    return NextResponse.json({ message: "Failed to load take" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = getCourtUser(session);
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    const take = await prisma.take.findUnique({
      where: { id },
      select: { authorId: true, parentId: true },
    });

    if (!take) {
      return NextResponse.json({ message: "Take not found" }, { status: 404 });
    }

    // Only the author or an ADMIN/MODERATOR can delete
    const isOwner = take.authorId === user.id;
    const isMod = user.role === "ADMIN" || user.role === "MODERATOR";
    if (!isOwner && !isMod) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    // Soft delete: mark as deleted
    await prisma.take.update({
      where: { id },
      data: { isDeleted: true },
    });

    // Decrement author's take count
    await prisma.user.update({
      where: { id: take.authorId },
      data: { takeCount: { decrement: 1 } },
    });

    // If this was a reply, decrement parent's reply count
    if (take.parentId) {
      await prisma.take.update({
        where: { id: take.parentId },
        data: { replyCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ message: "Take deleted" });
  } catch (error) {
    console.error("Delete take error:", error);
    return NextResponse.json({ message: "Failed to delete take" }, { status: 500 });
  }
}
