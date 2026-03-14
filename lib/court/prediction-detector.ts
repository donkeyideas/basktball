import { deepseek } from "@/lib/ai";
import { prisma } from "@/lib/db/prisma";

/**
 * Fire-and-forget: uses AI to detect if a take is a prediction.
 * If so, creates a Prediction record linked to the take.
 */
export async function detectPrediction(
  takeId: string,
  content: string,
  userId: string,
  gameId: string | null
) {
  // Skip very short takes or replies
  if (content.length < 10) return;

  // Only attempt if DeepSeek is configured
  if (!process.env.DEEPSEEK_API_KEY) return;

  try {
    const systemPrompt = `You detect basketball predictions in social media posts.
A prediction is a claim about a FUTURE outcome: a player's performance, game result, or season outcome.
Statements of opinion or past facts are NOT predictions.

Return ONLY valid JSON:
{ "isPrediction": true/false, "claim": "the extracted prediction claim", "playerId": null, "threshold": null }

If not a prediction, return: { "isPrediction": false }`;

    const response = await deepseek.generate(content, systemPrompt, {
      temperature: 0.3,
      maxTokens: 150,
    });

    const cleaned = response.content
      .trim()
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, "");

    const parsed = JSON.parse(cleaned);

    if (!parsed.isPrediction) return;

    // Check if prediction already exists for this take
    const existing = await prisma.prediction.findUnique({
      where: { takeId },
    });
    if (existing) return;

    await prisma.prediction.create({
      data: {
        takeId,
        userId,
        gameId,
        claim: parsed.claim || content,
        threshold: parsed.threshold || null,
        status: "PENDING",
      },
    });
  } catch {
    // Silently fail — prediction detection is non-critical
  }
}
