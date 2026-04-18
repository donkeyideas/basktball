// scripts/backfill-link-previews.ts
// Backfills linkPreview for existing takes that have URLs but no preview data.
// Run with: npx tsx scripts/backfill-link-previews.ts

import { PrismaClient, Prisma } from "@prisma/client";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

function detectVideoProvider(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = u.searchParams.get("v");
      if (videoId) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}` };
      const shortsMatch = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}` };
    }
    if (host === "youtu.be") {
      const videoId = u.pathname.slice(1).split("?")[0];
      if (videoId) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}` };
    }
    if (host === "twitch.tv" || host === "clips.twitch.tv") {
      const videoMatch = u.pathname.match(/\/videos\/(\d+)/);
      if (videoMatch) return { provider: "twitch", embedUrl: `https://player.twitch.tv/?video=${videoMatch[1]}&parent=basktball.com` };
    }
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const tiktokMatch = u.pathname.match(/\/video\/(\d+)/);
      if (tiktokMatch) return { provider: "tiktok", embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}` };
    }
    if (host === "instagram.com") {
      const igMatch = u.pathname.match(/\/(reel|p)\/([a-zA-Z0-9_-]+)/);
      if (igMatch) return { provider: "instagram", embedUrl: `https://www.instagram.com/${igMatch[1]}/${igMatch[2]}/embed` };
    }
    return null;
  } catch {
    return null;
  }
}

async function unfurlUrl(url: string) {
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
      console.log(`  HTTP ${res.status} for ${url}`);
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      console.log(`  Not HTML: ${contentType}`);
      return null;
    }

    const html = await res.text();

    const $ = cheerio.load(html);
    const getMeta = (property: string) =>
      $(`meta[property="${property}"]`).attr("content") ||
      $(`meta[name="${property}"]`).attr("content") ||
      null;

    const title = getMeta("og:title") || $("title").text().trim() || null;
    const description = getMeta("og:description") || getMeta("description") || null;
    let image = getMeta("og:image") || null;
    const siteName = getMeta("og:site_name") || null;

    if (image && !image.startsWith("http")) {
      try { image = new URL(image, url).href; } catch { image = null; }
    }

    const video = detectVideoProvider(url);

    return {
      url,
      title: title?.slice(0, 300) || null,
      description: description?.slice(0, 500) || null,
      image: image?.slice(0, 2000) || null,
      siteName: siteName?.slice(0, 100) || null,
      videoEmbedUrl: video?.embedUrl || null,
      videoProvider: video?.provider || null,
    };
  } catch (err) {
    console.log(`  Unfurl error: ${err}`);
    return null;
  }
}

async function main() {
  // Find takes that have URLs in content but no linkPreview
  const takes = await prisma.take.findMany({
    where: { linkPreview: { equals: Prisma.DbNull } },
    select: { id: true, content: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${takes.length} takes without linkPreview.`);

  let updated = 0;
  for (const take of takes) {
    const url = extractFirstUrl(take.content);
    if (!url) continue;

    console.log(`Processing take ${take.id}: ${url}`);
    const preview = await unfurlUrl(url);

    if (preview && (preview.title || preview.image)) {
      await prisma.take.update({
        where: { id: take.id },
        data: { linkPreview: JSON.parse(JSON.stringify(preview)) },
      });
      updated++;
      console.log(`  -> Saved: "${preview.title}" (video: ${preview.videoProvider || "none"})`);
    } else {
      console.log(`  -> No usable preview data`);
    }
  }

  console.log(`\nDone! Updated ${updated} takes with link previews.`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
