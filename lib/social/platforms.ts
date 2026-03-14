import type { PlatformConfig } from "./types";
import type { SocialPlatform } from "@prisma/client";

export const PLATFORM_CONFIG: Record<SocialPlatform, PlatformConfig> = {
  TWITTER: {
    name: "Twitter / X",
    maxLength: 280,
    hashtagStyle: "inline",
    systemPrompt:
      "You are a basketball social media manager writing for Twitter/X. Keep tweets under 280 characters including hashtags. Be punchy, use basketball slang, and include 2-3 relevant hashtags inline.",
    credentialFields: [
      { key: "API_KEY", label: "API Key", placeholder: "Enter Twitter API Key" },
      { key: "API_SECRET", label: "API Secret", placeholder: "Enter Twitter API Secret" },
      { key: "ACCESS_TOKEN", label: "Access Token", placeholder: "Enter Access Token" },
      { key: "ACCESS_SECRET", label: "Access Secret", placeholder: "Enter Access Secret" },
    ],
    setupGuide:
      "1. Go to developer.twitter.com and create a project + app.\n2. Enable OAuth 1.0a with Read and Write permissions.\n3. Generate API Key, API Secret, Access Token, and Access Secret.\n4. Paste all four credentials above.",
  },
  LINKEDIN: {
    name: "LinkedIn",
    maxLength: 3000,
    hashtagStyle: "bottom",
    systemPrompt:
      "You are a professional basketball industry analyst writing for LinkedIn. Write 2-3 insightful paragraphs about basketball business, analytics, or strategy. Include 3-5 hashtags at the bottom. Maintain a professional but engaging tone.",
    credentialFields: [
      { key: "ACCESS_TOKEN", label: "Access Token", placeholder: "Enter LinkedIn Access Token" },
      { key: "PERSON_ID", label: "Person URN ID", placeholder: "Enter your LinkedIn Person ID" },
    ],
    setupGuide:
      "1. Create a LinkedIn app at linkedin.com/developers.\n2. Request the w_member_social permission.\n3. Generate an Access Token (valid 60 days).\n4. Find your Person URN ID from the /me endpoint.",
  },
  FACEBOOK: {
    name: "Facebook",
    maxLength: 63206,
    hashtagStyle: "bottom",
    systemPrompt:
      "You are a basketball community manager writing for Facebook. Write an engaging 1-2 paragraph post that encourages discussion. Ask a question at the end. Include 2-3 hashtags.",
    credentialFields: [
      { key: "PAGE_ACCESS_TOKEN", label: "Page Access Token", placeholder: "Enter Facebook Page Access Token" },
      { key: "PAGE_ID", label: "Page ID", placeholder: "Enter Facebook Page ID" },
    ],
    setupGuide:
      "1. Create a Facebook App at developers.facebook.com.\n2. Add the Pages product and request pages_manage_posts permission.\n3. Generate a Page Access Token (use a long-lived token for production).\n4. Find your Page ID from the page's About section.",
  },
  INSTAGRAM: {
    name: "Instagram",
    maxLength: 2200,
    hashtagStyle: "bottom",
    systemPrompt:
      "You are a basketball content creator writing Instagram captions. Write an engaging caption with emoji. Include an image description suggestion. Add 10-15 relevant hashtags at the bottom.",
    credentialFields: [
      { key: "ACCESS_TOKEN", label: "Access Token", placeholder: "Enter Instagram Access Token" },
      { key: "ACCOUNT_ID", label: "Account ID", placeholder: "Enter Instagram Business Account ID" },
    ],
    setupGuide:
      "1. Connect your Instagram Business account to a Facebook Page.\n2. Create a Facebook App and add Instagram Graph API.\n3. Generate an Access Token with instagram_content_publish permission.\n4. Note: Publishing requires an image URL — text-only posts are not supported.",
  },
  TIKTOK: {
    name: "TikTok",
    maxLength: 2200,
    hashtagStyle: "inline",
    systemPrompt:
      "You are a basketball content creator writing TikTok captions. Be very casual, trendy, and use Gen-Z basketball slang. Keep it short (1-2 sentences). Include 3-5 trending hashtags.",
    credentialFields: [
      { key: "ACCESS_TOKEN", label: "Access Token", placeholder: "Enter TikTok Access Token" },
      { key: "OPEN_ID", label: "Open ID", placeholder: "Enter TikTok Open ID" },
    ],
    setupGuide:
      "1. Register as a TikTok developer at developers.tiktok.com.\n2. Create an app and request video.publish scope.\n3. Note: TikTok API only supports video publishing — text-only posts are not supported.",
  },
};

export const PLATFORMS: SocialPlatform[] = ["TWITTER", "LINKEDIN", "FACEBOOK", "INSTAGRAM", "TIKTOK"];
