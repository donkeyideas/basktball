import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Flat settings keys that the UI uses
const settingsKeys = [
  "deepseekApiKey",
  "nbaApiUserAgent",
  "cacheDuration",
  "autoGenerateInsights",
  "autoGenerateRecaps",
  "autoGenerateSpotlights",
  "requireManualApproval",
  "maintenanceMode",
];

// Default values
const defaultSettings: Record<string, string | number | boolean> = {
  deepseekApiKey: "",
  nbaApiUserAgent: "MyApp/1.0",
  cacheDuration: 300,
  autoGenerateInsights: false,
  autoGenerateRecaps: false,
  autoGenerateSpotlights: false,
  requireManualApproval: true,
  maintenanceMode: false,
};

export async function GET() {
  try {
    // Get all settings from database
    const dbSettings = await prisma.setting.findMany({
      where: {
        key: { in: settingsKeys },
      },
    });

    // Build flat settings object
    const settings: Record<string, string | number | boolean> = { ...defaultSettings };

    for (const setting of dbSettings) {
      // Parse the value based on type
      let value: string | number | boolean = setting.value;
      if (setting.value === "true") value = true;
      else if (setting.value === "false") value = false;
      else if (!isNaN(Number(setting.value)) && setting.key === "cacheDuration") {
        value = Number(setting.value);
      }
      settings[setting.key] = value;
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

// Handle both POST and PUT for saving settings
async function saveSettings(request: Request) {
  try {
    const settings = await request.json();

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { success: false, error: "Settings data required" },
        { status: 400 }
      );
    }

    // Upsert each setting
    const upsertPromises: Promise<unknown>[] = [];

    for (const [key, value] of Object.entries(settings)) {
      // Only save known settings keys
      if (settingsKeys.includes(key)) {
        const stringValue = String(value);
        upsertPromises.push(
          prisma.setting.upsert({
            where: { key },
            update: { value: stringValue },
            create: { key, value: stringValue },
          })
        );
      }
    }

    await Promise.all(upsertPromises);

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return saveSettings(request);
}

export async function PUT(request: Request) {
  return saveSettings(request);
}
