import { NextRequest, NextResponse } from "next/server";
import { dailyDataSync } from "@/lib/jobs/handlers";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await dailyDataSync();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
