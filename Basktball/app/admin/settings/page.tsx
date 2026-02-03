"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { cn } from "@/lib/utils";

interface Settings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
  };
  api: {
    deepSeekApiKey: string;
    nbaStatsUserAgent: string;
    cacheDuration: number;
  };
  content: {
    autoGenerateGameRecaps: boolean;
    autoGeneratePlayerAnalysis: boolean;
    autoGenerateBettingInsights: boolean;
    requireManualApproval: boolean;
  };
  features: {
    liveScoresEnabled: boolean;
    aiInsightsEnabled: boolean;
    bettingInsightsEnabled: boolean;
    fantasyToolsEnabled: boolean;
  };
}

interface SettingsData {
  success: boolean;
  settings: Settings;
}

const defaultSettings: Settings = {
  general: {
    siteName: "Basktball",
    siteDescription: "Advanced Basketball Analytics Platform",
    maintenanceMode: false,
  },
  api: {
    deepSeekApiKey: "",
    nbaStatsUserAgent: "",
    cacheDuration: 300,
  },
  content: {
    autoGenerateGameRecaps: true,
    autoGeneratePlayerAnalysis: true,
    autoGenerateBettingInsights: false,
    requireManualApproval: true,
  },
  features: {
    liveScoresEnabled: true,
    aiInsightsEnabled: true,
    bettingInsightsEnabled: true,
    fantasyToolsEnabled: true,
  },
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const { data, isLoading } = useSWR<SettingsData>("/api/admin/settings", fetcher);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings);
    }
  }, [data]);

  const updateSetting = <K extends keyof Settings>(
    category: K,
    key: keyof Settings[K],
    value: Settings[K][keyof Settings[K]]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const result = await response.json();
      if (result.success) {
        setSavedMessage("Settings saved successfully!");
        mutate("/api/admin/settings");
      } else {
        setSavedMessage("Failed to save settings");
      }
    } catch {
      setSavedMessage("Error saving settings");
    }
    setIsSaving(false);
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleClearCache = async () => {
    if (!confirm("Are you sure you want to clear all cache? This action cannot be undone.")) return;
    setIsClearing(true);
    try {
      await fetch("/api/admin/cache", { method: "DELETE" });
      setSavedMessage("Cache cleared successfully!");
    } catch {
      setSavedMessage("Error clearing cache");
    }
    setIsClearing(false);
    setTimeout(() => setSavedMessage(""), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Settings Grid Skeleton */}
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="section">
              <div className="section-header">
                <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-12 bg-white/10 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
          SETTINGS
        </h1>
        <div className="flex items-center gap-4">
          {savedMessage && (
            <span className={cn(
              "text-sm",
              savedMessage.includes("success") ? "text-[var(--green)]" : "text-[var(--red)]"
            )}>
              {savedMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* API Configuration */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">API Configuration</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">DeepSeek API Key</label>
              <input
                type="password"
                value={settings.api.deepSeekApiKey}
                onChange={(e) => updateSetting("api", "deepSeekApiKey", e.target.value)}
                placeholder="sk-..."
                className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-4 py-3 rounded focus:border-[var(--orange)] outline-none"
              />
              <p className="text-white/30 text-xs mt-1">Required for AI content generation</p>
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">NBA Stats API User Agent</label>
              <input
                type="text"
                value={settings.api.nbaStatsUserAgent}
                onChange={(e) => updateSetting("api", "nbaStatsUserAgent", e.target.value)}
                placeholder="Mozilla/5.0..."
                className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-4 py-3 rounded focus:border-[var(--orange)] outline-none"
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Cache Duration (seconds)</label>
              <input
                type="number"
                value={settings.api.cacheDuration}
                onChange={(e) => updateSetting("api", "cacheDuration", parseInt(e.target.value))}
                className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-4 py-3 rounded focus:border-[var(--orange)] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Content Generation Settings */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Content Generation</h2>
          </div>
          <div className="p-4 space-y-3">
            <label className="flex items-center justify-between p-3 bg-[var(--darker-gray)] rounded cursor-pointer hover:bg-white/5 transition-colors">
              <div>
                <span className="text-white text-sm">Auto-generate Game Recaps</span>
                <p className="text-white/40 text-xs">Generate recaps after games complete</p>
              </div>
              <input
                type="checkbox"
                checked={settings.content.autoGenerateGameRecaps}
                onChange={(e) => updateSetting("content", "autoGenerateGameRecaps", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--darker-gray)] rounded cursor-pointer hover:bg-white/5 transition-colors">
              <div>
                <span className="text-white text-sm">Auto-generate Player Analysis</span>
                <p className="text-white/40 text-xs">Generate analysis for standout performances</p>
              </div>
              <input
                type="checkbox"
                checked={settings.content.autoGeneratePlayerAnalysis}
                onChange={(e) => updateSetting("content", "autoGeneratePlayerAnalysis", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--darker-gray)] rounded cursor-pointer hover:bg-white/5 transition-colors">
              <div>
                <span className="text-white text-sm">Auto-generate Betting Insights</span>
                <p className="text-white/40 text-xs">Generate betting-related content</p>
              </div>
              <input
                type="checkbox"
                checked={settings.content.autoGenerateBettingInsights}
                onChange={(e) => updateSetting("content", "autoGenerateBettingInsights", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--darker-gray)] rounded cursor-pointer hover:bg-white/5 transition-colors">
              <div>
                <span className="text-white text-sm">Require Manual Approval</span>
                <p className="text-white/40 text-xs">Content requires admin approval before publishing</p>
              </div>
              <input
                type="checkbox"
                checked={settings.content.requireManualApproval}
                onChange={(e) => updateSetting("content", "requireManualApproval", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
          </div>
        </div>

        {/* General Settings */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">General</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">Site Name</label>
              <input
                type="text"
                value={settings.general.siteName}
                onChange={(e) => updateSetting("general", "siteName", e.target.value)}
                className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-4 py-3 rounded focus:border-[var(--orange)] outline-none"
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Site Description</label>
              <textarea
                value={settings.general.siteDescription}
                onChange={(e) => updateSetting("general", "siteDescription", e.target.value)}
                rows={3}
                className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-4 py-3 rounded focus:border-[var(--orange)] outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Feature Flags</h2>
          </div>
          <div className="p-4 space-y-3">
            <label className="flex items-center justify-between p-3 bg-[var(--darker-gray)] rounded cursor-pointer hover:bg-white/5 transition-colors">
              <span className="text-white text-sm">Live Scores</span>
              <input
                type="checkbox"
                checked={settings.features.liveScoresEnabled}
                onChange={(e) => updateSetting("features", "liveScoresEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--darker-gray)] rounded cursor-pointer hover:bg-white/5 transition-colors">
              <span className="text-white text-sm">AI Insights</span>
              <input
                type="checkbox"
                checked={settings.features.aiInsightsEnabled}
                onChange={(e) => updateSetting("features", "aiInsightsEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--darker-gray)] rounded cursor-pointer hover:bg-white/5 transition-colors">
              <span className="text-white text-sm">Betting Insights</span>
              <input
                type="checkbox"
                checked={settings.features.bettingInsightsEnabled}
                onChange={(e) => updateSetting("features", "bettingInsightsEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--darker-gray)] rounded cursor-pointer hover:bg-white/5 transition-colors">
              <span className="text-white text-sm">Fantasy Tools</span>
              <input
                type="checkbox"
                checked={settings.features.fantasyToolsEnabled}
                onChange={(e) => updateSetting("features", "fantasyToolsEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Maintenance Mode Section */}
      <div className="section mb-8">
        <div className="section-header">
          <h2 className="section-title">Maintenance Mode</h2>
        </div>
        <div className="p-4">
          <label className="flex items-center justify-between p-4 bg-[var(--darker-gray)] rounded cursor-pointer hover:bg-white/5 transition-colors">
            <div>
              <span className="text-white font-medium">Enable Maintenance Mode</span>
              <p className="text-white/40 text-sm mt-1">
                When enabled, the site will display a maintenance page to all visitors except admins.
                Use this when performing major updates or during scheduled downtime.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.general.maintenanceMode}
              onChange={(e) => updateSetting("general", "maintenanceMode", e.target.checked)}
              className="accent-[var(--orange)] w-6 h-6"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="section border-[var(--red)]/30">
        <div className="section-header bg-[var(--red)]/10">
          <h2 className="section-title text-[var(--red)]">Danger Zone</h2>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between p-4 bg-[var(--darker-gray)] rounded border border-[var(--red)]/20">
            <div>
              <span className="text-white font-medium">Clear All Cache</span>
              <p className="text-white/40 text-sm mt-1">
                Remove all cached data. This may temporarily slow down the site.
              </p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={isClearing}
              className="btn-delete px-4 py-2"
            >
              {isClearing ? "Clearing..." : "Clear Cache"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
