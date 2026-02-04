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

    // Format pages for SEO based on actual article data
    const pages = articles.map((article) => ({
      path: `/${article.slug}`,
      title: article.metaTitle || article.title,
      metaDescription: article.metaDesc || "",
      keywords: article.keywords || [],
      lastCrawled: article.updatedAt.toISOString().split("T")[0],
      indexStatus: article.status === "PUBLISHED" ? "indexed" : "pending",
      impressions: article.viewCount,
      clicks: Math.floor(article.viewCount * 0.05), // Estimated from views
      position: article.viewCount > 1000 ? 5 : article.viewCount > 100 ? 15 : 30,
    }));

    const allPages = pages.sort((a, b) => b.clicks - a.clicks).slice(0, 10);

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

    // Calculate actual SEO scores based on data
    const technicalScore = avgResponseTime < 200 ? 100 : avgResponseTime < 500 ? Math.round(100 - (avgResponseTime - 200) / 6) : 50;
    const contentScore = Math.round((pagesWithMeta / Math.max(allPages.length, 1)) * 100);
    const vitalsScore = avgResponseTime < 300 ? 100 : avgResponseTime < 500 ? 80 : avgResponseTime < 1000 ? 60 : 40;
    const linkingScore = Math.round((pagesWithKeywords / Math.max(allPages.length, 1)) * 100);

    const seoScores = [
      {
        category: "Technical",
        score: technicalScore,
        status: technicalScore >= 80 ? "good" as const : technicalScore >= 50 ? "warning" as const : "error" as const,
        issues: avgResponseTime > 500 ? ["Slow response times detected"] : [],
      },
      {
        category: "Content",
        score: contentScore,
        status: contentScore >= 80 ? "good" as const : contentScore >= 50 ? "warning" as const : "error" as const,
        issues: pagesWithMeta < allPages.length ? [`${allPages.length - pagesWithMeta} pages need meta descriptions`] : [],
      },
      {
        category: "Core Vitals",
        score: vitalsScore,
        status: vitalsScore >= 80 ? "good" as const : vitalsScore >= 50 ? "warning" as const : "error" as const,
        issues: avgResponseTime > 300 ? ["Response times could be improved"] : [],
      },
      {
        category: "Mobile",
        score: allPages.length > 0 ? 100 : 0, // All pages are responsive by default
        status: allPages.length > 0 ? "good" as const : "warning" as const,
        issues: allPages.length === 0 ? ["No pages to analyze"] : [],
      },
      {
        category: "Linking",
        score: linkingScore,
        status: linkingScore >= 70 ? "good" as const : linkingScore >= 40 ? "warning" as const : "error" as const,
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
