import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { deepseek } from "@/lib/ai/deepseek";
import { cache } from "@/lib/cache/redis";
import { checkAiRateLimit, requireAuth } from "@/lib/forum/utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    const user = requireAuth(session);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Rate limit
    const allowed = await checkAiRateLimit(user.id);
    if (!allowed) {
      return NextResponse.json({ error: "AI rate limit reached. Try again in an hour." }, { status: 429 });
    }

    const { postId } = await params;

    const post = await prisma.forumPost.findUnique({
      where: { id: postId, isDeleted: false },
      select: { id: true, content: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check cache
    const cacheKey = `forum:fact-check:${postId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ factCheck: cached });
    }

    const result = await deepseek.generate(
      `Fact-check the following basketball forum post for statistical accuracy. Identify any stats claims and verify them:\n\n"${post.content}"`,
      "You are a basketball statistics fact-checker. Analyze the post for any statistical claims (points, records, averages, etc.). For each claim, indicate if it's accurate, inaccurate, or unverifiable. Provide the correct stats when available. Be concise. If there are no stat claims to check, say so. Format your response as a brief analysis. Do NOT use any markdown formatting — write in plain text only.",
      { maxTokens: 400, temperature: 0.3 }
    );

    const cleanFactCheck = result.content
      .replace(/#{1,6}\s?/g, "")
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    // Cache for 4 hours
    await cache.set(cacheKey, cleanFactCheck, 14400);

    return NextResponse.json({ factCheck: cleanFactCheck, tokenUsage: result.tokenUsage });
  } catch (error) {
    console.error("Error fact-checking post:", error);
    return NextResponse.json({ error: "Failed to fact-check" }, { status: 500 });
  }
}
