import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campaigns = await prisma.adCampaign.findMany({
      include: {
        placements: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedCampaigns = campaigns.map((campaign) => {
      const totalImpressions = campaign.placements.reduce((sum, p) => sum + p.impressions, 0);
      const totalClicks = campaign.placements.reduce((sum, p) => sum + p.clicks, 0);
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        startDate: campaign.startDate?.toISOString().split("T")[0] || null,
        endDate: campaign.endDate?.toISOString().split("T")[0] || null,
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: parseFloat(ctr.toFixed(2)),
        placements: campaign.placements.map((p) => ({
          id: p.id,
          slot: p.slot,
          imageUrl: p.imageUrl,
          linkUrl: p.linkUrl,
          impressions: p.impressions,
          clicks: p.clicks,
        })),
      };
    });

    const totalImpressions = formattedCampaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = formattedCampaigns.reduce((sum, c) => sum + c.clicks, 0);
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return NextResponse.json({
      success: true,
      campaigns: formattedCampaigns,
      stats: {
        activeCampaigns: formattedCampaigns.filter((c) => c.status === "ACTIVE").length,
        totalImpressions,
        totalClicks,
        overallCTR: parseFloat(overallCTR.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Ads API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ads data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, startDate, endDate, slot, imageUrl, linkUrl } = body;

    const campaign = await prisma.adCampaign.create({
      data: {
        name,
        status: "DRAFT",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        placements: {
          create: {
            slot,
            imageUrl,
            linkUrl,
          },
        },
      },
      include: {
        placements: true,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
