"use client";

import { useState, useEffect } from "react";

const PLATFORMS = [
  { id: "TWITTER", label: "Twitter / X" },
  { id: "LINKEDIN", label: "LinkedIn" },
  { id: "FACEBOOK", label: "Facebook" },
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "TIKTOK", label: "TikTok" },
] as const;

interface AutomationConfig {
  enabled: boolean;
  platforms: string[];
  hour: number;
  topics: string[];
  includeDebates: boolean;
  requireApproval: boolean;
}

export default function AutomationTab() {
  const [config, setConfig] = useState<AutomationConfig>({
    enabled: false,
    platforms: [],
    hour: 14,
    topics: [],
    includeDebates: false,
    requireApproval: true,
  });
  const [topicsText, setTopicsText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/social/automation");
        const data = await res.json();
        if (data.success) {
          setConfig(data.config);
          setTopicsText(data.config.topics.join("\n"));
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function togglePlatform(id: string) {
    setConfig((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(id)
        ? prev.platforms.filter((p) => p !== id)
        : [...prev.platforms, id],
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);
    try {
      const topics = topicsText
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/social/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, topics }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Automation settings saved!", type: "success" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: data.error || "Failed to save", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to connect to server", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div>
      {message && (
        <div
          style={{
            background: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: message.type === "success" ? "var(--green)" : "var(--red)",
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          {message.text}
        </div>
      )}

      {/* Enable/Disable */}
      <div className="section">
        <h3 className="section-title">DAILY AUTO-GENERATION</h3>
        <label className="checkbox-group" style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
          <div
            className="toggle-switch"
            style={{
              width: "44px",
              height: "24px",
              borderRadius: "12px",
              background: config.enabled ? "var(--orange)" : "var(--border-color)",
              position: "relative",
              transition: "background 0.2s",
              cursor: "pointer",
            }}
            onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "white",
                position: "absolute",
                top: "3px",
                left: config.enabled ? "23px" : "3px",
                transition: "left 0.2s",
              }}
            />
          </div>
          <span style={{ color: "var(--text-secondary)" }}>
            {config.enabled ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>

      {/* Platforms */}
      <div className="section" style={{ marginTop: "20px" }}>
        <h3 className="section-title">PLATFORMS</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {PLATFORMS.map((p) => (
            <label
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: config.platforms.includes(p.id) ? "rgba(255,107,53,0.1)" : "var(--border-subtle)",
                border: `1px solid ${config.platforms.includes(p.id) ? "rgba(255,107,53,0.3)" : "var(--border-color)"}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                color: config.platforms.includes(p.id) ? "var(--orange)" : "var(--text-secondary)",
              }}
            >
              <input
                type="checkbox"
                checked={config.platforms.includes(p.id)}
                onChange={() => togglePlatform(p.id)}
                style={{ accentColor: "var(--orange)" }}
              />
              {p.label}
            </label>
          ))}
        </div>
      </div>

      {/* UTC Hour */}
      <div className="section" style={{ marginTop: "20px" }}>
        <h3 className="section-title">GENERATION HOUR (UTC)</h3>
        <select
          value={config.hour}
          onChange={(e) => setConfig((prev) => ({ ...prev, hour: parseInt(e.target.value, 10) }))}
          style={{
            padding: "8px 14px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            color: "var(--white)",
            fontSize: "13px",
          }}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {String(i).padStart(2, "0")}:00 UTC
            </option>
          ))}
        </select>
      </div>

      {/* Topic Pool */}
      <div className="section" style={{ marginTop: "20px" }}>
        <h3 className="section-title">TOPIC ROTATION POOL</h3>
        <p style={{ fontSize: "12px", color: "var(--text-faint)", marginBottom: "8px" }}>
          One topic per line. The system rotates through these daily.
        </p>
        <textarea
          value={topicsText}
          onChange={(e) => setTopicsText(e.target.value)}
          rows={6}
          placeholder={"NBA trade rumors\nPlayer performance analysis\nUpcoming game previews\nHistoric NBA moments"}
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--white)",
            fontSize: "13px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Options */}
      <div className="section" style={{ marginTop: "20px" }}>
        <h3 className="section-title">OPTIONS</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
            <input
              type="checkbox"
              checked={config.includeDebates}
              onChange={(e) => setConfig((prev) => ({ ...prev, includeDebates: e.target.checked }))}
              style={{ accentColor: "var(--orange)" }}
            />
            Include basketball debate topics
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
            <input
              type="checkbox"
              checked={config.requireApproval}
              onChange={(e) => setConfig((prev) => ({ ...prev, requireApproval: e.target.checked }))}
              style={{ accentColor: "var(--orange)" }}
            />
            Require manual approval before publishing
          </label>
        </div>
      </div>

      {/* Save */}
      <div style={{ marginTop: "24px" }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving} style={{ minWidth: "160px" }}>
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
