import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import type { AutomationConfig } from "@/lib/social/types";

export const dynamic = "force-dynamic";

const AUTOMATION_KEYS = {
  enabled: "SOCIAL_AUTO_ENABLED",
  platforms: "SOCIAL_AUTO_PLATFORMS",
  hour: "SOCIAL_AUTO_HOUR",
  topics: "SOCIAL_AUTO_TOPICS",
  includeDebates: "SOCIAL_AUTO_INCLUDE_DEBATES",
  requireApproval: "SOCIAL_AUTO_REQUIRE_APPROVAL",
} as const;

// GET /api/admin/social/automation — read automation config
export async function GET() {
  try {
    const keys = Object.values(AUTOMATION_KEYS);
    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));

    const config: AutomationConfig = {
      enabled: map.get(AUTOMATION_KEYS.enabled) === "true",
      platforms: JSON.parse(map.get(AUTOMATION_KEYS.platforms) || "[]"),
      hour: parseInt(map.get(AUTOMATION_KEYS.hour) || "14", 10),
      topics: JSON.parse(map.get(AUTOMATION_KEYS.topics) || "[]"),
      includeDebates: map.get(AUTOMATION_KEYS.includeDebates) === "true",
      requireApproval: map.get(AUTOMATION_KEYS.requireApproval) !== "false",
    };

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Error fetching automation config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch automation config" },
      { status: 500 }
    );
  }
}

// POST /api/admin/social/automation — save automation config
export async function POST(req: NextRequest) {
  try {
    const config = (await req.json()) as AutomationConfig;

    const upserts = [
      {
        key: AUTOMATION_KEYS.enabled,
        value: String(config.enabled),
      },
      {
        key: AUTOMATION_KEYS.platforms,
        value: JSON.stringify(config.platforms),
      },
      {
        key: AUTOMATION_KEYS.hour,
        value: String(config.hour),
      },
      {
        key: AUTOMATION_KEYS.topics,
        value: JSON.stringify(config.topics),
      },
      {
        key: AUTOMATION_KEYS.includeDebates,
        value: String(config.includeDebates),
      },
      {
        key: AUTOMATION_KEYS.requireApproval,
        value: String(config.requireApproval),
      },
    ];

    await Promise.all(
      upserts.map(({ key, value }) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value, type: "string" },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving automation config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save automation config" },
      { status: 500 }
    );
  }
}
