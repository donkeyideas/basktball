import { prisma } from "@/lib/db/prisma";
import type { SocialPlatform, SocialMediaPost } from "@prisma/client";
import type { PublishResult, PlatformCredentials } from "./types";

// ---------------------------------------------------------------------------
// Credential helpers
// ---------------------------------------------------------------------------

export async function getPlatformCredentials(
  platform: SocialPlatform
): Promise<PlatformCredentials> {
  const prefix = `SOCIAL_${platform}_`;
  const settings = await prisma.setting.findMany({
    where: { key: { startsWith: prefix } },
  });
  const creds: PlatformCredentials = {};
  for (const s of settings) {
    creds[s.key.replace(prefix, "")] = s.value;
  }
  return creds;
}

function hasCredentials(creds: PlatformCredentials, ...keys: string[]): boolean {
  return keys.every((k) => creds[k]?.trim());
}

// ---------------------------------------------------------------------------
// Platform adapters
// ---------------------------------------------------------------------------

async function publishToTwitter(
  post: SocialMediaPost,
  creds: PlatformCredentials
): Promise<PublishResult> {
  if (!hasCredentials(creds, "BEARER_TOKEN")) {
    return { success: false, error: "Twitter credentials incomplete (need BEARER_TOKEN)" };
  }

  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.BEARER_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: post.content }),
  });

  if (!response.ok) {
    const errText = await response.text();
    return { success: false, error: `Twitter API ${response.status}: ${errText}` };
  }

  const data = await response.json();
  return { success: true, externalId: data.data?.id };
}

async function publishToLinkedIn(
  post: SocialMediaPost,
  creds: PlatformCredentials
): Promise<PublishResult> {
  if (!hasCredentials(creds, "ACCESS_TOKEN", "PERSON_ID")) {
    return { success: false, error: "LinkedIn credentials incomplete" };
  }

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${creds.PERSON_ID}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: post.content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: `LinkedIn API error: ${response.status} - ${errorText}` };
  }

  const data = await response.json();
  return { success: true, externalId: data.id };
}

async function publishToFacebook(
  post: SocialMediaPost,
  creds: PlatformCredentials
): Promise<PublishResult> {
  if (!hasCredentials(creds, "PAGE_ACCESS_TOKEN", "PAGE_ID")) {
    return { success: false, error: "Facebook credentials incomplete" };
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${creds.PAGE_ID}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: post.content,
        access_token: creds.PAGE_ACCESS_TOKEN,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: `Facebook API error: ${response.status} - ${errorText}` };
  }

  const data = await response.json();
  return { success: true, externalId: data.id };
}

async function publishToInstagram(
  _post: SocialMediaPost,
  _creds: PlatformCredentials
): Promise<PublishResult> {
  return {
    success: false,
    error: "Instagram publishing requires image/video media and is not yet implemented.",
  };
}

async function publishToTikTok(
  _post: SocialMediaPost,
  _creds: PlatformCredentials
): Promise<PublishResult> {
  return {
    success: false,
    error: "TikTok publishing requires video content and is not yet implemented.",
  };
}

// ---------------------------------------------------------------------------
// Main publish dispatcher
// ---------------------------------------------------------------------------

export async function publishPost(post: SocialMediaPost): Promise<PublishResult> {
  const creds = await getPlatformCredentials(post.platform);

  switch (post.platform) {
    case "TWITTER":
      return publishToTwitter(post, creds);
    case "LINKEDIN":
      return publishToLinkedIn(post, creds);
    case "FACEBOOK":
      return publishToFacebook(post, creds);
    case "INSTAGRAM":
      return publishToInstagram(post, creds);
    case "TIKTOK":
      return publishToTikTok(post, creds);
    default:
      return { success: false, error: "Unsupported platform" };
  }
}

// ---------------------------------------------------------------------------
// Test connection
// ---------------------------------------------------------------------------

export async function testConnection(
  platform: SocialPlatform
): Promise<{ success: boolean; message: string }> {
  const creds = await getPlatformCredentials(platform);

  try {
    switch (platform) {
      case "TWITTER": {
        if (!hasCredentials(creds, "BEARER_TOKEN")) {
          return { success: false, message: "Twitter BEARER_TOKEN is missing." };
        }
        const twitterRes = await fetch("https://api.twitter.com/2/users/me", {
          headers: { Authorization: `Bearer ${creds.BEARER_TOKEN}` },
        });
        if (!twitterRes.ok) {
          return { success: false, message: `Twitter API error: ${twitterRes.status}` };
        }
        const twitterData = await twitterRes.json();
        return { success: true, message: `Connected as @${twitterData.data?.username || "unknown"}` };
      }

      case "LINKEDIN": {
        if (!hasCredentials(creds, "ACCESS_TOKEN")) {
          return { success: false, message: "LinkedIn access token is missing." };
        }
        const res = await fetch("https://api.linkedin.com/v2/me", {
          headers: { Authorization: `Bearer ${creds.ACCESS_TOKEN}` },
        });
        if (!res.ok) return { success: false, message: `LinkedIn API returned ${res.status}` };
        const data = await res.json();
        return {
          success: true,
          message: `Connected as ${data.localizedFirstName} ${data.localizedLastName}`,
        };
      }

      case "FACEBOOK": {
        if (!hasCredentials(creds, "PAGE_ACCESS_TOKEN", "PAGE_ID")) {
          return { success: false, message: "Facebook credentials are incomplete." };
        }
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${creds.PAGE_ID}?access_token=${creds.PAGE_ACCESS_TOKEN}&fields=name`
        );
        if (!res.ok) return { success: false, message: `Facebook API returned ${res.status}` };
        const data = await res.json();
        return { success: true, message: `Connected to page: ${data.name}` };
      }

      case "INSTAGRAM":
        return { success: false, message: "Instagram connection test not yet implemented." };

      case "TIKTOK":
        return { success: false, message: "TikTok connection test not yet implemented." };

      default:
        return { success: false, message: "Unsupported platform." };
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Connection test failed",
    };
  }
}
