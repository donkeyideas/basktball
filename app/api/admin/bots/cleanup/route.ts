import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return null;
  }
  return session.user;
}

// POST /api/admin/bots/cleanup - Remove "Alright, listen." prefix from all bot posts
export async function POST() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Find all takes that start with "Alright, listen" (case-insensitive)
  const affectedTakes = await prisma.take.findMany({
    where: {
      isDeleted: false,
      content: { startsWith: "Alright, listen" },
    },
    select: { id: true, content: true },
  });

  // Also catch lowercase and other variations
  const affectedTakes2 = await prisma.take.findMany({
    where: {
      isDeleted: false,
      content: { startsWith: "Alright listen" },
    },
    select: { id: true, content: true },
  });

  const allAffected = [...affectedTakes, ...affectedTakes2];
  // Deduplicate by id
  const seen = new Set<string>();
  const unique = allAffected.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  let updated = 0;
  for (const take of unique) {
    const cleaned = take.content.replace(/^Alright,?\s*listen\.?\s*/i, "").trim();
    if (cleaned !== take.content && cleaned.length > 0) {
      // Capitalize the first letter after stripping
      const finalContent = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      await prisma.take.update({
        where: { id: take.id },
        data: { content: finalContent },
      });
      updated++;
    }
  }

  return NextResponse.json({
    message: `Cleaned ${updated} posts`,
    found: unique.length,
    updated,
  });
}
