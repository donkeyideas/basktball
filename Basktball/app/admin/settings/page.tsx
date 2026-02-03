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
    ballDontLieEnabled: boolean;
    espnFallbackEnabled: boolean;
    cacheEnabled: boolean;
    cacheTtl: number;
  };
  ai: {
    deepSeekEnabled: boolean;
    autoApproveThreshold: number;
    maxTokensPerRequest: number;
    dailyTokenLimit: number;
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
    ballDontLieEnabled: true,
    espnFallbackEnabled: true,
    cacheEnabled: true,
    cacheTtl: 30,
  },
  ai: {
    deepSeekEnabled: true,
    autoApproveThreshold: 80,
    maxTokensPerRequest: 500,
    dailyTokenLimit: 100000,
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
        setSavedMessage("Saved!");
        mutate("/api/admin/settings");
      } else {
        setSavedMessage("Failed");
      }
    } catch {
      setSavedMessage("Error");
    }
    setIsSaving(false);
    setTimeout(() => setSavedMessage(""), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-1.5 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--dark-gray)] p-2 rounded animate-pulse">
              <div className="h-4 w-16 bg-white/10 rounded mb-2" />
              <div className="space-y-2">
                <div className="h-7 bg-white/10 rounded" />
                <div className="h-7 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-[family-name:var(--font-anton)] text-xl tracking-wider text-white">
          SETTINGS
        </h1>
        <div className="flex items-center gap-2">
          {savedMessage && (
            <span className={cn(
              "text-xs",
              savedMessage === "Saved!" ? "text-green-400" : "text-red-400"
            )}>
              {savedMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1 bg-[var(--orange)] text-white text-xs font-semibold rounded hover:bg-[var(--orange)]/80 transition-colors disabled:opacity-50"
          >
            {isSaving ? "..." : "SAVE"}
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0 overflow-auto">
        {/* General Settings */}
        <div className="bg-[var(--dark-gray)] p-2 rounded">
          <h2 className="font-semibold text-white text-xs mb-2 uppercase tracking-wide">General</h2>
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] text-white/50 mb-0.5">Site Name</label>
              <input
                type="text"
                value={settings.general.siteName}
                onChange={(e) => updateSetting("general", "siteName", e.target.value)}
                className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded focus:border-[var(--orange)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-0.5">Description</label>
              <input
                type="text"
                value={settings.general.siteDescription}
                onChange={(e) => updateSetting("general", "siteDescription", e.target.value)}
                className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded focus:border-[var(--orange)] outline-none"
              />
            </div>
            <label className="flex items-center justify-between p-1.5 bg-[var(--black)] rounded cursor-pointer">
              <span className="text-white text-xs">Maintenance Mode</span>
              <input
                type="checkbox"
                checked={settings.general.maintenanceMode}
                onChange={(e) => updateSetting("general", "maintenanceMode", e.target.checked)}
                className="accent-[var(--orange)] w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-[var(--dark-gray)] p-2 rounded">
          <h2 className="font-semibold text-white text-xs mb-2 uppercase tracking-wide">API Config</h2>
          <div className="space-y-1.5">
            <label className="flex items-center justify-between p-1.5 bg-[var(--black)] rounded cursor-pointer">
              <span className="text-white text-xs">BallDontLie API</span>
              <input
                type="checkbox"
                checked={settings.api.ballDontLieEnabled}
                onChange={(e) => updateSetting("api", "ballDontLieEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between p-1.5 bg-[var(--black)] rounded cursor-pointer">
              <span className="text-white text-xs">ESPN Fallback</span>
              <input
                type="checkbox"
                checked={settings.api.espnFallbackEnabled}
                onChange={(e) => updateSetting("api", "espnFallbackEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between p-1.5 bg-[var(--black)] rounded cursor-pointer">
              <span className="text-white text-xs">Response Cache</span>
              <input
                type="checkbox"
                checked={settings.api.cacheEnabled}
                onChange={(e) => updateSetting("api", "cacheEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-4 h-4"
              />
            </label>
            <div>
              <label className="block text-[10px] text-white/50 mb-0.5">Cache TTL (sec)</label>
              <input
                type="number"
                value={settings.api.cacheTtl}
                onChange={(e) => updateSetting("api", "cacheTtl", parseInt(e.target.value))}
                className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded focus:border-[var(--orange)] outline-none"
              />
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-[var(--dark-gray)] p-2 rounded">
          <h2 className="font-semibold text-white text-xs mb-2 uppercase tracking-wide">AI Config</h2>
          <div className="space-y-1.5">
            <label className="flex items-center justify-between p-1.5 bg-[var(--black)] rounded cursor-pointer">
              <span className="text-white text-xs">DeepSeek AI</span>
              <input
                type="checkbox"
                checked={settings.ai.deepSeekEnabled}
                onChange={(e) => updateSetting("ai", "deepSeekEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-4 h-4"
              />
            </label>
            <div>
              <label className="block text-[10px] text-white/50 mb-0.5">Auto-Approve Threshold (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.ai.autoApproveThreshold}
                onChange={(e) => updateSetting("ai", "autoApproveThreshold", parseInt(e.target.value))}
                className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded focus:border-[var(--orange)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-0.5">Max Tokens/Request</label>
              <input
                type="number"
                value={settings.ai.maxTokensPerRequest}
                onChange={(e) => updateSetting("ai", "maxTokensPerRequest", parseInt(e.target.value))}
                className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded focus:border-[var(--orange)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 mb-0.5">Daily Token Limit</label>
              <input
                type="number"
                value={settings.ai.dailyTokenLimit}
                onChange={(e) => updateSetting("ai", "dailyTokenLimit", parseInt(e.target.value))}
                className="w-full bg-[var(--black)] border border-white/10 text-white text-xs px-2 py-1.5 rounded focus:border-[var(--orange)] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-[var(--dark-gray)] p-2 rounded">
          <h2 className="font-semibold text-white text-xs mb-2 uppercase tracking-wide">Features</h2>
          <div className="space-y-1.5">
            <label className="flex items-center justify-between p-1.5 bg-[var(--black)] rounded cursor-pointer">
              <span className="text-white text-xs">Live Scores</span>
              <input
                type="checkbox"
                checked={settings.features.liveScoresEnabled}
                onChange={(e) => updateSetting("features", "liveScoresEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between p-1.5 bg-[var(--black)] rounded cursor-pointer">
              <span className="text-white text-xs">AI Insights</span>
              <input
                type="checkbox"
                checked={settings.features.aiInsightsEnabled}
                onChange={(e) => updateSetting("features", "aiInsightsEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between p-1.5 bg-[var(--black)] rounded cursor-pointer">
              <span className="text-white text-xs">Betting Insights</span>
              <input
                type="checkbox"
                checked={settings.features.bettingInsightsEnabled}
                onChange={(e) => updateSetting("features", "bettingInsightsEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between p-1.5 bg-[var(--black)] rounded cursor-pointer">
              <span className="text-white text-xs">Fantasy Tools</span>
              <input
                type="checkbox"
                checked={settings.features.fantasyToolsEnabled}
                onChange={(e) => updateSetting("features", "fantasyToolsEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-4 h-4"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-2 bg-[var(--dark-gray)] border border-red-500/20 p-2 rounded">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-red-400 text-xs font-semibold">Clear All Cache</span>
            <p className="text-[10px] text-white/40">Remove all cached data</p>
          </div>
          <button className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] rounded hover:bg-red-500/30 transition-colors">
            CLEAR
          </button>
        </div>
      </div>
    </div>
  );
}
