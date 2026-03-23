import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser } from "@/lib/mobile-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileUser(request);

    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: user.id },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      blockedUsers: blocks.map((b) => ({
        id: b.blocked.id,
        name: b.blocked.name,
        displayName: b.blocked.displayName,
        avatarUrl: b.blocked.avatarUrl || b.blocked.image,
        blockedAt: b.createdAt,
      })),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Blocked users error:", error);
    return NextResponse.json(
      { message: "Failed to load blocked users" },
      { status: 500 }
    );
  }
}
