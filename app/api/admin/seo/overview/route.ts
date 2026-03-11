import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { cache } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cached = await cache.get<Record<string, unknown>>("admin:seo:overview:v2");
    if (cached) {
      return NextResponse.json({ success: true, ...cached });
    }

    // --- Fetch raw data ---
    const [articles, apiLogs30d, apiLogs7d, playerCount, teamCount, insightCount] =
      await Promise.all([
        prisma.article.findMany({
          select: {
            id: true,
            title: true,
            metaTitle: true,
            metaDesc: true,
            keywords: true,
            content: true,
            status: true,
            viewCount: true,
            updatedAt: true,
          },
        }),
        prisma.apiLog.findMany({
          where: { timestamp: { gte: new Date(Date.now() - 30 * 86400000) } },
          select: { endpoint: true, responseTime: true, statusCode: true, timestamp: true },
        }),
        prisma.apiLog.findMany({
          where: { timestamp: { gte: new Date(Date.now() - 7 * 86400000) } },
          select: { endpoint: true, responseTime: true, statusCode: true, timestamp: true },
        }),
        prisma.player.count(),
        prisma.team.count(),
        prisma.aiInsight.count({ where: { published: true } }),
      ]);

    // --- Compute SEO scores ---
    const publishedArticles = articles.filter((a) => a.status === "PUBLISHED");
    const totalPages = publishedArticles.length;

    // Meta tags scoring
    const withMetaTitle = publishedArticles.filter((a) => a.metaTitle && a.metaTitle.length > 10).length;
    const withMetaDesc = publishedArticles.filter((a) => a.metaDesc && a.metaDesc.length > 50).length;
    const withKeywords = publishedArticles.filter((a) => a.keywords && a.keywords.length > 0).length;
    const metaScore = totalPages > 0
      ? Math.round(((withMetaTitle + withMetaDesc + withKeywords) / (totalPages * 3)) * 100)
      : 0;

    // Technical scoring (response times)
    const avgResponseTime = apiLogs7d.length > 0
      ? apiLogs7d.reduce((s, l) => s + l.responseTime, 0) / apiLogs7d.length
      : 0;
    const errorRate = apiLogs7d.length > 0
      ? (apiLogs7d.filter((l) => l.statusCode >= 400).length / apiLogs7d.length) * 100
      : 0;
    const technicalScore = Math.round(
      Math.max(0, Math.min(100, 100 - (avgResponseTime > 200 ? (avgResponseTime - 200) / 8 : 0) - errorRate * 2))
    );

    // Content scoring
    const freshArticles = publishedArticles.filter(
      (a) => Date.now() - a.updatedAt.getTime() < 7 * 86400000
    ).length;
    const contentLengthScore = totalPages > 0
      ? publishedArticles.filter((a) => a.content.length > 500).length / totalPages
      : 0;
    const contentScore = totalPages > 0
      ? Math.round(((freshArticles / totalPages) * 40 + contentLengthScore * 60))
      : 0;

    // Performance scoring
    const performanceScore = Math.round(
      Math.max(0, Math.min(100, avgResponseTime < 200 ? 100 : avgResponseTime < 500 ? 85 : avgResponseTime < 1000 ? 60 : 40))
    );

    // Structured data scoring - JSON-LD is on homepage (Organization, WebSite, FAQPage),
    // player pages (Person), team pages (SportsTeam), game pages (SportsEvent),
    // BreadcrumbList on dynamic pages, and FAQPage on /, /stats, /teams, /players
    const structuredDataScore = 90;

    // Mobile score (Next.js + Tailwind = responsive by default)
    const mobileScore = totalPages > 0 ? 90 : 80;

    // Overall SEO score
    const seoScore = Math.round(
      (technicalScore * 0.2 + contentScore * 0.25 + metaScore * 0.25 + performanceScore * 0.15 + structuredDataScore * 0.05 + mobileScore * 0.1)
    );

    // --- Compute GEO scores ---
    // AI Friendliness: content has clear structure, headings, direct answers
    const aiFriendliness = totalPages > 0
      ? Math.round(
          publishedArticles.reduce((score, a) => {
            let s = 0;
            if (a.content.length > 300) s += 25;
            if (a.content.includes("#") || a.content.includes("<h")) s += 25;
            if (a.metaDesc && a.metaDesc.length > 50) s += 25;
            if (a.keywords && a.keywords.length >= 3) s += 25;
            return score + s;
          }, 0) / totalPages
        )
      : 0;

    // Citation worthiness: unique data, stats presence
    const citationWorthiness = totalPages > 0
      ? Math.round(
          publishedArticles.reduce((score, a) => {
            let s = 0;
            const content = a.content.toLowerCase();
            if (/\d+(\.\d+)?%/.test(content)) s += 20; // Has percentages/stats
            if (/\d{2,}/.test(content)) s += 20; // Has numbers
            if (content.length > 800) s += 20; // Substantial content
            if (a.keywords && a.keywords.length > 0) s += 20;
            if (a.metaTitle) s += 20;
            return score + s;
          }, 0) / totalPages
        )
      : 0;

    // Entity coverage
    const entityCoverage = Math.round(
      Math.min(100, ((playerCount > 0 ? 25 : 0) + (teamCount > 0 ? 25 : 0) + (insightCount > 0 ? 25 : 0) + (totalPages > 0 ? 25 : 0)))
    );

    // FAQ structure - includes both article content and static pages with FAQPage JSON-LD
    const staticFaqPages = 4; // Home, Stats, Teams, Players have FAQPage JSON-LD
    const staticFaqScore = Math.min(100, staticFaqPages * 25); // 4 pages = 100
    const articleFaqScore = totalPages > 0
      ? Math.round(
          publishedArticles.reduce((score, a) => {
            const content = a.content.toLowerCase();
            let s = 0;
            if (content.includes("?")) s += 50;
            if (content.includes("faq") || content.includes("question")) s += 50;
            return score + Math.min(100, s);
          }, 0) / totalPages
        )
      : 0;
    // Blend static FAQ presence (60% weight) with article FAQ content (40% weight)
    const faqStructure = Math.round(staticFaqScore * 0.6 + articleFaqScore * 0.4);

    // E-E-A-T signals
    const eeatScore = Math.round(
      Math.min(100, (totalPages > 0 ? 20 : 0) + (insightCount > 5 ? 20 : 0) + (withMetaDesc > 0 ? 20 : 0) + (freshArticles > 0 ? 20 : 0) + (playerCount > 50 ? 20 : 0))
    );

    // Overall GEO score
    const geoScore = Math.round(
      (aiFriendliness * 0.2 + citationWorthiness * 0.2 + entityCoverage * 0.2 + faqStructure * 0.15 + eeatScore * 0.15 + structuredDataScore * 0.1)
    );

    // --- Trend data (last 30 days) ---
    const trendData: Array<{ date: string; seoScore: number; geoScore: number; responseTime: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(Date.now() - i * 86400000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayLogs = apiLogs30d.filter(
        (l) => l.timestamp >= dayStart && l.timestamp < dayEnd
      );
      const dayAvgResponse = dayLogs.length > 0
        ? dayLogs.reduce((s, l) => s + l.responseTime, 0) / dayLogs.length
        : avgResponseTime;
      const dayErrorRate = dayLogs.length > 0
        ? (dayLogs.filter((l) => l.statusCode >= 400).length / dayLogs.length) * 100
        : 0;
      const dayTechScore = Math.round(
        Math.max(0, Math.min(100, 100 - (dayAvgResponse > 200 ? (dayAvgResponse - 200) / 8 : 0) - dayErrorRate * 2))
      );
      const daySeoScore = Math.round(
        (dayTechScore * 0.3 + contentScore * 0.3 + metaScore * 0.25 + mobileScore * 0.15)
      );

      trendData.push({
        date: dayStart.toISOString().split("T")[0],
        seoScore: Math.min(100, Math.max(0, daySeoScore)),
        geoScore: Math.min(100, Math.max(0, geoScore)),
        responseTime: Math.round(dayAvgResponse),
      });
    }

    // --- Issues count (dynamic, based on actual data) ---
    const criticalIssues =
      (metaScore < 50 && totalPages > 0 ? 1 : 0) +
      (totalPages === 0 ? 1 : 0);
    const warningIssues =
      (avgResponseTime > 500 ? 1 : 0) +
      (freshArticles < totalPages * 0.5 && totalPages > 0 ? 1 : 0) +
      (withKeywords < totalPages * 0.5 && totalPages > 0 ? 1 : 0) +
      (faqStructure < 30 ? 1 : 0);
    const infoIssues = 0; // hreflang resolved (lang="en" present)

    // --- SEO Radar data ---
    const seoRadar = [
      { axis: "Technical", value: technicalScore },
      { axis: "Content", value: contentScore },
      { axis: "Meta Tags", value: metaScore },
      { axis: "Structured Data", value: structuredDataScore },
      { axis: "Performance", value: performanceScore },
      { axis: "Mobile", value: mobileScore },
    ];

    // --- GEO Radar data ---
    const geoRadar = [
      { axis: "AI Friendliness", value: aiFriendliness },
      { axis: "Citations", value: citationWorthiness },
      { axis: "Entity Coverage", value: entityCoverage },
      { axis: "FAQ Structure", value: faqStructure },
      { axis: "E-E-A-T", value: eeatScore },
      { axis: "Structured Data", value: structuredDataScore },
    ];

    // --- Try to include AEO/CRO scores from cache ---
    let aeoScore: number | null = null;
    let croScore: number | null = null;
    try {
      const aeoCroCache = await cache.get<Record<string, unknown>>("admin:seo:aeo-cro:v1");
      if (aeoCroCache) {
        aeoScore = typeof aeoCroCache.aeoScore === "number" ? aeoCroCache.aeoScore : null;
        croScore = typeof aeoCroCache.croScore === "number" ? aeoCroCache.croScore : null;
      }
    } catch {
      // AEO/CRO data not available yet
    }

    const result = {
      seoScore,
      geoScore,
      aeoScore,
      croScore,
      pagesAnalyzed: totalPages + 27, // articles + static pages
      issues: { critical: criticalIssues, warning: warningIssues, info: infoIssues },
      seoRadar,
      geoRadar,
      trendData,
      quickStats: {
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: parseFloat(errorRate.toFixed(1)),
        totalArticles: articles.length,
        publishedArticles: totalPages,
        totalPlayers: playerCount,
        totalTeams: teamCount,
        totalInsights: insightCount,
      },
    };

    await cache.set("admin:seo:overview:v2", result, 600);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("SEO Overview API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch SEO overview" },
      { status: 500 }
    );
  }
}
