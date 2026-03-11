import { NextResponse } from "next/server";
import { cache } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Clear all cache entries with our prefix
    await cache.deletePattern("*");

    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
    });
  } catch (error) {
    console.error("Cache clear error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}
