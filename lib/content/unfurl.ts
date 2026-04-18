// Server-only: Fetch OG metadata from a URL using cheerio
import * as cheerio from "cheerio";
import { detectVideoProvider } from "./url-parser";

export interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  videoEmbedUrl: string | null;
  videoProvider: string | null;
}

export async function unfurlUrl(url: string): Promise<LinkPreviewData | null> {
  // Detect video provider first — we'll use this as fallback if scraping fails
  const video = detectVideoProvider(url);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      // If scraping failed but we have an embed URL, return a minimal preview
      if (video) return buildFallbackPreview(url, video);
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      if (video) return buildFallbackPreview(url, video);
      return null;
    }

    const html = await res.text();

    const $ = cheerio.load(html);

    const getMeta = (property: string): string | null => {
      return (
        $(`meta[property="${property}"]`).attr("content") ||
        $(`meta[name="${property}"]`).attr("content") ||
        null
      );
    };

    const title = getMeta("og:title") || $("title").text().trim() || null;
    const description = getMeta("og:description") || getMeta("description") || null;
    let image = getMeta("og:image") || null;
    const siteName = getMeta("og:site_name") || null;

    // Make relative image URLs absolute
    if (image && !image.startsWith("http")) {
      try {
        image = new URL(image, url).href;
      } catch {
        image = null;
      }
    }

    // If scraping got no useful data but we have an embed, use fallback
    if (!title && !description && !image && video) {
      return buildFallbackPreview(url, video);
    }

    return {
      url,
      title: title?.slice(0, 300) || null,
      description: description?.slice(0, 500) || null,
      image: image?.slice(0, 2000) || null,
      siteName: siteName?.slice(0, 100) || null,
      videoEmbedUrl: video?.embedUrl || null,
      videoProvider: video?.provider || null,
    };
  } catch {
    // If scraping threw but we have an embed URL, return a minimal preview
    if (video) return buildFallbackPreview(url, video);
    return null;
  }
}

/** Fallback preview for platforms that block scraping (Instagram, TikTok, etc.) */
function buildFallbackPreview(
  url: string,
  video: { provider: string; embedUrl: string }
): LinkPreviewData {
  const providerNames: Record<string, string> = {
    youtube: "YouTube",
    twitch: "Twitch",
    tiktok: "TikTok",
    instagram: "Instagram",
  };
  return {
    url,
    title: `${providerNames[video.provider] || video.provider} Video`,
    description: null,
    image: null,
    siteName: providerNames[video.provider] || video.provider,
    videoEmbedUrl: video.embedUrl,
    videoProvider: video.provider,
  };
}
