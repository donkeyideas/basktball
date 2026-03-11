import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { cache } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

interface Recommendation {
  id: string;
  severity: "critical" | "warning" | "info";
  category: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  fix: string;
  affectedPages?: string[];
}

export async function GET() {
  try {
    const cached = await cache.get<Record<string, unknown>>("admin:seo:recommendations:v2");
    if (cached) {
      return NextResponse.json({ success: true, ...cached });
    }

    const [articles, apiLogs] = await Promise.all([
      prisma.article.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          metaTitle: true,
          metaDesc: true,
          keywords: true,
          content: true,
          status: true,
          updatedAt: true,
        },
      }),
      prisma.apiLog.findMany({
        where: { timestamp: { gte: new Date(Date.now() - 7 * 86400000) } },
        select: { endpoint: true, responseTime: true, statusCode: true },
      }),
    ]);

    const published = articles.filter((a) => a.status === "PUBLISHED");
    const recommendations: Recommendation[] = [];

    // ===== CRITICAL =====
    // Note: JSON-LD, generateMetadata, sitemap, OG tags, and canonical URLs
    // have been implemented and are no longer flagged.

    // 1. Content pages with empty meta descriptions
    const noMetaDesc = published.filter((a) => !a.metaDesc || a.metaDesc.length < 10);
    if (noMetaDesc.length > 0) {
      recommendations.push({
        id: "critical-metadesc",
        severity: "critical",
        category: "Content",
        title: `${noMetaDesc.length} published article(s) have no meta description`,
        description:
          "Meta descriptions are what appear in search result snippets and what AI engines read to understand page content. Missing descriptions mean Google auto-generates one, which is often poor.",
        impact: "high",
        fix: "Add compelling meta descriptions (120-160 characters) to each article. Focus on answering 'what will the reader learn?' Include primary keywords naturally.",
        affectedPages: noMetaDesc.map((a) => `/news/${a.slug}`),
      });
    }

    // ===== WARNING =====

    // 7. Short meta descriptions
    const shortMetaDesc = published.filter(
      (a) => a.metaDesc && a.metaDesc.length > 0 && a.metaDesc.length < 120
    );
    if (shortMetaDesc.length > 0) {
      recommendations.push({
        id: "warn-short-metadesc",
        severity: "warning",
        category: "Content",
        title: `${shortMetaDesc.length} article(s) have short meta descriptions (< 120 chars)`,
        description:
          "Short meta descriptions waste valuable SERP real estate. Google displays up to 160 characters. Longer, descriptive meta descriptions improve CTR.",
        impact: "medium",
        fix: "Expand meta descriptions to 120-160 characters. Include the primary keyword, a value proposition, and a call to action.",
        affectedPages: shortMetaDesc.map((a) => `/news/${a.slug}`),
      });
    }

    // 8. Articles missing keywords
    const noKeywords = published.filter((a) => !a.keywords || a.keywords.length === 0);
    if (noKeywords.length > 0) {
      recommendations.push({
        id: "warn-no-keywords",
        severity: "warning",
        category: "Content",
        title: `${noKeywords.length} article(s) have no keywords defined`,
        description:
          "Keywords help organize content internally and signal relevance to search engines. They also help the GEO system understand content topics for AI citation matching.",
        impact: "medium",
        fix: "Add 3-5 relevant keywords to each article. Use basketball-specific terms (team names, player names, stat types, event names).",
        affectedPages: noKeywords.map((a) => `/news/${a.slug}`),
      });
    }

    // 9. No FAQ/Q&A content
    // Check articles for FAQ-style content
    const articlesWithFaq = published.filter((a) => {
      const lower = a.content.toLowerCase();
      return lower.includes("?") || lower.includes("faq");
    });
    // Static pages with FAQPage JSON-LD schema: /, /stats, /teams, /players
    const staticPagesWithFaq = 4;
    const hasFaqContent = articlesWithFaq.length > 0 || staticPagesWithFaq > 0;
    if (!hasFaqContent) {
      recommendations.push({
        id: "warn-no-faq",
        severity: "warning",
        category: "GEO",
        title: "No FAQ/Q&A structured content found",
        description:
          "AI engines heavily favor content that directly answers questions. FAQ-style content with clear Q&A format is much more likely to be cited by ChatGPT, Perplexity, and Google AI Overviews.",
        impact: "medium",
        fix: "Add FAQ sections to key content pages. Structure them with question headings (H3) followed by direct, concise answers. Consider adding FAQPage JSON-LD schema.",
      });
    }

    // 10. Stale content
    const staleArticles = published.filter(
      (a) => Date.now() - a.updatedAt.getTime() > 30 * 86400000
    );
    if (staleArticles.length > 0) {
      recommendations.push({
        id: "warn-stale-content",
        severity: "warning",
        category: "Content",
        title: `${staleArticles.length} article(s) not updated in 30+ days`,
        description:
          "Search engines and AI models favor fresh content. Stale articles lose ranking over time. Regular updates signal that content is maintained and accurate.",
        impact: "medium",
        fix: "Review and update stale articles with new stats, recent developments, or expanded analysis. Even small updates with a new 'Updated on' date help.",
        affectedPages: staleArticles.map((a) => `/news/${a.slug}`),
      });
    }

    // 11. Slow response times
    const avgResponseTime = apiLogs.length > 0
      ? apiLogs.reduce((s, l) => s + l.responseTime, 0) / apiLogs.length
      : 0;
    if (avgResponseTime > 500) {
      const slowEndpoints = new Map<string, number[]>();
      apiLogs.forEach((l) => {
        const times = slowEndpoints.get(l.endpoint) || [];
        times.push(l.responseTime);
        slowEndpoints.set(l.endpoint, times);
      });
      const slowest = Array.from(slowEndpoints.entries())
        .map(([endpoint, times]) => ({
          endpoint,
          avg: times.reduce((a, b) => a + b, 0) / times.length,
        }))
        .filter((e) => e.avg > 500)
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5);

      recommendations.push({
        id: "warn-slow-response",
        severity: "warning",
        category: "Performance",
        title: `Average response time is ${Math.round(avgResponseTime)}ms (should be < 500ms)`,
        description:
          "Slow pages hurt Core Web Vitals and search rankings. Google uses page speed as a ranking factor. AI crawlers also time out on slow pages.",
        impact: "medium",
        fix: `Optimize the slowest endpoints: ${slowest.map((s) => `${s.endpoint} (${Math.round(s.avg)}ms)`).join(", ")}. Add caching, optimize database queries, or consider ISR for static content.`,
      });
    }

    // Twitter cards have been implemented in the root layout.

    // 8. Low content quality
    const thinContent = published.filter((a) => a.content.split(/\s+/).length < 100);
    if (thinContent.length > 0) {
      recommendations.push({
        id: "warn-thin-content",
        severity: "warning",
        category: "Content",
        title: `${thinContent.length} article(s) have thin content (< 100 words)`,
        description:
          "Thin content pages rank poorly and are unlikely to be cited by AI engines. Search engines consider pages with < 300 words as potentially low-quality.",
        impact: "medium",
        fix: "Expand thin articles to at least 300+ words. Add analysis, context, stats, and related information. AI engines prefer comprehensive, authoritative content.",
        affectedPages: thinContent.map((a) => `/news/${a.slug}`),
      });
    }

    // 14. No error handling for 404s
    const errorLogs = apiLogs.filter((l) => l.statusCode >= 400);
    const errorRate = apiLogs.length > 0 ? (errorLogs.length / apiLogs.length) * 100 : 0;
    if (errorRate > 5) {
      recommendations.push({
        id: "warn-error-rate",
        severity: "warning",
        category: "Technical",
        title: `High error rate: ${errorRate.toFixed(1)}% of requests return 4xx/5xx`,
        description:
          "High error rates signal to search engines that the site is unreliable. Crawlers may reduce crawl frequency if they encounter too many errors.",
        impact: "medium",
        fix: "Review API logs to identify the most common error endpoints. Fix broken routes, add proper error handling, and ensure 404 pages return correct status codes.",
      });
    }

    // ===== INFO =====

    // 15. Hreflang - only flag if lang attribute is not set
    // The root layout already includes <html lang="en">, so this is resolved.
    // Only show if planning multi-language support in the future.
    // (Removed: lang="en" attribute is present in app/layout.tsx)

    // BreadcrumbList, WebSite search action, and dynamic sitemap have been implemented.

    // --- Merge AEO/CRO recommendations if cached ---
    try {
      const aeoCroCache = await cache.get<Record<string, unknown>>("admin:seo:aeo-cro:v1");
      if (aeoCroCache) {
        const aeoRecs = (aeoCroCache.aeoRecommendations as Recommendation[]) || [];
        const croRecs = (aeoCroCache.croRecommendations as Recommendation[]) || [];
        recommendations.push(...aeoRecs, ...croRecs);
      }
    } catch {
      // AEO/CRO recommendations not available yet
    }

    // --- Compute summary ---
    const summary = {
      total: recommendations.length,
      critical: recommendations.filter((r) => r.severity === "critical").length,
      warning: recommendations.filter((r) => r.severity === "warning").length,
      info: recommendations.filter((r) => r.severity === "info").length,
      categories: Array.from(
        new Set(recommendations.map((r) => r.category))
      ).map((cat) => ({
        category: cat,
        count: recommendations.filter((r) => r.category === cat).length,
      })),
    };

    const result = { recommendations, summary };

    await cache.set("admin:seo:recommendations:v2", result, 600);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("SEO Recommendations API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
