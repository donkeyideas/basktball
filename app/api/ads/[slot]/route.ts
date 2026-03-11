import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// Fallback ad data for when no database ads are configured
const fallbackAds: Record<string, any> = {
  HEADER_BANNER: {
    id: "fallback-header",
    imageUrl: "/ads/header-banner.png",
    linkUrl: "https://example.com/promo",
    altText: "Special Promotion",
    campaignId: "fallback",
  },
  SIDEBAR_TOP: {
    id: "fallback-sidebar",
    imageUrl: "/ads/sidebar-300x250.png",
    linkUrl: "https://example.com/offer",
    altText: "Featured Offer",
    campaignId: "fallback",
  },
  IN_CONTENT: {
    id: "fallback-content",
    imageUrl: "/ads/in-content-728x90.png",
    linkUrl: "https://example.com/deal",
    altText: "Limited Time Deal",
    campaignId: "fallback",
  },
  FOOTER_BANNER: {
    id: "fallback-footer",
    imageUrl: "/ads/footer-banner.png",
    linkUrl: "https://example.com/subscribe",
    altText: "Subscribe Now",
    campaignId: "fallback",
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slot: string }> }
) {
  try {
    const { slot } = await params;
    const now = new Date();

    // Query database for active ads in this slot
    const ads = await prisma.adPlacement.findMany({
      where: {
        slot: slot as any,
        campaign: {
          status: "ACTIVE",
          OR: [
            { startDate: null },
            { startDate: { lte: now } },
          ],
          AND: [
            {
              OR: [
                { endDate: null },
                { endDate: { gte: now } },
              ],
            },
          ],
        },
      },
      include: {
        campaign: true,
      },
      orderBy: { weight: "desc" },
    });

    if (ads.length === 0) {
      // Return fallback ad if no database ads found
      const fallback = fallbackAds[slot];
      return NextResponse.json({ ad: fallback || null, source: "fallback" });
    }

    // Weighted random selection
    const totalWeight = ads.reduce((sum, ad) => sum + ad.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedAd = ads[0];

    for (const ad of ads) {
      random -= ad.weight;
      if (random <= 0) {
        selectedAd = ad;
        break;
      }
    }

    // Track impression (fire and forget)
    prisma.adPlacement
      .update({
        where: { id: selectedAd.id },
        data: { impressions: { increment: 1 } },
      })
      .catch((err) => console.error("Failed to track impression:", err));

    return NextResponse.json({
      ad: {
        id: selectedAd.id,
        imageUrl: selectedAd.imageUrl,
        htmlContent: selectedAd.htmlContent,
        linkUrl: selectedAd.linkUrl,
        altText: selectedAd.altText,
        campaignId: selectedAd.campaignId,
      },
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching ad:", error);
    // Return fallback on error
    const { slot } = await params;
    const fallback = fallbackAds[slot];
    return NextResponse.json({ ad: fallback || null, source: "fallback" });
  }
}
