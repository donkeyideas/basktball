"use client";

import { useState, useEffect } from "react";

interface Settings {
  deepseekApiKey?: string;
  nbaApiUserAgent?: string;
  cacheDuration?: number;
  autoGenerateInsights?: boolean;
  autoGenerateRecaps?: boolean;
  autoGenerateSpotlights?: boolean;
  requireManualApproval?: boolean;
  maintenanceMode?: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings || {});
        setError(null);
      } else {
        setError(data.error || "Failed to load settings");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Settings saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to save settings");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="admin-header">
        <h1>SETTINGS</h1>
      </div>

      <div className="admin-content">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={saveSettings} className="settings-form">
            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--red)",
                color: "var(--red)",
                padding: "15px",
                marginBottom: "20px"
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid var(--green)",
                color: "var(--green)",
                padding: "15px",
                marginBottom: "20px"
              }}>
                {success}
              </div>
            )}

            {/* API Configuration */}
            <div className="section">
              <div className="section-title">API Configuration</div>

              <div className="form-group">
                <label htmlFor="deepseekApiKey">DeepSeek API Key</label>
                <input
                  id="deepseekApiKey"
                  type="password"
                  value={settings.deepseekApiKey || ""}
                  onChange={(e) => setSettings({ ...settings, deepseekApiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="nbaApiUserAgent">NBA Stats API User Agent</label>
                <input
                  id="nbaApiUserAgent"
                  type="text"
                  value={settings.nbaApiUserAgent || ""}
                  onChange={(e) => setSettings({ ...settings, nbaApiUserAgent: e.target.value })}
                  placeholder="MyApp/1.0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cacheDuration">Cache Duration (seconds)</label>
                <input
                  id="cacheDuration"
                  type="number"
                  value={settings.cacheDuration || 300}
                  onChange={(e) => setSettings({ ...settings, cacheDuration: parseInt(e.target.value) })}
                  min={60}
                  max={86400}
                />
              </div>
            </div>

            {/* Content Generation */}
            <div className="section">
              <div className="section-title">Content Generation</div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.autoGenerateInsights || false}
                    onChange={(e) => setSettings({ ...settings, autoGenerateInsights: e.target.checked })}
                  />
                  Auto-generate game insights
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={settings.autoGenerateRecaps || false}
                    onChange={(e) => setSettings({ ...settings, autoGenerateRecaps: e.target.checked })}
                  />
                  Auto-generate game recaps
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={settings.autoGenerateSpotlights || false}
                    onChange={(e) => setSettings({ ...settings, autoGenerateSpotlights: e.target.checked })}
                  />
                  Auto-generate player spotlights
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={settings.requireManualApproval || false}
                    onChange={(e) => setSettings({ ...settings, requireManualApproval: e.target.checked })}
                  />
                  Require manual approval for AI content
                </label>
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="section">
              <div className="section-title">Maintenance Mode</div>

              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode || false}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                />
                <label htmlFor="maintenanceMode" className="toggle-slider"></label>
                <span style={{ marginLeft: "10px" }}>
                  {settings.maintenanceMode ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: "10px" }}>
                When enabled, the public site will display a maintenance message.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{ marginTop: "20px" }}
            >
              {isSaving ? "SAVING..." : "SAVE SETTINGS"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
