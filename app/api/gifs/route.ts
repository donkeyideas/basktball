import { NextResponse } from "next/server";

// GET /api/gifs?q=lebron+dunk — proxy GIPHY API search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: "GIF search not configured" }, { status: 503 });
    }

    if (!q || q.length < 1) {
      // Return trending GIFs when no query
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20&rating=pg-13`,
      );
      const data = await res.json();
      return NextResponse.json(formatResults(data.data || []));
    }

    const res = await fetch(
      `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(q)}&api_key=${apiKey}&limit=20&rating=pg-13`,
    );
    const data = await res.json();
    return NextResponse.json(formatResults(data.data || []));
  } catch (error) {
    console.error("GIF search error:", error);
    return NextResponse.json({ message: "GIF search failed" }, { status: 500 });
  }
}

function formatResults(results: GiphyResult[]) {
  return results.map((r) => ({
    id: r.id,
    url: r.images?.original?.url || "",
    previewUrl: r.images?.fixed_width_small?.url || r.images?.fixed_width?.url || "",
    width: parseInt(r.images?.original?.width || "200", 10),
    height: parseInt(r.images?.original?.height || "200", 10),
  }));
}

interface GiphyResult {
  id: string;
  images?: {
    original?: { url: string; width: string; height: string };
    fixed_width?: { url: string };
    fixed_width_small?: { url: string };
  };
}
