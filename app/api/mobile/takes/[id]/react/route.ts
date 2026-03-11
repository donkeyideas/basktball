import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser } from "@/lib/mobile-auth";

// POST /api/mobile/takes/[id]/react - Toggle fire/brick reaction
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireMobileUser(request);
    const { id: takeId } = await params;
    const { type } = await request.json();

    if (!["FIRE", "BRICK"].includes(type)) {
      return NextResponse.json({ message: "Type must be FIRE or BRICK" }, { status: 400 });
    }

    const existing = await prisma.takeReaction.findUnique({
      where: { takeId_userId_type: { takeId, userId: user.id, type } },
    });

    if (existing) {
      // Remove reaction
      await prisma.takeReaction.delete({ where: { id: existing.id } });
      const field = type === "FIRE" ? "fireCount" : "brickCount";
      await prisma.take.update({
        where: { id: takeId },
        data: { [field]: { decrement: 1 } },
      });
      return NextResponse.json({ action: "removed", type });
    } else {
      // Add reaction
      await prisma.takeReaction.create({
        data: { takeId, userId: user.id, type },
      });
      const field = type === "FIRE" ? "fireCount" : "brickCount";
      await prisma.take.update({
        where: { id: takeId },
        data: { [field]: { increment: 1 } },
      });
      return NextResponse.json({ action: "added", type });
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("React error:", error);
    return NextResponse.json({ message: "Failed to react" }, { status: 500 });
  }
}
