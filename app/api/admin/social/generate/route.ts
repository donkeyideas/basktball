import { NextRequest, NextResponse } from "next/server";
import { bulkGenerate } from "@/lib/social/generator";
import type { SocialPlatform } from "@prisma/client";
import type { Tone } from "@/lib/social/types";

export const dynamic = "force-dynamic";

// POST /api/admin/social/generate — AI-generate drafts for selected platforms
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platforms, tone, topic } = body as {
      platforms: SocialPlatform[];
      tone: Tone;
      topic?: string;
    };

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one platform is required" },
        { status: 400 }
      );
    }

    if (!tone) {
      return NextResponse.json(
        { success: false, error: "Tone is required" },
        { status: 400 }
      );
    }

    // Check if DeepSeek API key is configured
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { success: false, error: "DeepSeek API key not configured. Add DEEPSEEK_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const { drafts, errors } = await bulkGenerate(platforms, tone, topic);

    return NextResponse.json({
      success: true,
      drafts,
      errors: errors.map((e) => ({ platform: e.platform, error: e.error })),
    });
  } catch (error) {
    console.error("Error generating social posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate posts" },
      { status: 500 }
    );
  }
}
