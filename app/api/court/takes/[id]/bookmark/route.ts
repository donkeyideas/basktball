import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getCourtUser } from "@/lib/court/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = getCourtUser(session);
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

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
  } catch (error) {
    console.error("Bookmark error:", error);
    return NextResponse.json({ message: "Failed to bookmark" }, { status: 500 });
  }
}
