// Admin Settings Helper
// Reads settings from the database with in-memory caching (60s TTL)
// Used by middleware, jobs, and other server-side code

import { prisma } from "@/lib/db/prisma";

interface AppSettings {
  deepseekApiKey: string;
  nbaApiUserAgent: string;
  cacheDuration: number;
  autoGenerateInsights: boolean;
  autoGenerateRecaps: boolean;
  autoGenerateSpotlights: boolean;
  requireManualApproval: boolean;
  maintenanceMode: boolean;
}

const defaults: AppSettings = {
  deepseekApiKey: "",
  nbaApiUserAgent: "Basktball/1.0",
  cacheDuration: 300,
  autoGenerateInsights: false,
  autoGenerateRecaps: false,
  autoGenerateSpotlights: false,
  requireManualApproval: true,
  maintenanceMode: false,
};

let cached: { settings: AppSettings; expiresAt: number } | null = null;

export async function getSettings(): Promise<AppSettings> {
  // Return cached if still valid
  if (cached && cached.expiresAt > Date.now()) {
    return cached.settings;
  }

  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: Object.keys(defaults) } },
    });

    const settings: AppSettings = { ...defaults };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = settings as any;
    for (const row of rows) {
      const key = row.key as keyof AppSettings;
      if (key in defaults) {
        const defaultVal = defaults[key];
        if (typeof defaultVal === "boolean") {
          s[key] = row.value === "true";
        } else if (typeof defaultVal === "number") {
          s[key] = Number(row.value) || defaultVal;
        } else {
          s[key] = row.value;
        }
      }
    }

    cached = { settings, expiresAt: Date.now() + 60_000 };
    return settings;
  } catch {
    // If DB is down, return defaults
    return defaults;
  }
}

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  const settings = await getSettings();
  return settings[key];
}

// Clear the cache (called after settings are saved)
export function clearSettingsCache(): void {
  cached = null;
}
