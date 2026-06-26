import { NextRequest, NextResponse } from "next/server";
import { getAllArticles } from "@/lib/news/articles";

// Cache at Vercel CDN level — revalidate every 5 minutes
export const revalidate = 300;

// =============================================================================
// API HANDLER — thin wrapper over lib/news/articles.getAllArticles()
// =============================================================================
export async function GET(request: NextRequest) {
  // Cache 5 min at CDN, serve stale up to 10 min while revalidating
  const headers = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" };

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const articles = await getAllArticles();

    return NextResponse.json({
      success: true,
      articles: articles.slice(0, limit),
      total: articles.length,
    }, { headers });
  } catch (error) {
    console.error("News aggregation error:", error);
    return NextResponse.json({
      success: false,
      articles: [],
      error: "Failed to fetch news",
    }, { status: 500, headers });
  }
}
