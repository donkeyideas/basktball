import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getCourtUser } from "@/lib/court/auth";
import { createNotification } from "@/lib/notifications/service";

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
      const [, updatedTake] = await prisma.$transaction([
        prisma.repost.create({ data: { takeId, userId: user.id } }),
        prisma.take.update({
          where: { id: takeId },
          data: { repostCount: { increment: 1 } },
          select: { authorId: true, content: true },
        }),
      ]);

      createNotification({
        userId: updatedTake.authorId,
        type: "REPOST",
        title: "Your take was reposted!",
        body: updatedTake.content.slice(0, 100),
        data: { takeId },
        actorId: user.id,
      }).catch(() => {});

      return NextResponse.json({ action: "reposted" });
    }
  } catch (error) {
    console.error("Repost error:", error);
    return NextResponse.json({ message: "Failed to repost" }, { status: 500 });
  }
}
