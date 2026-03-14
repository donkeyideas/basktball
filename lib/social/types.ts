import type { SocialPlatform, SocialPostStatus } from "@prisma/client";

export interface GeneratedDraft {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  imagePrompt: string;
}

export interface PublishResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface AutomationConfig {
  enabled: boolean;
  platforms: SocialPlatform[];
  hour: number;
  topics: string[];
  includeDebates: boolean;
  requireApproval: boolean;
}

export interface PlatformCredentials {
  [key: string]: string;
}

export interface PlatformConfig {
  name: string;
  maxLength: number;
  hashtagStyle: "inline" | "bottom";
  systemPrompt: string;
  credentialFields: { key: string; label: string; placeholder: string }[];
  setupGuide: string;
}

export const TONE_OPTIONS = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "hype", label: "Hype" },
  { id: "analytical", label: "Analytical" },
] as const;

export type Tone = (typeof TONE_OPTIONS)[number]["id"];
