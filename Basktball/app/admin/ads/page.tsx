"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type AdStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED";
type AdSlot =
  | "HEADER_BANNER"
  | "SIDEBAR_TOP"
  | "SIDEBAR_BOTTOM"
  | "IN_CONTENT"
  | "FOOTER_BANNER"
  | "MOBILE_STICKY"
  | "TOOL_SIDEBAR";

interface AdCampaign {
  id: string;
  name: string;
  status: AdStatus;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
  placements: AdPlacement[];
}

interface AdPlacement {
  id: string;
  slot: AdSlot;
  imageUrl: string;
  linkUrl: string;
  impressions: number;
  clicks: number;
}

// Mock data
const mockCampaigns: AdCampaign[] = [
  {
    id: "1",
    name: "Homepage Banner Q1",
    status: "ACTIVE",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    impressions: 125430,
    clicks: 3241,
    ctr: 2.58,
    placements: [
      {
        id: "p1",
        slot: "HEADER_BANNER",
        imageUrl: "/ads/header-banner.png",
        linkUrl: "https://example.com/promo",
        impressions: 85000,
        clicks: 2100,
      },
      {
        id: "p2",
        slot: "IN_CONTENT",
        imageUrl: "/ads/in-content.png",
        linkUrl: "https://example.com/promo",
        impressions: 40430,
        clicks: 1141,
      },
    ],
  },
  {
    id: "2",
    name: "Sidebar Promotion",
    status: "ACTIVE",
    startDate: "2026-01-15",
    endDate: "2026-02-28",
    impressions: 45200,
    clicks: 892,
    ctr: 1.97,
    placements: [
      {
        id: "p3",
        slot: "SIDEBAR_TOP",
        imageUrl: "/ads/sidebar.png",
        linkUrl: "https://example.com/offer",
        impressions: 45200,
        clicks: 892,
      },
    ],
  },
  {
    id: "3",
    name: "Mobile Campaign",
    status: "PAUSED",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    impressions: 12000,
    clicks: 180,
    ctr: 1.5,
    placements: [
      {
        id: "p4",
        slot: "MOBILE_STICKY",
        imageUrl: "/ads/mobile.png",
        linkUrl: "https://example.com/mobile",
        impressions: 12000,
        clicks: 180,
      },
    ],
  },
];

const slotLabels: Record<AdSlot, string> = {
  HEADER_BANNER: "Header Banner (728x90)",
  SIDEBAR_TOP: "Sidebar Top (300x250)",
  SIDEBAR_BOTTOM: "Sidebar Bottom (300x250)",
  IN_CONTENT: "In-Content (728x90)",
  FOOTER_BANNER: "Footer Banner (728x90)",
  MOBILE_STICKY: "Mobile Sticky (320x50)",
  TOOL_SIDEBAR: "Tool Sidebar (300x600)",
};

export default function AdsManagementPage() {
  const [campaigns] = useState<AdCampaign[]>(mockCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const getStatusColor = (status: AdStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "PAUSED":
        return "bg-yellow-500";
      case "DRAFT":
        return "bg-gray-500";
      case "ENDED":
        return "bg-red-500";
    }
  };

  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
            AD MANAGEMENT
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Create and manage ad campaigns across the site
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreating(true)}
        >
          + New Campaign
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">Active Campaigns</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            {campaigns.filter((c) => c.status === "ACTIVE").length}
          </p>
        </Card>
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">Total Impressions</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            {(totalImpressions / 1000).toFixed(1)}K
          </p>
        </Card>
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">Total Clicks</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-white">
            {totalClicks.toLocaleString()}
          </p>
        </Card>
        <Card variant="default" className="p-4">
          <p className="text-white/50 text-xs uppercase mb-1">Average CTR</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-2xl text-[var(--orange)]">
            {overallCTR.toFixed(2)}%
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaigns List */}
        <div className="lg:col-span-2">
          <Card variant="default" className="p-5">
            <h2 className="font-bold text-white mb-4">Campaigns</h2>
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => setSelectedCampaign(campaign)}
                  className={cn(
                    "p-4 bg-[var(--black)] cursor-pointer transition-colors border-2",
                    selectedCampaign?.id === campaign.id
                      ? "border-[var(--orange)]"
                      : "border-transparent hover:border-white/20"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{campaign.name}</h3>
                      <p className="text-white/50 text-xs">
                        {campaign.startDate} to {campaign.endDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          getStatusColor(campaign.status)
                        )}
                      />
                      <span className="text-xs text-white/70">{campaign.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-white/40 text-xs">Impressions</p>
                      <p className="font-[family-name:var(--font-roboto-mono)] text-sm text-white">
                        {campaign.impressions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">Clicks</p>
                      <p className="font-[family-name:var(--font-roboto-mono)] text-sm text-white">
                        {campaign.clicks.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">CTR</p>
                      <p className="font-[family-name:var(--font-roboto-mono)] text-sm text-[var(--orange)]">
                        {campaign.ctr.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Campaign Details / Create Form */}
        <div>
          {selectedCampaign ? (
            <Card variant="bordered" className="p-5 border-[var(--orange)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white">Campaign Details</h2>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-white/50 hover:text-white"
                >
                  x
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-white/50 text-xs uppercase mb-1">Name</p>
                  <p className="text-white">{selectedCampaign.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/50 text-xs uppercase mb-1">Status</p>
                    <select
                      className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-3 py-2 text-sm"
                      defaultValue={selectedCampaign.status}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PAUSED">Paused</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ENDED">Ended</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs uppercase mb-1">Placements</p>
                    <p className="text-white">{selectedCampaign.placements.length}</p>
                  </div>
                </div>

                <div>
                  <p className="text-white/50 text-xs uppercase mb-2">Ad Placements</p>
                  <div className="space-y-2">
                    {selectedCampaign.placements.map((placement) => (
                      <div
                        key={placement.id}
                        className="bg-[var(--black)] p-3 text-sm"
                      >
                        <p className="text-[var(--orange)] font-semibold">
                          {slotLabels[placement.slot]}
                        </p>
                        <div className="flex justify-between text-xs text-white/50 mt-1">
                          <span>{placement.impressions.toLocaleString()} imp</span>
                          <span>{placement.clicks} clicks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="primary" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Duplicate
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card variant="default" className="p-5">
              <h2 className="font-bold text-white mb-4">Ad Slots</h2>
              <p className="text-white/50 text-sm mb-4">
                Available placement locations across the site:
              </p>
              <div className="space-y-2">
                {Object.entries(slotLabels).map(([slot, label]) => (
                  <div
                    key={slot}
                    className="bg-[var(--black)] p-3 flex items-center justify-between"
                  >
                    <span className="text-white text-sm">{label}</span>
                    <span className="text-[var(--orange)] text-xs">Available</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card variant="bordered" className="p-6 w-full max-w-lg border-[var(--orange)]">
            <h2 className="font-[family-name:var(--font-anton)] text-xl tracking-wider text-white mb-6">
              CREATE CAMPAIGN
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm block mb-1">Campaign Name</label>
                <input
                  type="text"
                  className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2"
                  placeholder="Enter campaign name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm block mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">Ad Slot</label>
                <select className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2">
                  {Object.entries(slotLabels).map(([slot, label]) => (
                    <option key={slot} value={slot}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">Image URL</label>
                <input
                  type="text"
                  className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-white/70 text-sm block mb-1">Link URL</label>
                <input
                  type="text"
                  className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="primary" className="flex-1">
                  Create Campaign
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
