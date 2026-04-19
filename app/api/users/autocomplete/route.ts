import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/users/autocomplete?q=john — returns top 8 matching users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 1) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { handle: { startsWith: q.toLowerCase(), mode: "insensitive" } },
          { name: { startsWith: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        handle: true,
        displayName: true,
        avatarUrl: true,
        image: true,
      },
      take: 8,
      orderBy: { followerCount: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Autocomplete error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
