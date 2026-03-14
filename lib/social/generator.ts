import { deepseek } from "@/lib/ai";
import { PLATFORM_CONFIG } from "./platforms";
import type { GeneratedDraft, Tone } from "./types";
import type { SocialPlatform } from "@prisma/client";

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  professional: "Use a professional, authoritative tone.",
  casual: "Use a casual, friendly conversational tone.",
  hype: "Use an excited, high-energy tone with basketball slang and energy.",
  analytical: "Use a data-driven, analytical tone with specific stats and insights.",
};

export async function generateSocialPost(
  platform: SocialPlatform,
  tone: Tone,
  topic?: string
): Promise<GeneratedDraft> {
  const config = PLATFORM_CONFIG[platform];
  const toneInstruction = TONE_INSTRUCTIONS[tone] || "";

  const systemPrompt = `${config.systemPrompt}\n${toneInstruction}\n\nReturn ONLY a valid JSON object with these fields:\n{\n  "content": "the post text",\n  "hashtags": ["tag1", "tag2"],\n  "imagePrompt": "a description for an AI image that would accompany this post"\n}\n\nDo not include any text outside the JSON object.`;

  const userPrompt = topic
    ? `Write a ${config.name} post about: ${topic}\nMaximum length: ${config.maxLength} characters.`
    : `Write a ${config.name} post about a current trending basketball topic.\nMaximum length: ${config.maxLength} characters.`;

  const response = await deepseek.generate(userPrompt, systemPrompt, {
    temperature: 0.8,
    maxTokens: platform === "TWITTER" || platform === "TIKTOK" ? 200 : 600,
  });

  const cleaned = response.content
    .trim()
    .replace(/^```json\s*/, "")
    .replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(cleaned);
    return {
      platform,
      content: String(parsed.content || ""),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String) : [],
      imagePrompt: String(parsed.imagePrompt || ""),
    };
  } catch {
    // If JSON parsing fails, use the raw content
    return {
      platform,
      content: response.content.trim(),
      hashtags: [],
      imagePrompt: "",
    };
  }
}

export async function bulkGenerate(
  platforms: SocialPlatform[],
  tone: Tone,
  topic?: string
): Promise<{ drafts: GeneratedDraft[]; errors: { platform: SocialPlatform; error: string }[] }> {
  const results = await Promise.allSettled(
    platforms.map((platform) => generateSocialPost(platform, tone, topic))
  );

  const drafts: GeneratedDraft[] = [];
  const errors: { platform: SocialPlatform; error: string }[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      drafts.push(result.value);
    } else {
      errors.push({
        platform: platforms[i],
        error: result.reason?.message || "Generation failed",
      });
    }
  });

  return { drafts, errors };
}
