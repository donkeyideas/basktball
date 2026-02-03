"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
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

interface AdPlacement {
  id: string;
  slot: AdSlot;
  imageUrl: string | null;
  linkUrl: string | null;
  impressions: number;
  clicks: number;
}

interface AdCampaign {
  id: string;
  name: string;
  status: AdStatus;
  startDate: string | null;
  endDate: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  placements: AdPlacement[];
}

interface AdsData {
  success: boolean;
  campaigns: AdCampaign[];
  stats: {
    activeCampaigns: number;
    totalImpressions: number;
    totalClicks: number;
    overallCTR: number;
  };
}

const slotLabels: Record<AdSlot, string> = {
  HEADER_BANNER: "Header (728x90)",
  SIDEBAR_TOP: "Sidebar Top (300x250)",
  SIDEBAR_BOTTOM: "Sidebar Bot (300x250)",
  IN_CONTENT: "In-Content (728x90)",
  FOOTER_BANNER: "Footer (728x90)",
  MOBILE_STICKY: "Mobile (320x50)",
  TOOL_SIDEBAR: "Tool Side (300x600)",
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdsManagementPage() {
  const { data, isLoading } = useSWR<AdsData>("/api/admin/ads", fetcher);
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    slot: "HEADER_BANNER" as AdSlot,
    imageUrl: "",
    linkUrl: "",
  });

  const campaigns = data?.campaigns || [];
  const stats = data?.stats || { activeCampaigns: 0, totalImpressions: 0, totalClicks: 0, overallCTR: 0 };

  const getStatusColor = (status: AdStatus) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500";
      case "PAUSED": return "bg-yellow-500";
      case "DRAFT": return "bg-gray-500";
      case "ENDED": return "bg-red-500";
    }
  };

  const handleCreate = async () => {
    try {
      await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      mutate("/api/admin/ads");
      setIsCreating(false);
      setFormData({ name: "", startDate: "", endDate: "", slot: "HEADER_BANNER", imageUrl: "", linkUrl: "" });
    } catch (error) {
      console.error("Create campaign error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex-1 grid grid-cols-3 gap-1.5">
          <div className="col-span-2 bg-[var(--dark-gray)] rounded animate-pulse" />
          <div className="bg-[var(--dark-gray)] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden">
      {/* Header + Stats */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <h1 className="font-[family-name:var(--font-anton)] text-xl tracking-wider text-white">
            AD MANAGEMENT
          </h1>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Active:</span>
              <span className="font-mono text-white">{stats.activeCampaigns}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Impr:</span>
              <span className="font-mono text-white">{(stats.totalImpressions / 1000).toFixed(1)}K</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Clicks:</span>
              <span className="font-mono text-white">{stats.totalClicks.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">CTR:</span>
              <span className="font-mono text-[var(--orange)]">{stats.overallCTR.toFixed(2)}%</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-2 py-1 bg-[var(--orange)] text-white text-xs font-semibold rounded hover:bg-[var(--orange)]/80 transition-colors"
        >
          + NEW
        </button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-1.5">
        {/* Campaigns List */}
        <div className="col-span-2 bg-[var(--dark-gray)] rounded flex flex-col overflow-hidden">
          <div className="px-2 py-1.5 border-b border-white/10">
            <h2 className="font-semibold text-white text-xs uppercase tracking-wide">Campaigns</h2>
          </div>
          <div className="flex-1 overflow-auto p-1.5 space-y-1">
            {campaigns.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/30 text-xs">No campaigns yet</p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => setSelectedCampaign(campaign)}
                  className={cn(
                    "p-2 bg-[var(--black)] cursor-pointer transition-colors rounded border",
                    selectedCampaign?.id === campaign.id
                      ? "border-[var(--orange)]"
                      : "border-transparent hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white text-xs">{campaign.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(campaign.status))} />
                      <span className="text-[10px] text-white/50">{campaign.status}</span>
                    </div>
                  </div>
                  <p className="text-white/40 text-[10px] mb-1.5">
                    {campaign.startDate || "No start"} - {campaign.endDate || "No end"}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <span className="text-white/30">Impr:</span>
                      <span className="text-white ml-1 font-mono">{(campaign.impressions / 1000).toFixed(1)}K</span>
                    </div>
                    <div>
                      <span className="text-white/30">Clicks:</span>
                      <span className="text-white ml-1 font-mono">{campaign.clicks}</span>
                    </div>
                    <div>
                      <span className="text-white/30">CTR:</span>
                      <span className="text-[var(--orange)] ml-1 font-mono">{campaign.ctr.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details / Slots Panel */}
        <div className="bg-[var(--dark-gray)] rounded flex flex-col overflow-hidden">
          {selectedCampaign ? (
            <>
              <div className="px-2 py-1.5 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-semibold text-white text-xs uppercase tracking-wide">Details</h2>
                <button onClick={() => setSelectedCampaign(null)} className="text-white/40 hover:text-white text-xs">x</button>
              </div>
              <div className="flex-1 overflow-auto p-2 space-y-2">
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Name</p>
                  <p className="text-white text-xs">{selectedCampaign.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-white/40 uppercase">Status</p>
                    <select
                      className="w-full bg-[var(--black)] border border-white/10 text-white text-[10px] px-1.5 py-1 rounded"
                      defaultValue={selectedCampaign.status}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PAUSED">Paused</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ENDED">Ended</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase">Placements</p>
                    <p className="text-white text-xs">{selectedCampaign.placements.length}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase mb-1">Ad Slots</p>
                  <div className="space-y-1">
                    {selectedCampaign.placements.map((placement) => (
                      <div key={placement.id} className="bg-[var(--black)] p-1.5 rounded">
                        <p className="text-[var(--orange)] text-[10px] font-semibold">{slotLabels[placement.slot] || placement.slot}</p>
                        <div className="flex justify-between text-[9px] text-white/40 mt-0.5">
                          <span>{(placement.impressions / 1000).toFixed(1)}K imp</span>
                          <span>{placement.clicks} clicks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 pt-2">
                  <button className="flex-1 px-2 py-1 bg-[var(--orange)] text-white text-[10px] rounded">Edit</button>
                  <button className="flex-1 px-2 py-1 bg-white/10 text-white text-[10px] rounded">Duplicate</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="px-2 py-1.5 border-b border-white/10">
                <h2 className="font-semibold text-white text-xs uppercase tracking-wide">Ad Slots</h2>
              </div>
              <div className="flex-1 overflow-auto p-1.5 space-y-0.5">
                {Object.entries(slotLabels).map(([slot, label]) => (
                  <div key={slot} className="bg-[var(--black)] p-1.5 rounded flex items-center justify-between">
                    <span className="text-white text-[10px]">{label}</span>
                    <span className="text-[var(--orange)] text-[9px]">Available</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--dark-gray)] border border-[var(--orange)] rounded p-3 w-full max-w-md">
            <h2 className="font-[family-name:var(--font-anton)] text-sm tracking-wider text-white mb-3">
              CREATE CAMPAIGN
            </h2>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-white/50 block mb-0.5">Campaign Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded"
                  placeholder="Enter name"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-white/50 block mb-0.5">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-0.5">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-white/50 block mb-0.5">Ad Slot</label>
                <select
                  value={formData.slot}
                  onChange={(e) => setFormData({ ...formData, slot: e.target.value as AdSlot })}
                  className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded"
                >
                  {Object.entries(slotLabels).map(([slot, label]) => (
                    <option key={slot} value={slot}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/50 block mb-0.5">Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-[10px] text-white/50 block mb-0.5">Link URL</label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 px-3 py-1.5 bg-[var(--orange)] text-white text-xs font-semibold rounded"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 bg-white/10 text-white text-xs rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
