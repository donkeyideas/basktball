import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { deepseek } from "@/lib/ai/deepseek";
import { cache } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

const GEO_SYSTEM_PROMPT = `You are an expert in GEO (Generative Engine Optimization). Analyze the provided content for AI-engine readiness.

Score each dimension from 0-100 and provide specific, actionable feedback.

Respond ONLY in valid JSON with this exact structure:
{
  "aiFriendliness": { "score": 0, "feedback": "" },
  "citationWorthiness": { "score": 0, "feedback": "" },
  "entityCoverage": { "score": 0, "feedback": "" },
  "faqReadiness": { "score": 0, "feedback": "" },
  "eeat": { "score": 0, "feedback": "" },
  "overallScore": 0,
  "topSuggestions": ["", "", ""]
}

Evaluation criteria:
- AI Friendliness: Does content answer questions directly? Clear headings? Concise paragraphs?
- Citation Worthiness: Unique data, statistics, original analysis that AI would cite?
- Entity Coverage: Are basketball entities (players, teams, stats) clearly defined?
- FAQ Readiness: Could content be restructured as Q&A? Does it anticipate user questions?
- E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness signals?`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articleIds } = body;

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "articleIds array required" },
        { status: 400 }
      );
    }

    // Limit to 10 articles per scan to control costs
    const limitedIds = articleIds.slice(0, 10);

    const articles = await prisma.article.findMany({
      where: { id: { in: limitedIds } },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        metaTitle: true,
        metaDesc: true,
        keywords: true,
      },
    });

    if (articles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No articles found with provided IDs" },
        { status: 404 }
      );
    }

    const results: Array<{
      articleId: string;
      slug: string;
      title: string;
      analysis: Record<string, unknown>;
      scannedAt: string;
    }> = [];

    for (const article of articles) {
      // Check for cached result (24h TTL)
      const cacheKey = `geo_scan:${article.id}`;
      const cached = await cache.get<Record<string, unknown>>(cacheKey);
      if (cached) {
        results.push({
          articleId: article.id,
          slug: article.slug,
          title: article.title,
          analysis: cached,
          scannedAt: (cached.scannedAt as string) || new Date().toISOString(),
        });
        continue;
      }

      try {
        // Truncate content to avoid token limits
        const truncatedContent = article.content.slice(0, 3000);

        const prompt = `Analyze this basketball content for GEO (Generative Engine Optimization):

Title: ${article.title}
Meta Title: ${article.metaTitle || "None"}
Meta Description: ${article.metaDesc || "None"}
Keywords: ${(article.keywords || []).join(", ") || "None"}

Content:
${truncatedContent}`;

        const response = await deepseek.generate(prompt, GEO_SYSTEM_PROMPT, {
          temperature: 0.3,
          maxTokens: 800,
        });

        let analysis: Record<string, unknown>;
        try {
          // Extract JSON from response (handle markdown code blocks)
          const jsonStr = response.content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
          analysis = JSON.parse(jsonStr);
        } catch {
          analysis = {
            error: "Failed to parse AI response",
            rawResponse: response.content.slice(0, 500),
            overallScore: 0,
            topSuggestions: ["AI analysis returned invalid format. Rule-based scores are still available."],
          };
        }

        const scannedAt = new Date().toISOString();
        const resultWithTimestamp = { ...analysis, scannedAt };

        // Cache for 24 hours
        await cache.set(cacheKey, resultWithTimestamp, 86400);

        results.push({
          articleId: article.id,
          slug: article.slug,
          title: article.title,
          analysis: resultWithTimestamp,
          scannedAt,
        });
      } catch (aiError) {
        results.push({
          articleId: article.id,
          slug: article.slug,
          title: article.title,
          analysis: {
            error: aiError instanceof Error ? aiError.message : "AI analysis failed",
            overallScore: 0,
            topSuggestions: ["DeepSeek AI analysis failed. Check API key configuration."],
          },
          scannedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      scannedCount: results.length,
      totalRequested: limitedIds.length,
    });
  } catch (error) {
    console.error("GEO Scan API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run GEO scan" },
      { status: 500 }
    );
  }
}
