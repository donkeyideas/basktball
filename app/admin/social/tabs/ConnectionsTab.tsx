"use client";

import { useState, useEffect } from "react";

const PLATFORMS = [
  {
    id: "TWITTER",
    label: "Twitter / X",
    fields: [
      { key: "API_KEY", label: "API Key" },
      { key: "API_SECRET", label: "API Secret" },
      { key: "ACCESS_TOKEN", label: "Access Token" },
      { key: "ACCESS_SECRET", label: "Access Secret" },
    ],
    guide:
      "1. Go to developer.twitter.com and create a project + app.\n2. Enable OAuth 1.0a with Read and Write permissions.\n3. Generate API Key, API Secret, Access Token, and Access Secret.\n4. Paste all four credentials above.",
  },
  {
    id: "LINKEDIN",
    label: "LinkedIn",
    fields: [
      { key: "ACCESS_TOKEN", label: "Access Token" },
      { key: "PERSON_ID", label: "Person URN ID" },
    ],
    guide:
      "1. Create a LinkedIn app at linkedin.com/developers.\n2. Request the w_member_social permission.\n3. Generate an Access Token (valid 60 days).\n4. Find your Person URN ID from the /me endpoint.",
  },
  {
    id: "FACEBOOK",
    label: "Facebook",
    fields: [
      { key: "PAGE_ACCESS_TOKEN", label: "Page Access Token" },
      { key: "PAGE_ID", label: "Page ID" },
    ],
    guide:
      "1. Create a Facebook App at developers.facebook.com.\n2. Add the Pages product and request pages_manage_posts permission.\n3. Generate a Page Access Token.\n4. Find your Page ID from the page's About section.",
  },
  {
    id: "INSTAGRAM",
    label: "Instagram",
    fields: [
      { key: "ACCESS_TOKEN", label: "Access Token" },
      { key: "ACCOUNT_ID", label: "Business Account ID" },
    ],
    guide:
      "1. Connect your Instagram Business account to a Facebook Page.\n2. Create a Facebook App and add Instagram Graph API.\n3. Generate an Access Token with instagram_content_publish permission.\nNote: Publishing requires image/video media.",
  },
  {
    id: "TIKTOK",
    label: "TikTok",
    fields: [
      { key: "ACCESS_TOKEN", label: "Access Token" },
      { key: "OPEN_ID", label: "Open ID" },
    ],
    guide:
      "1. Register as a TikTok developer at developers.tiktok.com.\n2. Create an app and request video.publish scope.\nNote: TikTok API only supports video publishing.",
  },
];

interface PlatformState {
  credentials: Record<string, string>;
  isSaving: boolean;
  isTesting: boolean;
  testResult: { success: boolean; message: string } | null;
  showGuide: boolean;
}

export default function ConnectionsTab() {
  const [platforms, setPlatforms] = useState<Record<string, PlatformState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    (async () => {
      // Initialize state
      const initial: Record<string, PlatformState> = {};
      PLATFORMS.forEach((p) => {
        initial[p.id] = {
          credentials: Object.fromEntries(p.fields.map((f) => [f.key, ""])),
          isSaving: false,
          isTesting: false,
          testResult: null,
          showGuide: false,
        };
      });

      try {
        const res = await fetch("/api/admin/social/credentials");
        const data = await res.json();
        if (data.success && data.credentials) {
          // Fill in masked values from server
          for (const [platform, creds] of Object.entries(data.credentials) as [string, Record<string, string>][]) {
            if (initial[platform]) {
              for (const [field, value] of Object.entries(creds)) {
                initial[platform].credentials[field] = value;
              }
            }
          }
        }
      } catch {
        // silent
      }

      setPlatforms(initial);
      setIsLoading(false);
    })();
  }, []);

  function updateCredential(platformId: string, field: string, value: string) {
    setPlatforms((prev) => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        credentials: { ...prev[platformId].credentials, [field]: value },
      },
    }));
  }

  function updatePlatform(platformId: string, partial: Partial<PlatformState>) {
    setPlatforms((prev) => ({
      ...prev,
      [platformId]: { ...prev[platformId], ...partial },
    }));
  }

  async function handleSave(platformId: string) {
    updatePlatform(platformId, { isSaving: true });
    setMessage(null);
    try {
      const res = await fetch("/api/admin/social/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platformId,
          credentials: platforms[platformId].credentials,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `${platformId} credentials saved!`, type: "success" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: data.error || "Failed to save", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to save credentials", type: "error" });
    } finally {
      updatePlatform(platformId, { isSaving: false });
    }
  }

  async function handleTest(platformId: string) {
    updatePlatform(platformId, { isTesting: true, testResult: null });
    try {
      const res = await fetch("/api/admin/social/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platformId }),
      });
      const data = await res.json();
      updatePlatform(platformId, {
        isTesting: false,
        testResult: { success: data.success, message: data.message || data.error || "" },
      });
    } catch {
      updatePlatform(platformId, {
        isTesting: false,
        testResult: { success: false, message: "Connection test failed" },
      });
    }
  }

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)" }}>Loading...</div>;
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

      {PLATFORMS.map((platform) => {
        const state = platforms[platform.id];
        if (!state) return null;

        return (
          <div key={platform.id} className="section" style={{ marginBottom: "24px" }}>
            <h3 className="section-title">{platform.label.toUpperCase()}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {platform.fields.map((field) => (
                <div key={field.key} className="form-group">
                  <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
                    {field.label}
                  </label>
                  <input
                    type="password"
                    value={state.credentials[field.key] || ""}
                    onChange={(e) => updateCredential(platform.id, field.key, e.target.value)}
                    placeholder={`Enter ${field.label}`}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Test result */}
            {state.testResult && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  background: state.testResult.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${state.testResult.success ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  color: state.testResult.success ? "var(--green)" : "var(--red)",
                }}
              >
                {state.testResult.message}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", marginTop: "14px", alignItems: "center" }}>
              <button
                className="btn btn-primary"
                onClick={() => handleSave(platform.id)}
                disabled={state.isSaving}
                style={{ fontSize: "12px", padding: "6px 16px" }}
              >
                {state.isSaving ? "Saving..." : "Save"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleTest(platform.id)}
                disabled={state.isTesting}
                style={{ fontSize: "12px", padding: "6px 16px" }}
              >
                {state.isTesting ? "Testing..." : "Test Connection"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => updatePlatform(platform.id, { showGuide: !state.showGuide })}
                style={{ fontSize: "12px", padding: "6px 16px" }}
              >
                {state.showGuide ? "Hide Guide" : "Setup Guide"}
              </button>
            </div>

            {/* Setup guide */}
            {state.showGuide && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "14px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}
              >
                {platform.guide}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
