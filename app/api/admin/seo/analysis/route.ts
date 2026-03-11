import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { cache } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

// Known static pages in the app (not in DB)
// hasGenerateMetadata/hasOgTags reflect what's actually implemented
const STATIC_PAGES = [
  // Main pages
  { path: "/", title: "Home - BASKTBALL", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: true },
  { path: "/scores", title: "Scores", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/live", title: "Live Scores", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/standings", title: "Standings", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/schedule", title: "Schedule", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/stats", title: "Stats", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: true },
  { path: "/teams", title: "Teams", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: true },
  { path: "/players", title: "Players", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: true },
  { path: "/news", title: "News & Insights", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/playoffs", title: "Playoffs", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/contact", title: "Contact Us", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/forum", title: "Forum", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/login", title: "Sign In", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/register", title: "Register", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  // Dynamic detail pages (with generateMetadata + JSON-LD)
  { path: "/player/[id]", title: "Player Detail", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/game/[id]", title: "Game Detail", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/teams/[league]/[id]", title: "Team Detail", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  // Tools
  { path: "/tools", title: "Tools", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/tools/shot-chart", title: "Shot Chart", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/tools/compare", title: "Player Compare", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/tools/metrics", title: "Advanced Metrics", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/tools/predictor", title: "Game Predictor", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/tools/fantasy", title: "Fantasy", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/tools/betting", title: "Betting", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/tools/draft", title: "Draft", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/tools/history", title: "History", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
  { path: "/tools/team-analytics", title: "Team Analytics", hasGenerateMetadata: true, hasOgTags: true, hasJsonLd: true, hasCanonical: true, hasFaqSchema: false },
];

function computeGeoScore(content: string, keywords: string[], metaDesc: string | null): {
  total: number;
  aiFriendliness: number;
  citationWorthiness: number;
  entityCoverage: number;
  faqStructure: number;
  eeat: number;
} {
  const lower = content.toLowerCase();

  // AI Friendliness: clear structure, direct answers, headings
  let aiFriendliness = 0;
  if (content.length > 300) aiFriendliness += 20;
  if (content.length > 800) aiFriendliness += 10;
  if (content.includes("#") || content.includes("<h")) aiFriendliness += 20;
  if (content.includes("\n\n")) aiFriendliness += 15; // Paragraph breaks
  if (metaDesc && metaDesc.length > 50) aiFriendliness += 20;
  if (keywords.length >= 3) aiFriendliness += 15;
  aiFriendliness = Math.min(100, aiFriendliness);

  // Citation worthiness: data, stats, unique content
  let citationWorthiness = 0;
  if (/\d+(\.\d+)?%/.test(content)) citationWorthiness += 20;
  if (/\d{2,}/.test(content)) citationWorthiness += 15;
  if (content.length > 600) citationWorthiness += 20;
  if (keywords.length > 0) citationWorthiness += 15;
  if (lower.includes("according to") || lower.includes("data shows") || lower.includes("statistics")) citationWorthiness += 15;
  if (lower.includes("source") || lower.includes("report")) citationWorthiness += 15;
  citationWorthiness = Math.min(100, citationWorthiness);

  // Entity coverage: mentions of basketball entities
  let entityCoverage = 0;
  const entityPatterns = ["nba", "player", "team", "game", "season", "points", "rebounds", "assists", "championship", "playoff"];
  const matchedEntities = entityPatterns.filter((p) => lower.includes(p));
  entityCoverage = Math.min(100, Math.round((matchedEntities.length / entityPatterns.length) * 100));

  // FAQ structure
  let faqStructure = 0;
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount >= 1) faqStructure += 30;
  if (questionCount >= 3) faqStructure += 20;
  if (lower.includes("faq") || lower.includes("frequently asked")) faqStructure += 30;
  if (lower.includes("what is") || lower.includes("how to") || lower.includes("why")) faqStructure += 20;
  faqStructure = Math.min(100, faqStructure);

  // E-E-A-T
  let eeat = 0;
  if (content.length > 500) eeat += 20;
  if (keywords.length >= 2) eeat += 20;
  if (metaDesc && metaDesc.length > 80) eeat += 20;
  if (lower.includes("expert") || lower.includes("analysis") || lower.includes("insight")) eeat += 20;
  if (lower.includes("source") || lower.includes("according")) eeat += 20;
  eeat = Math.min(100, eeat);

  const total = Math.round(
    aiFriendliness * 0.25 + citationWorthiness * 0.25 + entityCoverage * 0.2 + faqStructure * 0.15 + eeat * 0.15
  );

  return { total, aiFriendliness, citationWorthiness, entityCoverage, faqStructure, eeat };
}

export async function GET() {
  try {
    const cached = await cache.get<Record<string, unknown>>("admin:seo:analysis:v2");
    if (cached) {
      return NextResponse.json({ success: true, ...cached });
    }

    const articles = await prisma.article.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        metaTitle: true,
        metaDesc: true,
        keywords: true,
        content: true,
        status: true,
        viewCount: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: { viewCount: "desc" },
    });

    // --- Per-page SEO audit ---
    const pageAudits = articles.map((article) => {
      const hasMetaTitle = !!(article.metaTitle && article.metaTitle.length > 10);
      const hasMetaDesc = !!(article.metaDesc && article.metaDesc.length > 50);
      const hasKeywords = !!(article.keywords && article.keywords.length > 0);
      const metaDescLength = article.metaDesc?.length || 0;
      const titleLength = (article.metaTitle || article.title).length;

      // SEO score per page
      let seoScore = 0;
      if (hasMetaTitle) seoScore += 20;
      if (hasMetaDesc) seoScore += 20;
      if (metaDescLength >= 120 && metaDescLength <= 160) seoScore += 10;
      if (hasKeywords) seoScore += 15;
      if (article.content.length > 300) seoScore += 15;
      if (titleLength >= 30 && titleLength <= 60) seoScore += 10;
      if (article.status === "PUBLISHED") seoScore += 10;
      seoScore = Math.min(100, seoScore);

      // GEO score per page
      const geo = computeGeoScore(article.content, article.keywords || [], article.metaDesc);

      return {
        id: article.id,
        path: `/news/${article.slug}`,
        title: article.metaTitle || article.title,
        hasMetaTitle,
        hasMetaDesc,
        hasKeywords,
        hasOgTags: true, // OG tags set via root layout metadata
        indexStatus: article.status === "PUBLISHED" ? "indexed" : "pending",
        seoScore,
        geoScore: geo.total,
        geoBreakdown: geo,
        metaDescLength,
        titleLength,
        wordCount: article.content.split(/\s+/).length,
        keywords: article.keywords || [],
        viewCount: article.viewCount,
        lastUpdated: article.updatedAt.toISOString().split("T")[0],
        issues: [
          ...(!hasMetaTitle ? ["Missing meta title"] : []),
          ...(!hasMetaDesc ? ["Missing meta description"] : []),
          ...(metaDescLength > 0 && metaDescLength < 120 ? ["Meta description too short (< 120 chars)"] : []),
          ...(metaDescLength > 160 ? ["Meta description too long (> 160 chars)"] : []),
          ...(!hasKeywords ? ["No keywords defined"] : []),
          ...(article.content.length < 300 ? ["Content too thin (< 300 chars)"] : []),
          ...(!hasMetaTitle && !hasMetaDesc ? ["No SEO metadata at all"] : []),
        ],
      };
    });

    // Static pages audit - reflects actual implementation state
    const staticAudits = STATIC_PAGES.map((page) => {
      const isHome = page.path === "/";
      const hasMetaTitle = page.hasGenerateMetadata;
      const hasMetaDesc = page.hasGenerateMetadata; // layout.tsx exports include description
      const hasKeywords = page.hasGenerateMetadata; // layout.tsx exports include keywords

      // Build issues list based on what's actually missing
      const issues: string[] = [];
      if (!page.hasGenerateMetadata) issues.push("Missing metadata export");
      if (!page.hasJsonLd && !isHome) issues.push("No JSON-LD structured data");

      // Compute score: metadata title/desc/keywords + OG tags + canonical + JSON-LD
      let seoScore = 0;
      if (hasMetaTitle) seoScore += 20;
      if (hasMetaDesc) seoScore += 20;
      if (hasKeywords) seoScore += 15;
      if (page.hasOgTags) seoScore += 15;
      if (page.hasCanonical) seoScore += 10;
      if (page.hasJsonLd) seoScore += 15;
      if (page.hasGenerateMetadata) seoScore += 5; // bonus for having proper metadata export
      seoScore = Math.min(100, seoScore);

      // GEO score for static pages with FAQ schema
      const faqScore = page.hasFaqSchema ? 100 : 0;
      const staticGeoScore = page.hasFaqSchema
        ? Math.round(70 * 0.25 + 50 * 0.25 + 60 * 0.2 + faqScore * 0.15 + 60 * 0.15)
        : 0;

      return {
        id: `static-${page.path}`,
        path: page.path,
        title: page.title,
        hasMetaTitle,
        hasMetaDesc,
        hasKeywords,
        hasOgTags: page.hasOgTags,
        indexStatus: "indexed" as const,
        seoScore,
        geoScore: staticGeoScore,
        geoBreakdown: {
          total: staticGeoScore,
          aiFriendliness: page.hasFaqSchema ? 70 : 0,
          citationWorthiness: page.hasFaqSchema ? 50 : 0,
          entityCoverage: page.hasFaqSchema ? 60 : 0,
          faqStructure: faqScore,
          eeat: page.hasFaqSchema ? 60 : 0,
        },
        metaDescLength: isHome ? 90 : 0,
        titleLength: page.title.length,
        wordCount: 0,
        keywords: isHome ? ["basketball", "NBA", "stats"] : [],
        viewCount: 0,
        lastUpdated: new Date().toISOString().split("T")[0],
        issues,
      };
    });

    const allPages = [...staticAudits, ...pageAudits];

    // --- Keyword analysis ---
    const keywordMap = new Map<string, number>();
    articles.forEach((a) => {
      (a.keywords || []).forEach((kw) => {
        const normalized = kw.toLowerCase().trim();
        if (normalized) {
          keywordMap.set(normalized, (keywordMap.get(normalized) || 0) + 1);
        }
      });
    });
    const topKeywords = Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    // High-value basketball keywords to check coverage
    const targetKeywords = [
      "nba", "basketball", "stats", "analytics", "live scores", "player stats",
      "nba standings", "fantasy basketball", "nba predictions", "basketball betting",
      "wnba", "ncaa basketball", "nba draft", "nba playoffs", "nba news",
    ];
    const coveredKeywords = targetKeywords.filter((tk) =>
      articles.some((a) => (a.keywords || []).some((k) => k.toLowerCase().includes(tk)))
    );
    const missingKeywords = targetKeywords.filter((tk) => !coveredKeywords.includes(tk));

    // --- Meta tag completeness ---
    const published = articles.filter((a) => a.status === "PUBLISHED");
    const metaCompleteness = {
      complete: published.filter(
        (a) => a.metaTitle && a.metaDesc && a.metaDesc.length >= 120 && a.keywords && a.keywords.length > 0
      ).length,
      partial: published.filter(
        (a) => (a.metaTitle || a.metaDesc || (a.keywords && a.keywords.length > 0)) &&
          !(a.metaTitle && a.metaDesc && a.metaDesc.length >= 120 && a.keywords && a.keywords.length > 0)
      ).length,
      missing: published.filter(
        (a) => !a.metaTitle && !a.metaDesc && (!a.keywords || a.keywords.length === 0)
      ).length,
      staticMissing: STATIC_PAGES.filter((p) => !p.hasGenerateMetadata && p.path !== "/").length,
    };

    const result = {
      pages: allPages,
      topKeywords,
      targetKeywords: targetKeywords.map((kw) => ({
        keyword: kw,
        covered: coveredKeywords.includes(kw),
      })),
      missingKeywords,
      metaCompleteness,
      summary: {
        totalPages: allPages.length,
        avgSeoScore: allPages.length > 0
          ? Math.round(allPages.reduce((s, p) => s + p.seoScore, 0) / allPages.length)
          : 0,
        avgGeoScore: pageAudits.length > 0
          ? Math.round(pageAudits.reduce((s, p) => s + p.geoScore, 0) / pageAudits.length)
          : 0,
        pagesWithIssues: allPages.filter((p) => p.issues.length > 0).length,
      },
    };

    await cache.set("admin:seo:analysis:v2", result, 600);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("SEO Analysis API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch SEO analysis" },
      { status: 500 }
    );
  }
}
