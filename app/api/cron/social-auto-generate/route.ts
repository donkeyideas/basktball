import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { bulkGenerate } from "@/lib/social/generator";
import { publishPost } from "@/lib/social/publisher";
import type { SocialPlatform } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/cron/social-auto-generate — hourly cron, generates if hour matches
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Read automation config from Settings
    const keys = [
      "SOCIAL_AUTO_ENABLED",
      "SOCIAL_AUTO_PLATFORMS",
      "SOCIAL_AUTO_HOUR",
      "SOCIAL_AUTO_TOPICS",
      "SOCIAL_AUTO_INCLUDE_DEBATES",
      "SOCIAL_AUTO_REQUIRE_APPROVAL",
    ];

    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });
    const map = new Map(settings.map((s) => [s.key, s.value]));

    const enabled = map.get("SOCIAL_AUTO_ENABLED") === "true";
    if (!enabled) {
      return NextResponse.json({ success: true, message: "Automation disabled" });
    }

    // Check if current UTC hour matches
    const targetHour = parseInt(map.get("SOCIAL_AUTO_HOUR") || "14", 10);
    const currentHour = new Date().getUTCHours();
    if (currentHour !== targetHour) {
      return NextResponse.json({ success: true, message: `Not the scheduled hour (current: ${currentHour}, target: ${targetHour})` });
    }

    const platforms: SocialPlatform[] = JSON.parse(map.get("SOCIAL_AUTO_PLATFORMS") || "[]");
    if (platforms.length === 0) {
      return NextResponse.json({ success: true, message: "No platforms configured" });
    }

    const topics: string[] = JSON.parse(map.get("SOCIAL_AUTO_TOPICS") || "[]");
    const requireApproval = map.get("SOCIAL_AUTO_REQUIRE_APPROVAL") !== "false";

    // Pick a topic from the rotation pool
    let topic: string | undefined;
    if (topics.length > 0) {
      // Rotate based on day of year
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      );
      topic = topics[dayOfYear % topics.length];
    }

    // Generate posts
    const { drafts, errors } = await bulkGenerate(platforms, "casual", topic);

    // Save drafts to database
    const savedPosts = [];
    for (const draft of drafts) {
      const post = await prisma.socialMediaPost.create({
        data: {
          platform: draft.platform,
          content: draft.content,
          hashtags: draft.hashtags,
          imagePrompt: draft.imagePrompt,
          topic,
          tone: "casual",
          status: requireApproval ? "DRAFT" : "SCHEDULED",
        },
      });

      // Auto-publish if approval not required
      if (!requireApproval) {
        const result = await publishPost(post);
        await prisma.socialMediaPost.update({
          where: { id: post.id },
          data: {
            status: result.success ? "PUBLISHED" : "FAILED",
            publishedAt: result.success ? new Date() : null,
            externalId: result.externalId || null,
            errorMessage: result.error || null,
          },
        });
      }

      savedPosts.push(post);
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${drafts.length} posts, ${errors.length} errors`,
      generated: drafts.length,
      errors: errors.length,
    });
  } catch (error) {
    console.error("Social auto-generate cron error:", error);
    return NextResponse.json(
      { success: false, error: "Cron job failed" },
      { status: 500 }
    );
  }
}
