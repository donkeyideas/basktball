import { NextRequest, NextResponse } from "next/server";
import { testConnection } from "@/lib/social/publisher";
import type { SocialPlatform } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/admin/social/test-connection
export async function POST(req: NextRequest) {
  try {
    const { platform } = (await req.json()) as { platform: SocialPlatform };

    if (!platform) {
      return NextResponse.json(
        { success: false, error: "Platform is required" },
        { status: 400 }
      );
    }

    const result = await testConnection(platform);
    return NextResponse.json({ success: result.success, message: result.message });
  } catch (error) {
    console.error("Error testing connection:", error);
    return NextResponse.json(
      { success: false, error: "Connection test failed" },
      { status: 500 }
    );
  }
}
