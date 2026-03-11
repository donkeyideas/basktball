import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type");
    const limitParam = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(limitParam, 1), 20);

    if (!q) {
      return NextResponse.json(
        { message: "Search query is required" },
        { status: 400 }
      );
    }

    if (type === "takes") {
      const takes = await prisma.take.findMany({
        where: {
          content: { contains: q, mode: "insensitive" },
        },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ takes });
    }

    if (type === "users") {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, image: true, email: true },
        take: limit,
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ users });
    }

    // Default: search both takes and users
    const [takes, users] = await Promise.all([
      prisma.take.findMany({
        where: {
          content: { contains: q, mode: "insensitive" },
        },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, image: true, email: true },
        take: limit,
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ takes, users });
  } catch (error: unknown) {
    console.error("Search error:", error);
    return NextResponse.json(
      { message: "Search failed" },
      { status: 500 }
    );
  }
}
