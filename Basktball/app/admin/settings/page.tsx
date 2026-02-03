"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

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
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSavedMessage("Settings saved successfully!");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-[family-name:var(--font-anton)] text-2xl tracking-wider text-white">
            SETTINGS
          </h1>
          <p className="text-white/50 text-xs">
            Configure system settings and feature flags
          </p>
        </div>
        <div className="flex items-center gap-4">
          {savedMessage && (
            <span className="text-green-400 text-sm">{savedMessage}</span>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={isSaving}
          >
            SAVE CHANGES
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* General Settings */}
        <Card variant="default" className="p-3">
          <h2 className="font-semibold text-white text-sm mb-3">General</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-white/60 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.general.siteName}
                onChange={(e) => updateSetting("general", "siteName", e.target.value)}
                className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2 focus:border-[var(--orange)] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Site Description</label>
              <input
                type="text"
                value={settings.general.siteDescription}
                onChange={(e) => updateSetting("general", "siteDescription", e.target.value)}
                className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2 focus:border-[var(--orange)] outline-none"
              />
            </div>
            <label className="flex items-center justify-between p-3 bg-[var(--black)] cursor-pointer">
              <div>
                <span className="text-white">Maintenance Mode</span>
                <p className="text-xs text-white/50">Disable public access temporarily</p>
              </div>
              <input
                type="checkbox"
                checked={settings.general.maintenanceMode}
                onChange={(e) => updateSetting("general", "maintenanceMode", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
          </div>
        </Card>

        {/* API Settings */}
        <Card variant="default" className="p-3">
          <h2 className="font-semibold text-white text-sm mb-3">API Configuration</h2>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 bg-[var(--black)] cursor-pointer">
              <div>
                <span className="text-white">BallDontLie API</span>
                <p className="text-xs text-white/50">Primary NBA data source</p>
              </div>
              <input
                type="checkbox"
                checked={settings.api.ballDontLieEnabled}
                onChange={(e) => updateSetting("api", "ballDontLieEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--black)] cursor-pointer">
              <div>
                <span className="text-white">ESPN Fallback</span>
                <p className="text-xs text-white/50">Use ESPN when primary fails</p>
              </div>
              <input
                type="checkbox"
                checked={settings.api.espnFallbackEnabled}
                onChange={(e) => updateSetting("api", "espnFallbackEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--black)] cursor-pointer">
              <div>
                <span className="text-white">Response Caching</span>
                <p className="text-xs text-white/50">Cache API responses</p>
              </div>
              <input
                type="checkbox"
                checked={settings.api.cacheEnabled}
                onChange={(e) => updateSetting("api", "cacheEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <div>
              <label className="block text-sm text-white/60 mb-2">Cache TTL (seconds)</label>
              <input
                type="number"
                value={settings.api.cacheTtl}
                onChange={(e) => updateSetting("api", "cacheTtl", parseInt(e.target.value))}
                className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2 focus:border-[var(--orange)] outline-none"
              />
            </div>
          </div>
        </Card>

        {/* AI Settings */}
        <Card variant="default" className="p-3">
          <h2 className="font-semibold text-white text-sm mb-3">AI Configuration</h2>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 bg-[var(--black)] cursor-pointer">
              <div>
                <span className="text-white">DeepSeek AI</span>
                <p className="text-xs text-white/50">Enable AI content generation</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ai.deepSeekEnabled}
                onChange={(e) => updateSetting("ai", "deepSeekEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Auto-Approve Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.ai.autoApproveThreshold}
                onChange={(e) => updateSetting("ai", "autoApproveThreshold", parseInt(e.target.value))}
                className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2 focus:border-[var(--orange)] outline-none"
              />
              <p className="text-xs text-white/40 mt-1">
                Content above this confidence level is auto-approved
              </p>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Max Tokens Per Request</label>
              <input
                type="number"
                value={settings.ai.maxTokensPerRequest}
                onChange={(e) => updateSetting("ai", "maxTokensPerRequest", parseInt(e.target.value))}
                className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2 focus:border-[var(--orange)] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Daily Token Limit</label>
              <input
                type="number"
                value={settings.ai.dailyTokenLimit}
                onChange={(e) => updateSetting("ai", "dailyTokenLimit", parseInt(e.target.value))}
                className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-4 py-2 focus:border-[var(--orange)] outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Feature Flags */}
        <Card variant="default" className="p-3">
          <h2 className="font-semibold text-white text-sm mb-3">Feature Flags</h2>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 bg-[var(--black)] cursor-pointer">
              <div>
                <span className="text-white">Live Scores</span>
                <p className="text-xs text-white/50">Real-time game updates</p>
              </div>
              <input
                type="checkbox"
                checked={settings.features.liveScoresEnabled}
                onChange={(e) => updateSetting("features", "liveScoresEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--black)] cursor-pointer">
              <div>
                <span className="text-white">AI Insights</span>
                <p className="text-xs text-white/50">AI-generated content</p>
              </div>
              <input
                type="checkbox"
                checked={settings.features.aiInsightsEnabled}
                onChange={(e) => updateSetting("features", "aiInsightsEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--black)] cursor-pointer">
              <div>
                <span className="text-white">Betting Insights</span>
                <p className="text-xs text-white/50">Betting analysis features</p>
              </div>
              <input
                type="checkbox"
                checked={settings.features.bettingInsightsEnabled}
                onChange={(e) => updateSetting("features", "bettingInsightsEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-[var(--black)] cursor-pointer">
              <div>
                <span className="text-white">Fantasy Tools</span>
                <p className="text-xs text-white/50">Fantasy optimizer features</p>
              </div>
              <input
                type="checkbox"
                checked={settings.features.fantasyToolsEnabled}
                onChange={(e) => updateSetting("features", "fantasyToolsEnabled", e.target.checked)}
                className="accent-[var(--orange)] w-5 h-5"
              />
            </label>
          </div>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card variant="bordered" className="p-3 mt-4 border-red-500/30">
        <h2 className="font-semibold text-red-400 text-sm mb-3">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white">Clear All Cache</p>
            <p className="text-xs text-white/50">Remove all cached data from the system</p>
          </div>
          <Button variant="danger" size="sm">
            CLEAR CACHE
          </Button>
        </div>
      </Card>
    </div>
  );
}
