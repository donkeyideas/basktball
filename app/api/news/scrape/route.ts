import { NextRequest, NextResponse } from "next/server";

// Cache scraped content at CDN for 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ success: false, error: "Missing url param" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Basktball/1.0)",
        Accept: "text/html",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch article" }, { status: 502 });
    }

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

      // Keep real paragraphs — filter out nav text, copyright, cookie notices
      if (
        text.length > 50 &&
        !text.startsWith("©") &&
        !text.toLowerCase().includes("cookie") &&
        !text.toLowerCase().includes("subscribe") &&
        !text.toLowerCase().includes("sign up for") &&
        !text.toLowerCase().includes("download the app")
      ) {
        paragraphs.push(text);
      }
    }

    if (paragraphs.length === 0) {
      return NextResponse.json({ success: true, content: null });
    }

    // Return first several paragraphs (up to ~3000 chars)
    let content = "";
    for (const p of paragraphs) {
      if (content.length + p.length > 3000) break;
      content += p + "\n\n";
    }

    return NextResponse.json(
      { success: true, content: content.trim() },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch {
    return NextResponse.json({ success: false, error: "Scrape failed" }, { status: 502 });
  }
}
