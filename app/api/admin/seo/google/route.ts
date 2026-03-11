import { NextResponse } from "next/server";
import { getSearchConsoleOverview } from "@/lib/google/search-console";
import { getGA4Overview } from "@/lib/google/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [gsc, ga4] = await Promise.all([
      getSearchConsoleOverview(28),
      getGA4Overview(28),
    ]);

    return NextResponse.json({
      success: true,
      gsc,
      ga4,
    });
  } catch (error) {
    console.error("Google API route error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch Google data" },
      { status: 500 }
    );
  }
}
