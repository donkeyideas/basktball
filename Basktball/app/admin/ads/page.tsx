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
  const [isProcessing, setIsProcessing] = useState(false);
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

  const getStatusClass = (status: AdStatus) => {
    switch (status) {
      case "ACTIVE": return "job-status success";
      case "PAUSED": return "job-status paused";
      case "DRAFT": return "job-status";
      case "ENDED": return "job-status failed";
    }
  };

  const handleCreate = async () => {
    setIsProcessing(true);
    try {
      await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      await mutate("/api/admin/ads");
      setIsCreating(false);
      setFormData({ name: "", startDate: "", endDate: "", slot: "HEADER_BANNER", imageUrl: "", linkUrl: "" });
    } catch (error) {
      console.error("Create campaign error:", error);
    }
    setIsProcessing(false);
  };

  const handleStatusChange = async (campaignId: string, newStatus: AdStatus) => {
    setIsProcessing(true);
    try {
      await fetch(`/api/admin/ads/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await mutate("/api/admin/ads");
    } catch (error) {
      console.error("Update status error:", error);
    }
    setIsProcessing(false);
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    setIsProcessing(true);
    try {
      await fetch(`/api/admin/ads/${campaignId}`, { method: "DELETE" });
      await mutate("/api/admin/ads");
      if (selectedCampaign?.id === campaignId) setSelectedCampaign(null);
    } catch (error) {
      console.error("Delete campaign error:", error);
    }
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-40 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card p-4 animate-pulse">
              <div className="h-8 w-20 bg-white/10 rounded mb-2" />
              <div className="h-4 w-24 bg-white/10 rounded" />
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 section">
            <div className="section-header">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-white/10 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="section">
            <div className="section-header">
              <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-12 bg-white/10 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
          AD MANAGEMENT
        </h1>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="stat-card p-4">
          <p className="stat-value text-2xl">{stats.activeCampaigns}</p>
          <p className="stat-label">Active Campaigns</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl">{(stats.totalImpressions / 1000).toFixed(1)}K</p>
          <p className="stat-label">Total Impressions</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl">{stats.totalClicks.toLocaleString()}</p>
          <p className="stat-label">Total Clicks</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl text-[var(--orange)]">{stats.overallCTR.toFixed(2)}%</p>
          <p className="stat-label">Overall CTR</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Campaigns Table */}
        <div className="col-span-2 section">
          <div className="section-header">
            <h2 className="section-title">Campaigns</h2>
            <span className="text-sm text-white/40">{campaigns.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-white/30">
                      No campaigns yet
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className={cn(
                        "cursor-pointer",
                        selectedCampaign?.id === campaign.id && "bg-[var(--orange)]/5"
                      )}
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <td>
                        <p className="text-white font-medium">{campaign.name}</p>
                        <p className="text-white/40 text-xs">{campaign.placements.length} placements</p>
                      </td>
                      <td>
                        <span className={getStatusClass(campaign.status)}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="text-white/60 text-sm">
                        {campaign.startDate || "N/A"} - {campaign.endDate || "N/A"}
                      </td>
                      <td className="font-[family-name:var(--font-roboto-mono)] text-white">
                        {(campaign.impressions / 1000).toFixed(1)}K
                      </td>
                      <td className="font-[family-name:var(--font-roboto-mono)] text-white">
                        {campaign.clicks.toLocaleString()}
                      </td>
                      <td className="font-[family-name:var(--font-roboto-mono)] text-[var(--orange)]">
                        {campaign.ctr.toFixed(2)}%
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(
                                campaign.id,
                                campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE"
                              );
                            }}
                            disabled={isProcessing}
                            className={campaign.status === "ACTIVE" ? "btn-pause" : "btn-run"}
                          >
                            {campaign.status === "ACTIVE" ? "Pause" : "Activate"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(campaign.id);
                            }}
                            disabled={isProcessing}
                            className="btn-delete"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details / Slots Panel */}
        <div className="section">
          {selectedCampaign ? (
            <>
              <div className="section-header">
                <h2 className="section-title">Campaign Details</h2>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Campaign Name</label>
                  <p className="text-white font-medium">{selectedCampaign.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Status</label>
                    <select
                      className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-3 py-2 rounded"
                      value={selectedCampaign.status}
                      onChange={(e) => handleStatusChange(selectedCampaign.id, e.target.value as AdStatus)}
                      disabled={isProcessing}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PAUSED">Paused</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ENDED">Ended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Placements</label>
                    <p className="text-white font-medium text-lg">{selectedCampaign.placements.length}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Ad Placements</label>
                  <div className="space-y-2">
                    {selectedCampaign.placements.length === 0 ? (
                      <p className="text-white/30 text-sm">No placements configured</p>
                    ) : (
                      selectedCampaign.placements.map((placement) => (
                        <div key={placement.id} className="bg-[var(--darker-gray)] p-3 rounded">
                          <p className="text-[var(--orange)] font-medium text-sm">
                            {slotLabels[placement.slot] || placement.slot}
                          </p>
                          <div className="flex justify-between text-xs text-white/40 mt-1">
                            <span>{(placement.impressions / 1000).toFixed(1)}K impressions</span>
                            <span>{placement.clicks} clicks</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button className="btn btn-primary flex-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button className="btn btn-secondary flex-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Duplicate
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="section-header">
                <h2 className="section-title">Available Ad Slots</h2>
              </div>
              <div className="p-4 space-y-2">
                {Object.entries(slotLabels).map(([slot, label]) => (
                  <div key={slot} className="bg-[var(--darker-gray)] p-3 rounded flex items-center justify-between">
                    <span className="text-white text-sm">{label}</span>
                    <span className="text-[var(--green)] text-xs font-medium">Available</span>
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
          <div className="bg-[var(--dark-gray)] border-2 border-[var(--orange)] rounded-lg p-6 w-full max-w-lg">
            <h2 className="font-[family-name:var(--font-anton)] text-2xl tracking-wider text-white mb-6">
              CREATE CAMPAIGN
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-4 py-3 rounded focus:border-[var(--orange)] outline-none"
                  placeholder="Enter campaign name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-4 py-3 rounded focus:border-[var(--orange)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-4 py-3 rounded focus:border-[var(--orange)] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Ad Slot</label>
                <select
                  value={formData.slot}
                  onChange={(e) => setFormData({ ...formData, slot: e.target.value as AdSlot })}
                  className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-4 py-3 rounded focus:border-[var(--orange)] outline-none"
                >
                  {Object.entries(slotLabels).map(([slot, label]) => (
                    <option key={slot} value={slot}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-4 py-3 rounded focus:border-[var(--orange)] outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Link URL</label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-4 py-3 rounded focus:border-[var(--orange)] outline-none"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreate}
                  disabled={isProcessing || !formData.name}
                  className="btn btn-primary flex-1"
                >
                  {isProcessing ? "Creating..." : "Create Campaign"}
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="btn btn-secondary"
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
