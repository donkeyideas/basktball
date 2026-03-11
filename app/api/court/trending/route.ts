import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    // Get takes from the last 7 days that have tags
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentTakes = await prisma.take.findMany({
      where: {
        isDeleted: false,
        createdAt: { gte: sevenDaysAgo },
        tags: { isEmpty: false },
      },
      select: { tags: true, fireCount: true },
    });

    // Aggregate tags with weighted count (fires boost ranking)
    const tagMap = new Map<string, number>();
    for (const take of recentTakes) {
      for (const tag of take.tags) {
        const current = tagMap.get(tag) || 0;
        tagMap.set(tag, current + 1 + Math.floor(take.fireCount / 5));
      }
    }

    // Sort by count descending, take top 10
    const trending = Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json({ trending });
  } catch (error) {
    console.error("Trending error:", error);
    return NextResponse.json({ trending: [] });
  }
}
