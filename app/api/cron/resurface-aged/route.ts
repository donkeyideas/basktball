import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await resurfaceAgedTakes();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function resurfaceAgedTakes() {
  const now = new Date();

  // Find aging takes to resurface (need individual records for notifications)
  const agingTakes = await prisma.agingTake.findMany({
    where: {
      revisitDate: { lte: now },
      status: "AGING",
    },
    select: { id: true, userId: true, takeId: true },
  });

  if (agingTakes.length === 0) {
    return { success: true, resurfacedCount: 0 };
  }

  // Bulk update
  const result = await prisma.agingTake.updateMany({
    where: {
      id: { in: agingTakes.map((a) => a.id) },
    },
    data: {
      status: "AGED",
      resurfacedAt: now,
    },
  });

  // Notify each user
  for (const agingTake of agingTakes) {
    createNotification({
      userId: agingTake.userId,
      type: "AGING_RESURFACED",
      title: "Your aging take has resurfaced!",
      data: { takeId: agingTake.takeId },
    }).catch(() => {});
  }

  return {
    success: true,
    resurfacedCount: result.count,
  };
}
