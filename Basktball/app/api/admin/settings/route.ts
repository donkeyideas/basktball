import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Default settings structure
const defaultSettings = {
  general: {
    siteName: "Basktball",
    siteDescription: "Advanced Basketball Analytics Platform",
    maintenanceMode: false,
  },
  api: {
    ballDontLieEnabled: true,
    espnFallbackEnabled: true,
    cacheEnabled: true,
    cacheTtl: 30,
  },
  ai: {
    deepSeekEnabled: true,
    autoApproveThreshold: 80,
    maxTokensPerRequest: 500,
    dailyTokenLimit: 100000,
  },
  features: {
    liveScoresEnabled: true,
    aiInsightsEnabled: true,
    bettingInsightsEnabled: true,
    fantasyToolsEnabled: true,
  },
};

export async function GET() {
  try {
    // Get all settings from database
    const dbSettings = await prisma.setting.findMany();

    // Build settings object from database, using defaults for missing values
    const settings = { ...defaultSettings };

    for (const setting of dbSettings) {
      const [category, key] = setting.key.split(".");
      if (category && key && settings[category as keyof typeof settings]) {
        const categorySettings = settings[category as keyof typeof settings] as Record<string, unknown>;
        // Parse the value based on type
        let value: unknown = setting.value;
        if (setting.value === "true") value = true;
        else if (setting.value === "false") value = false;
        else if (!isNaN(Number(setting.value))) value = Number(setting.value);
        categorySettings[key] = value;
      }
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Settings data required" },
        { status: 400 }
      );
    }

    // Flatten settings and upsert each one
    const upsertPromises: Promise<unknown>[] = [];

    for (const [category, categorySettings] of Object.entries(settings)) {
      if (typeof categorySettings === "object" && categorySettings !== null) {
        for (const [key, value] of Object.entries(categorySettings)) {
          const settingKey = `${category}.${key}`;
          const stringValue = String(value);

          upsertPromises.push(
            prisma.setting.upsert({
              where: { key: settingKey },
              update: { value: stringValue },
              create: { key: settingKey, value: stringValue },
            })
          );
        }
      }
    }

    await Promise.all(upsertPromises);

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
