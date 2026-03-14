import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

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

  // Find AgingTakes where revisitDate has passed and status is still AGING
  const result = await prisma.agingTake.updateMany({
    where: {
      revisitDate: { lte: now },
      status: "AGING",
    },
    data: {
      status: "AGED",
      resurfacedAt: now,
    },
  });

  return {
    success: true,
    resurfacedCount: result.count,
  };
}
