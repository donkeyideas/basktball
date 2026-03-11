import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deepseek } from "@/lib/ai/deepseek";
import { checkAiRateLimit, requireAuth } from "@/lib/forum/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const user = requireAuth(session);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const allowed = await checkAiRateLimit(user.id);
    if (!allowed) {
      return NextResponse.json({ error: "AI rate limit reached. Try again in an hour." }, { status: 429 });
    }

    const { idea, context } = await request.json();

    if (!idea?.trim()) {
      return NextResponse.json({ error: "Please provide your idea or rough notes" }, { status: 400 });
    }

    const prompt = context
      ? `Help me write a basketball forum post based on this idea:\n\n"${idea}"\n\nContext from the thread: "${context}"`
      : `Help me write a basketball forum post based on this idea:\n\n"${idea}"`;

    const result = await deepseek.generate(
      prompt,
      "You are a helpful basketball writing assistant. Take the user's rough idea or notes and help them write a well-structured forum post. Use clear paragraphs, support points with basketball knowledge when relevant, and maintain a conversational but informed tone. Don't make it sound robotic — keep the user's voice. Return only the post content, no meta-commentary. IMPORTANT: Do NOT use any markdown formatting — no **, ##, *, _, or other special characters. Write in plain text only.",
      { maxTokens: 500, temperature: 0.7 }
    );

    const cleanDraft = result.content
      .replace(/#{1,6}\s?/g, "")
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    return NextResponse.json({
      draft: cleanDraft,
      tokenUsage: result.tokenUsage,
    });
  } catch (error) {
    console.error("Error in writing assist:", error);
    return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
  }
}
