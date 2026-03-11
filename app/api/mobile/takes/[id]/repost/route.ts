import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser } from "@/lib/mobile-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireMobileUser(request);
    const { id: takeId } = await params;

    const existing = await prisma.repost.findUnique({
      where: { takeId_userId: { takeId, userId: user.id } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.repost.delete({ where: { id: existing.id } }),
        prisma.take.update({
          where: { id: takeId },
          data: { repostCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ action: "removed" });
    } else {
      await prisma.$transaction([
        prisma.repost.create({
          data: { takeId, userId: user.id },
        }),
        prisma.take.update({
          where: { id: takeId },
          data: { repostCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ action: "reposted" });
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Repost error:", error);
    return NextResponse.json(
      { message: "Failed to toggle repost" },
      { status: 500 }
    );
  }
}
