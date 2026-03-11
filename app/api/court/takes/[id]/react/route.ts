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
    const { type } = await request.json();

    if (!["FIRE", "BRICK"].includes(type)) {
      return NextResponse.json({ message: "Invalid reaction type" }, { status: 400 });
    }

    const existing = await prisma.takeReaction.findUnique({
      where: { takeId_userId_type: { takeId, userId: user.id, type } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.takeReaction.delete({ where: { id: existing.id } }),
        prisma.take.update({
          where: { id: takeId },
          data: {
            [type === "FIRE" ? "fireCount" : "brickCount"]: { decrement: 1 },
          },
        }),
      ]);
      return NextResponse.json({ action: "removed" });
    } else {
      await prisma.$transaction([
        prisma.takeReaction.create({
          data: { takeId, userId: user.id, type },
        }),
        prisma.take.update({
          where: { id: takeId },
          data: {
            [type === "FIRE" ? "fireCount" : "brickCount"]: { increment: 1 },
          },
        }),
      ]);
      return NextResponse.json({ action: "added" });
    }
  } catch (error) {
    console.error("React error:", error);
    return NextResponse.json({ message: "Failed to react" }, { status: 500 });
  }
}
