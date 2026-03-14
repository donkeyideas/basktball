import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/social/credentials — read credentials (masked)
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: "SOCIAL_" } },
    });

    // Group by platform, mask values
    const credentials: Record<string, Record<string, string>> = {};

    for (const s of settings) {
      // Skip automation config keys
      if (s.key.startsWith("SOCIAL_AUTO_")) continue;

      // Parse key: SOCIAL_TWITTER_API_KEY → platform=TWITTER, field=API_KEY
      const parts = s.key.replace("SOCIAL_", "").split("_");
      const platform = parts[0];
      const field = parts.slice(1).join("_");

      if (!credentials[platform]) credentials[platform] = {};

      // Mask the value — show only last 4 characters
      const value = s.value;
      credentials[platform][field] =
        value.length > 4 ? "●".repeat(value.length - 4) + value.slice(-4) : "●●●●";
    }

    return NextResponse.json({ success: true, credentials });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch credentials" },
      { status: 500 }
    );
  }
}

// POST /api/admin/social/credentials — save platform credentials
export async function POST(req: NextRequest) {
  try {
    const { platform, credentials } = (await req.json()) as {
      platform: string;
      credentials: Record<string, string>;
    };

    if (!platform || !credentials) {
      return NextResponse.json(
        { success: false, error: "Platform and credentials are required" },
        { status: 400 }
      );
    }

    // Upsert each credential
    const operations = Object.entries(credentials)
      .filter(([, value]) => value && !value.startsWith("●"))
      .map(([field, value]) => {
        const key = `SOCIAL_${platform}_${field}`;
        return prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value, type: "string" },
        });
      });

    await Promise.all(operations);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving credentials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save credentials" },
      { status: 500 }
    );
  }
}
