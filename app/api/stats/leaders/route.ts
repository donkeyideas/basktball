import { NextResponse } from "next/server";
import { getStatLeaders, type StatCategory } from "@/lib/stats/leaders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") || "ppg") as StatCategory;
    const limit = parseInt(searchParams.get("limit") || "10");
    const flush = searchParams.get("flush") === "true";

    const { leaders, source } = await getStatLeaders(category, limit, flush);

    return NextResponse.json({
      success: true,
      category,
      leaders,
      source,
      ...(source === "unavailable" && {
        message: "Stats data is currently being loaded. Please check back shortly.",
      }),
    });
  } catch (error) {
    console.error("Stats leaders API error:", error);
    return NextResponse.json({
      success: true,
      category: "ppg",
      leaders: [],
      source: "unavailable",
    });
  }
}
