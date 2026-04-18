// URL extraction and video provider detection — pure functions, browser-safe

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

export function extractAllUrls(text: string): string[] {
  return text.match(URL_REGEX) || [];
}

interface VideoInfo {
  provider: "youtube" | "twitch" | "tiktok" | "instagram";
  embedUrl: string;
}

export function detectVideoProvider(url: string): VideoInfo | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = u.searchParams.get("v");
      if (videoId) {
        return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}` };
      }
      const shortsMatch = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) {
        return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}` };
      }
    }
    if (host === "youtu.be") {
      const videoId = u.pathname.slice(1);
      if (videoId) {
        return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}` };
      }
    }

    // Twitch: twitch.tv/videos/ID, twitch.tv/CHANNEL (clips)
    if (host === "twitch.tv" || host === "clips.twitch.tv") {
      const videoMatch = u.pathname.match(/\/videos\/(\d+)/);
      if (videoMatch) {
        return { provider: "twitch", embedUrl: `https://player.twitch.tv/?video=${videoMatch[1]}&parent=${typeof window !== "undefined" ? window.location.hostname : "basktball.com"}` };
      }
      const channelMatch = u.pathname.match(/^\/([a-zA-Z0-9_]+)\/?$/);
      if (channelMatch && !["videos", "clips", "about"].includes(channelMatch[1])) {
        return { provider: "twitch", embedUrl: `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${typeof window !== "undefined" ? window.location.hostname : "basktball.com"}` };
      }
    }

    // TikTok: tiktok.com/@user/video/ID
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const tiktokMatch = u.pathname.match(/\/video\/(\d+)/);
      if (tiktokMatch) {
        return { provider: "tiktok", embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}` };
      }
    }

    // Instagram: instagram.com/reel/ID, instagram.com/p/ID
    if (host === "instagram.com") {
      const igMatch = u.pathname.match(/\/(reel|p)\/([a-zA-Z0-9_-]+)/);
      if (igMatch) {
        return { provider: "instagram", embedUrl: `https://www.instagram.com/${igMatch[1]}/${igMatch[2]}/embed` };
      }
    }

    return null;
  } catch {
    return null;
  }
}
