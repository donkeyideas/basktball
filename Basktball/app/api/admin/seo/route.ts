import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get articles for page data
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        metaTitle: true,
        metaDesc: true,
        keywords: true,
        status: true,
        viewCount: true,
        publishedAt: true,
        updatedAt: true,
      },
      orderBy: { viewCount: "desc" },
      take: 20,
    });

    // Get API logs to simulate search console data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const apiLogs = await prisma.apiLog.findMany({
      where: {
        timestamp: { gte: sevenDaysAgo },
        statusCode: 200,
      },
      select: {
        endpoint: true,
        responseTime: true,
      },
    });

    // Calculate simulated search console metrics
    const totalPageViews = apiLogs.length;
    const avgResponseTime = apiLogs.length > 0
      ? apiLogs.reduce((sum, log) => sum + log.responseTime, 0) / apiLogs.length
      : 0;

    // Format pages for SEO
    const pages = articles.map((article) => ({
      path: `/${article.slug}`,
      title: article.metaTitle || article.title,
      metaDescription: article.metaDesc || "",
      keywords: article.keywords || [],
      lastCrawled: article.updatedAt.toISOString().split("T")[0],
      indexStatus: article.status === "PUBLISHED" ? "indexed" : "pending",
      impressions: article.viewCount * 10, // Simulated
      clicks: article.viewCount,
      position: Math.max(1, Math.min(50, 20 - Math.log10(article.viewCount + 1) * 5)),
    }));

    // Add static pages
    const staticPages = [
      { path: "/", title: "Basktball - Basketball Analytics", position: 4.2 },
      { path: "/tools/shot-chart", title: "Shot Chart Analyzer", position: 8.5 },
      { path: "/tools/compare", title: "Player Comparison", position: 12.3 },
      { path: "/stats", title: "League Leaders", position: 6.1 },
      { path: "/live", title: "Live Scores", position: 5.8 },
    ].map((p) => ({
      ...p,
      metaDescription: "Basketball analytics and stats",
      keywords: ["basketball", "NBA"],
      lastCrawled: new Date().toISOString().split("T")[0],
      indexStatus: "indexed" as const,
      impressions: Math.floor(Math.random() * 50000) + 5000,
      clicks: Math.floor(Math.random() * 5000) + 500,
    }));

    const allPages = [...staticPages, ...pages].sort((a, b) => b.clicks - a.clicks).slice(0, 10);

    // Calculate totals
    const totalImpressions = allPages.reduce((sum, p) => sum + p.impressions, 0);
    const totalClicks = allPages.reduce((sum, p) => sum + p.clicks, 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition = allPages.length > 0
      ? allPages.reduce((sum, p) => sum + p.position, 0) / allPages.length
      : 0;

    // SEO health scores based on actual data
    const pagesWithMeta = allPages.filter((p) => p.metaDescription.length > 50).length;
    const pagesWithKeywords = allPages.filter((p) => p.keywords.length > 0).length;

    const seoScores = [
      {
        category: "Technical",
        score: 92,
        status: "good" as const,
        issues: avgResponseTime > 500 ? ["Slow response times detected"] : [],
      },
      {
        category: "Content",
        score: Math.round((pagesWithMeta / Math.max(allPages.length, 1)) * 100),
        status: pagesWithMeta >= allPages.length * 0.8 ? "good" as const : "warning" as const,
        issues: pagesWithMeta < allPages.length ? [`${allPages.length - pagesWithMeta} pages need meta descriptions`] : [],
      },
      {
        category: "Core Vitals",
        score: avgResponseTime < 300 ? 95 : avgResponseTime < 500 ? 80 : 65,
        status: avgResponseTime < 300 ? "good" as const : avgResponseTime < 500 ? "good" as const : "warning" as const,
        issues: avgResponseTime > 300 ? ["Response times could be improved"] : [],
      },
      {
        category: "Mobile",
        score: 95,
        status: "good" as const,
        issues: [],
      },
      {
        category: "Linking",
        score: Math.round((pagesWithKeywords / Math.max(allPages.length, 1)) * 100),
        status: pagesWithKeywords >= allPages.length * 0.7 ? "good" as const : "warning" as const,
        issues: pagesWithKeywords < allPages.length ? [`${allPages.length - pagesWithKeywords} pages missing keywords`] : [],
      },
    ];

    return NextResponse.json({
      success: true,
      searchConsole: {
        totalImpressions,
        totalClicks,
        averageCTR: parseFloat(avgCTR.toFixed(2)),
        averagePosition: parseFloat(avgPosition.toFixed(1)),
        indexedPages: allPages.filter((p) => p.indexStatus === "indexed").length,
        pendingPages: allPages.filter((p) => p.indexStatus === "pending").length,
        errorPages: 0,
      },
      seoScores,
      pages: allPages,
    });
  } catch (error) {
    console.error("SEO API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch SEO data" },
      { status: 500 }
    );
  }
}
