import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deepseek } from "@/lib/ai/deepseek";
import { checkAiRateLimit, requireAuth } from "@/lib/forum/utils";
import type { DeepSeekMessage } from "@/lib/ai/deepseek";

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

    const { message, history } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build message history
    const messages: DeepSeekMessage[] = [
      {
        role: "system",
        content: "You are a passionate basketball debate partner. The user will share a hot take or opinion about basketball. Your job is to argue the OPPOSING side of whatever they say, with conviction and evidence. Use real basketball knowledge, stats, and historical examples. Be fun, competitive, and engaging — like a sports bar debate. Keep responses to 2-3 paragraphs max. Never agree with the user. IMPORTANT: Do NOT use any markdown formatting — no **, ##, *, _, or other special characters. Write in plain text only.",
      },
    ];

    // Add conversation history (limit to last 10 exchanges)
    const recentHistory = (history || []).slice(-20);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }

    messages.push({ role: "user", content: message.trim() });

    const result = await deepseek.chat(messages, {
      maxTokens: 400,
      temperature: 0.8,
    });

    // Strip any markdown formatting from the response
    const cleanResponse = result.content
      .replace(/#{1,6}\s?/g, "")
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    return NextResponse.json({
      response: cleanResponse,
      tokenUsage: result.tokenUsage,
    });
  } catch (error) {
    console.error("Error in AI debate:", error);
    return NextResponse.json({ error: "Failed to generate debate response" }, { status: 500 });
  }
}
