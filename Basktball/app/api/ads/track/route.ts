import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, type } = body;

    if (!adId || !type) {
      return NextResponse.json(
        { error: "Missing adId or type" },
        { status: 400 }
      );
    }

    // Skip tracking for fallback ads
    if (adId.startsWith("fallback-")) {
      console.log(`Fallback ad ${type} tracked:`, adId);
      return NextResponse.json({ success: true, source: "fallback" });
    }

    // Update database based on interaction type
    if (type === "click") {
      await prisma.adPlacement.update({
        where: { id: adId },
        data: { clicks: { increment: 1 } },
      });
    } else if (type === "impression") {
      await prisma.adPlacement.update({
        where: { id: adId },
        data: { impressions: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true, source: "database" });
  } catch (error) {
    console.error("Error tracking ad:", error);
    // Don't fail the request - tracking is non-critical
    return NextResponse.json({ success: true, source: "failed" });
  }
}
