import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Cron-triggered cache refresh for Take Card suggestions.
 * Vercel cron hits this 3×/day (8am/2pm/8pm ET) to keep the ESPN-news-derived
 * suggestion deck fresh without making any user request pay the latency.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    `https://${process.env.VERCEL_URL || "www.basktball.com"}`;

  try {
    const start = Date.now();
    const res = await fetch(`${base}/api/cards/suggestions?refresh=1`, {
      cache: "no-store",
    });
    const data = (await res.json()) as { suggestions?: unknown[]; source?: string };
    return NextResponse.json({
      success: true,
      count: Array.isArray(data.suggestions) ? data.suggestions.length : 0,
      source: data.source,
      durationMs: Date.now() - start,
      refreshedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("refresh-card-suggestions failed:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
