import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser } from "@/lib/mobile-auth";

// GET /api/mobile/bookmarks - Get user's bookmarked takes
export async function GET(request: Request) {
  try {
    const user = await requireMobileUser(request);

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        take: {
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
        },
      },
    });

    const takes = bookmarks
      .filter((b) => b.take && !b.take.isDeleted)
      .map((b) => b.take);

    return NextResponse.json({ takes });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Bookmarks error:", error);
    return NextResponse.json(
      { message: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}
