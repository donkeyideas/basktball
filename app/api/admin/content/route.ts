import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { clearSettingsCache } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Content keys that the admin UI manages
const contentKeys = [
  // Hero section
  "content_hero_title_line1",
  "content_hero_title_line2",
  "content_hero_subtitle",
  "content_hero_btn1_text",
  "content_hero_btn1_link",
  "content_hero_btn2_text",
  "content_hero_btn2_link",
  // Social proof stats
  "content_stat1_value",
  "content_stat1_label",
  "content_stat2_value",
  "content_stat2_label",
  "content_stat3_value",
  "content_stat3_label",
  "content_community_link_text",
  // FAQ
  "content_faq1_question",
  "content_faq1_answer",
  "content_faq2_question",
  "content_faq2_answer",
  "content_faq3_question",
  "content_faq3_answer",
  "content_faq4_question",
  "content_faq4_answer",
  // App download links
  "content_google_play_url",
  "content_apple_store_url",
  // Footer
  "content_footer_copyright",
  "content_footer_update_note",
];

// Default values matching current hardcoded content
const defaultContent: Record<string, string> = {
  content_hero_title_line1: "DOMINATE",
  content_hero_title_line2: "THE DATA",
  content_hero_subtitle: "Real-time basketball analytics, AI-powered insights, and comprehensive stats for every league. From the NBA to international courts.",
  content_hero_btn1_text: "LIVE SCORES",
  content_hero_btn1_link: "/live",
  content_hero_btn2_text: "EXPLORE TOOLS",
  content_hero_btn2_link: "/tools",
  content_stat1_value: "5,000+",
  content_stat1_label: "Basketball Fans",
  content_stat2_value: "30+",
  content_stat2_label: "NBA Teams Tracked Live",
  content_stat3_value: "1,000+",
  content_stat3_label: "Takes Shared on The Court",
  content_community_link_text: "JOIN THE COMMUNITY",
  content_faq1_question: "What is BASKTBALL?",
  content_faq1_answer: "BASKTBALL is a real-time basketball analytics platform providing live scores, player stats, team standings, and advanced analytics for the NBA, WNBA, NCAA, and international basketball leagues.",
  content_faq2_question: "What basketball leagues does BASKTBALL cover?",
  content_faq2_answer: "BASKTBALL covers the NBA, WNBA, NCAA Men's and Women's basketball, EuroLeague, and other international basketball leagues with live scores, standings, and player statistics.",
  content_faq3_question: "How often are live scores updated?",
  content_faq3_answer: "Live scores are updated in near real-time during active games, with data refreshed every 15-30 seconds from official sources including ESPN and the NBA's data feeds.",
  content_faq4_question: "Are the stats and analytics free to use?",
  content_faq4_answer: "Yes, all core features including live scores, player stats, team standings, and stat leaders are completely free. Advanced tools like player comparisons, shot charts, and game predictions are also available at no cost.",
  content_google_play_url: "https://play.google.com/store/apps/details?id=com.basktball.app",
  content_apple_store_url: "",
  content_footer_copyright: "BASKTBALL. All rights reserved.",
  content_footer_update_note: "ALL STATS UPDATED IN REAL-TIME",
};

export async function GET() {
  try {
    const dbSettings = await prisma.setting.findMany({
      where: {
        key: { in: contentKeys },
      },
    });

    const content: Record<string, string> = { ...defaultContent };

    for (const setting of dbSettings) {
      content[setting.key] = setting.value;
    }

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("Content GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const content = await request.json();

    if (!content || typeof content !== "object") {
      return NextResponse.json(
        { success: false, error: "Content data required" },
        { status: 400 }
      );
    }

    const upsertPromises: Promise<unknown>[] = [];

    for (const [key, value] of Object.entries(content)) {
      if (contentKeys.includes(key)) {
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
    clearSettingsCache();

    return NextResponse.json({
      success: true,
      message: "Content updated successfully",
    });
  } catch (error) {
    console.error("Content save error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update content" },
      { status: 500 }
    );
  }
}
