import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const [totalTakes, totalMembers, totalReactions] = await Promise.all([
      prisma.take.count({ where: { isDeleted: false } }),
      prisma.user.count(),
      prisma.takeReaction.count(),
    ]);

    return NextResponse.json({
      stats: {
        totalTakes,
        totalMembers,
        totalReactions,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({
      stats: { totalTakes: 0, totalMembers: 0, totalReactions: 0 },
    });
  }
}
