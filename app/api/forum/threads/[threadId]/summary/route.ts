import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { deepseek } from "@/lib/ai/deepseek";
import { cache } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;

    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId, isDeleted: false },
      select: { id: true, title: true, postCount: true },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.postCount < 10) {
      return NextResponse.json({ error: "Thread needs at least 10 posts to generate a summary" }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `forum:summary:${threadId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ summary: cached });
    }

    // Fetch all posts
    const posts = await prisma.forumPost.findMany({
      where: { threadId, isDeleted: false },
      orderBy: { postNumber: "asc" },
      select: {
        content: true,
        postNumber: true,
        author: { select: { displayName: true, name: true } },
      },
    });

    const postsSummaryText = posts
      .map((p) => `Post #${p.postNumber} by ${p.author.displayName || p.author.name || "Anonymous"}: ${p.content.slice(0, 300)}`)
      .join("\n\n");

    const result = await deepseek.generate(
      `Summarize this basketball forum discussion thread titled "${thread.title}":\n\n${postsSummaryText}`,
      "You are a sports discussion summarizer. Provide a concise 2-3 paragraph summary of the key points, main arguments, and overall sentiment of the discussion. Mention the most popular takes and any consensus reached. Do NOT use any markdown formatting — write in plain text only.",
      { maxTokens: 500, temperature: 0.5 }
    );

    const cleanSummary = result.content
      .replace(/#{1,6}\s?/g, "")
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    // Cache for 1 hour
    await cache.set(cacheKey, cleanSummary, 3600);

    return NextResponse.json({ summary: cleanSummary, tokenUsage: result.tokenUsage });
  } catch (error) {
    console.error("Error generating thread summary:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
