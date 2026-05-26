import { NextRequest, NextResponse } from "next/server";
import { deepseek } from "@/lib/ai/deepseek";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Tone = "analytical" | "hot-take" | "short";

const TONE_GUIDES: Record<Tone, string> = {
  analytical:
    "Write 1-2 sentences in an analytical, editorial voice. Lead with the most striking number or fact. Provide a single piece of supporting context. Avoid clichés. No emojis.",
  "hot-take":
    "Write a single punchy declarative sentence that takes a clear position. Confident, opinionated, slightly provocative — but supported by the facts given. No hedging. No emojis.",
  short:
    "Write the shortest possible caption — under 120 characters. One sharp sentence. No emojis, no hashtags.",
};

function fallback(input: {
  num?: string;
  unit?: string;
  headline?: string;
  context?: string;
  meta?: string;
}, tone: Tone) {
  const base =
    input.context?.trim() ||
    [input.num, input.unit, input.headline].filter(Boolean).join(" ").trim() ||
    "A wild stat from basktball.";
  if (tone === "short") return base.split(/[.!]/)[0].slice(0, 120);
  if (tone === "hot-take") return `Hot take: ${base}`;
  return base;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ caption: "" }, { status: 400 });
  }

  const tone = ((body.tone as string) || "analytical") as Tone;
  const template = (body.template as string) || "stat-line";
  const input = {
    num: (body.num as string) || "",
    unit: (body.unit as string) || "",
    headline: (body.headline as string) || "",
    context: (body.context as string) || "",
    meta: (body.meta as string) || "",
  };

  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({
      caption: fallback(input, tone),
      source: "fallback",
    });
  }

  const guide = TONE_GUIDES[tone] || TONE_GUIDES.analytical;

  const system = [
    "You write captions for basketball-stat share cards on X (Twitter).",
    "Voice: editorial, confident, specific — like a smart fan account.",
    "Never use emojis. Never use hashtags unless asked. Never invent stats.",
    "Output only the caption text, nothing else.",
  ].join(" ");

  const userMsg = [
    `Template: ${template}`,
    input.num && `Stat: ${input.num} ${input.unit}`.trim(),
    input.headline && `Headline: ${input.headline}`,
    input.context && `Context: ${input.context}`,
    input.meta && `Meta: ${input.meta}`,
    "",
    `Tone instruction: ${guide}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await deepseek.generate(userMsg, system, {
      temperature: tone === "hot-take" ? 0.85 : 0.6,
      maxTokens: tone === "short" ? 80 : 200,
    });

    let caption = result.content.trim();
    // Strip wrapping quotes if model adds them
    caption = caption.replace(/^["']|["']$/g, "").trim();
    // Strip any emoji that slipped through (broad pattern)
    caption = caption.replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/gu,
      "",
    ).trim();

    return NextResponse.json({
      caption: caption || fallback(input, tone),
      source: "deepseek",
    });
  } catch (err) {
    console.error("caption error:", err);
    return NextResponse.json({
      caption: fallback(input, tone),
      source: "fallback",
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}
