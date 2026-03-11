// AI Game Insights Generator
// Uses DeepSeek to produce 2-3 contextual insight sentences about a game.
// Results are cached to avoid excessive AI calls.

import { deepseek } from "@/lib/ai";
import { insightsCache } from "@/lib/cache/redis";

export interface InsightsInput {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  homeScore: number;
  awayScore: number;
  gameStatus: "scheduled" | "live" | "final";
  homeTeamStats: Record<string, string>;
  awayTeamStats: Record<string, string>;
  seasonSeries?: string;
  homeRecord?: string;
  awayRecord?: string;
}

export async function generateGameInsights(
  gameId: string,
  input: InsightsInput
): Promise<string[]> {
  const cacheKey = `game-insights:${gameId}`;

  try {
    // Check cache
    const cached = await insightsCache.get<string[]>(cacheKey);
    if (cached) return cached;

    const {
      homeTeamName, awayTeamName, homeTeamAbbr, awayTeamAbbr,
      homeScore, awayScore, gameStatus,
      homeTeamStats, awayTeamStats,
      seasonSeries, homeRecord, awayRecord,
    } = input;

    const statLines: string[] = [];
    statLines.push(`${awayTeamAbbr} ${awayScore} - ${homeTeamAbbr} ${homeScore} (${gameStatus})`);
    if (homeRecord) statLines.push(`${homeTeamAbbr} record: ${homeRecord}`);
    if (awayRecord) statLines.push(`${awayTeamAbbr} record: ${awayRecord}`);
    if (seasonSeries) statLines.push(`Season series: ${seasonSeries}`);

    const addStat = (label: string, homeKey: string, awayKey: string) => {
      const h = homeTeamStats[homeKey];
      const a = awayTeamStats[awayKey];
      if (h && a) statLines.push(`${label}: ${homeTeamAbbr} ${h} | ${awayTeamAbbr} ${a}`);
    };

    addStat("FG%", "fieldGoalPct", "fieldGoalPct");
    addStat("3PT%", "threePointFieldGoalPct", "threePointFieldGoalPct");
    addStat("Rebounds", "totalRebounds", "totalRebounds");
    addStat("Assists", "assists", "assists");
    addStat("Turnovers", "turnovers", "turnovers");
    addStat("Fast Break Pts", "fastBreakPoints", "fastBreakPoints");
    addStat("Paint Pts", "pointsInPaint", "pointsInPaint");

    const systemPrompt = `You are a basketball analyst providing brief game insights. Given game stats, produce exactly 3 short, specific insight sentences. Each insight must reference actual stats from the data provided. No generic statements like "this is a close game". Return ONLY a JSON array of 3 strings, no other text.`;

    const userPrompt = `Game: ${awayTeamName} at ${homeTeamName}\n${statLines.join("\n")}`;

    const response = await deepseek.generate(userPrompt, systemPrompt, {
      temperature: 0.5,
      maxTokens: 200,
    });

    let insights: string[];
    try {
      // Try to parse as JSON array
      const cleaned = response.content.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
      insights = JSON.parse(cleaned);
      if (!Array.isArray(insights)) throw new Error("Not an array");
      insights = insights.filter((s) => typeof s === "string").slice(0, 3);
    } catch {
      // Fallback: split on newlines
      insights = response.content
        .split("\n")
        .map((s) => s.replace(/^\d+\.\s*/, "").replace(/^[-•]\s*/, "").trim())
        .filter((s) => s.length > 10)
        .slice(0, 3);
    }

    if (insights.length === 0) return [];

    // Cache: 2 min for live, 1 hour for final
    const ttl = gameStatus === "live" ? 120 : 3600;
    await insightsCache.set(cacheKey, insights, ttl);

    return insights;
  } catch (e) {
    console.error("AI insights error:", e);
    return [];
  }
}
