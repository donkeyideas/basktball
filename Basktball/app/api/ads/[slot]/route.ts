import { NextRequest, NextResponse } from "next/server";

// Mock ad data - replace with database query when Prisma is set up
const mockAds: Record<string, any[]> = {
  HEADER_BANNER: [
    {
      id: "ad-header-1",
      imageUrl: "/ads/header-banner.png",
      linkUrl: "https://example.com/promo",
      altText: "Special Promotion",
      campaignId: "camp-1",
    },
  ],
  SIDEBAR_TOP: [
    {
      id: "ad-sidebar-1",
      imageUrl: "/ads/sidebar-300x250.png",
      linkUrl: "https://example.com/offer",
      altText: "Featured Offer",
      campaignId: "camp-2",
    },
  ],
  IN_CONTENT: [
    {
      id: "ad-content-1",
      imageUrl: "/ads/in-content-728x90.png",
      linkUrl: "https://example.com/deal",
      altText: "Limited Time Deal",
      campaignId: "camp-3",
    },
  ],
  FOOTER_BANNER: [
    {
      id: "ad-footer-1",
      imageUrl: "/ads/footer-banner.png",
      linkUrl: "https://example.com/subscribe",
      altText: "Subscribe Now",
      campaignId: "camp-4",
    },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slot: string }> }
) {
  try {
    const { slot } = await params;

    // In production, query database:
    // const ads = await prisma.adPlacement.findMany({
    //   where: {
    //     slot: slot as any,
    //     campaign: { status: 'ACTIVE', startDate: { lte: new Date() }, endDate: { gte: new Date() } }
    //   },
    //   orderBy: { weight: 'desc' }
    // });

    const ads = mockAds[slot] || [];

    if (ads.length === 0) {
      return NextResponse.json({ ad: null });
    }

    // Weighted random selection if multiple ads
    const selectedAd = ads[Math.floor(Math.random() * ads.length)];

    // Track impression in production:
    // await prisma.adPlacement.update({
    //   where: { id: selectedAd.id },
    //   data: { impressions: { increment: 1 } }
    // });

    return NextResponse.json({ ad: selectedAd });
  } catch (error) {
    console.error("Error fetching ad:", error);
    return NextResponse.json({ ad: null }, { status: 500 });
  }
}
