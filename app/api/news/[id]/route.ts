import { NextResponse } from "next/server";
import { findArticleById } from "@/lib/news/cache";

// Cache scraped articles at CDN for 10 minutes
export const revalidate = 600;

const scrapedContentCache = new Map<string, { content: string | null; timestamp: number }>();
const SCRAPE_CACHE_TTL = 600000; // 10 minutes

async function scrapeArticleContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      headers: { "User-Agent": "Basktball/1.0", Accept: "text/html" },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    if (!res.ok) return null;

    const html = await res.text();

    // Extract paragraph text from the article body
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    while ((match = pRegex.exec(html)) !== null) {
      const text = match[1]
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;|&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
        .replace(/\s+/g, " ")
        .trim();

      // Filter out short/navigation text and keep real paragraphs
      if (text.length > 60 && !text.startsWith("©") && !text.includes("cookie")) {
        paragraphs.push(text);
      }
    }

    if (paragraphs.length === 0) return null;

    // Return first several paragraphs (up to ~2000 chars)
    let result = "";
    for (const p of paragraphs) {
      if (result.length + p.length > 2000) break;
      result += p + "\n\n";
    }

    return result.trim() || null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const article = findArticleById(id);

  if (!article) {
    return NextResponse.json(
      { success: false, error: "Article not found" },
      { status: 404 }
    );
  }

  const headers = { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" };

  // If no content from RSS, try scraping the article page (with in-memory cache)
  if (!article.content) {
    const cached = scrapedContentCache.get(id);
    if (cached && Date.now() - cached.timestamp < SCRAPE_CACHE_TTL) {
      if (cached.content) {
        return NextResponse.json({ success: true, article: { ...article, content: cached.content } }, { headers });
      }
    } else {
      const scraped = await scrapeArticleContent(article.link);
      scrapedContentCache.set(id, { content: scraped, timestamp: Date.now() });
      if (scraped) {
        return NextResponse.json({ success: true, article: { ...article, content: scraped } }, { headers });
      }
    }
  }

  return NextResponse.json({ success: true, article }, { headers });
}
