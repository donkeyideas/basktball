import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser } from "@/lib/mobile-auth";

// POST /api/mobile/takes/[id]/bookmark - Toggle bookmark
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireMobileUser(request);
    const { id: takeId } = await params;

    const existing = await prisma.bookmark.findUnique({
      where: { takeId_userId: { takeId, userId: user.id } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: "removed" });
    } else {
      await prisma.bookmark.create({ data: { takeId, userId: user.id } });
      return NextResponse.json({ action: "added" });
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Bookmark error:", error);
    return NextResponse.json({ message: "Failed to bookmark" }, { status: 500 });
  }
}
