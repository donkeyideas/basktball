"use client";

import { useState } from "react";

const PLATFORMS = [
  { id: "TWITTER", label: "Twitter / X" },
  { id: "LINKEDIN", label: "LinkedIn" },
  { id: "FACEBOOK", label: "Facebook" },
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "TIKTOK", label: "TikTok" },
] as const;

const TONES = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "hype", label: "Hype" },
  { id: "analytical", label: "Analytical" },
] as const;

const PLATFORM_LIMITS: Record<string, number> = {
  TWITTER: 280,
  LINKEDIN: 3000,
  FACEBOOK: 63206,
  INSTAGRAM: 2200,
  TIKTOK: 2200,
};

interface Draft {
  platform: string;
  content: string;
  hashtags: string[];
  imagePrompt: string;
}

export default function GeneratorTab() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("casual");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["TWITTER"]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editedDrafts, setEditedDrafts] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleGenerate() {
    if (selectedPlatforms.length === 0) {
      setMessage({ text: "Select at least one platform", type: "error" });
      return;
    }
    setIsGenerating(true);
    setMessage(null);
    setDrafts([]);
    setEditedDrafts({});

    try {
      const res = await fetch("/api/admin/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: selectedPlatforms, tone, topic: topic || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setDrafts(data.drafts || []);
        if (data.errors?.length > 0) {
          const errorDetail = data.errors.map((e: { platform: string; error: string }) => `${e.platform}: ${e.error}`).join(", ");
          setMessage({
            text: `Generated ${data.drafts.length} draft(s), ${data.errors.length} failed. ${errorDetail}`,
            type: data.drafts.length > 0 ? "success" : "error",
          });
        } else if (data.drafts?.length > 0) {
          setMessage({ text: `Generated ${data.drafts.length} draft(s) successfully!`, type: "success" });
        }
      } else {
        setMessage({ text: data.error || "Generation failed", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to connect to server", type: "error" });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleApprove(draft: Draft) {
    setIsSaving(draft.platform);
    try {
      const content = editedDrafts[draft.platform] ?? draft.content;
      const res = await fetch("/api/admin/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: draft.platform,
          content,
          hashtags: draft.hashtags,
          imagePrompt: draft.imagePrompt,
          tone,
          topic: topic || undefined,
          status: "DRAFT",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDrafts((prev) => prev.filter((d) => d.platform !== draft.platform));
        setMessage({ text: `${draft.platform} draft saved to queue`, type: "success" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: data.error || "Failed to save", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to save draft", type: "error" });
    } finally {
      setIsSaving(null);
    }
  }

  function handleDiscard(platform: string) {
    setDrafts((prev) => prev.filter((d) => d.platform !== platform));
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setMessage({ text: "Copied to clipboard", type: "success" });
    setTimeout(() => setMessage(null), 2000);
  }

  function getContent(draft: Draft) {
    return editedDrafts[draft.platform] ?? draft.content;
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

      {/* Topic Input */}
      <div className="section">
        <h3 className="section-title">TOPIC / THEME (Optional)</h3>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. NBA Playoffs, LeBron's legacy, March Madness upsets..."
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "white",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Tone Picker */}
      <div className="section" style={{ marginTop: "20px" }}>
        <h3 className="section-title">TONE</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              style={{
                padding: "8px 20px",
                background: tone === t.id ? "var(--orange)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${tone === t.id ? "var(--orange)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "6px",
                color: tone === t.id ? "black" : "rgba(255,255,255,0.7)",
                fontWeight: tone === t.id ? 700 : 400,
                cursor: "pointer",
                fontSize: "13px",
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Selector */}
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
                background: selectedPlatforms.includes(p.id) ? "rgba(255,107,53,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${selectedPlatforms.includes(p.id) ? "rgba(255,107,53,0.3)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                color: selectedPlatforms.includes(p.id) ? "var(--orange)" : "rgba(255,255,255,0.7)",
              }}
            >
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(p.id)}
                onChange={() => togglePlatform(p.id)}
                style={{ accentColor: "var(--orange)" }}
              />
              {p.label}
            </label>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div style={{ marginTop: "24px" }}>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={isGenerating || selectedPlatforms.length === 0}
          style={{ minWidth: "180px" }}
        >
          {isGenerating ? "Generating..." : "Generate All"}
        </button>
      </div>

      {/* Generated Drafts */}
      {drafts.length > 0 && (
        <div style={{ marginTop: "32px" }}>
          <h3 className="section-title">GENERATED DRAFTS</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "16px" }}>
            {drafts.map((draft) => {
              const content = getContent(draft);
              const limit = PLATFORM_LIMITS[draft.platform] || 2200;
              const overLimit = content.length > limit;

              return (
                <div
                  key={draft.platform}
                  className="stat-card"
                  style={{ padding: "20px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontWeight: 700, color: "var(--orange)", fontSize: "14px", textTransform: "uppercase" }}>
                      {PLATFORMS.find((p) => p.id === draft.platform)?.label || draft.platform}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontFamily: "'Roboto Mono', monospace",
                        color: overLimit ? "var(--red)" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {content.length} / {limit}
                    </span>
                  </div>

                  <textarea
                    value={content}
                    onChange={(e) => setEditedDrafts((prev) => ({ ...prev, [draft.platform]: e.target.value }))}
                    rows={6}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${overLimit ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "13px",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />

                  {draft.hashtags.length > 0 && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                      {draft.hashtags.map((tag) => (
                        <span key={tag} style={{ marginRight: "8px", color: "var(--blue, #3B82F6)" }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {draft.imagePrompt && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                      Image: {draft.imagePrompt}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApprove(draft)}
                      disabled={isSaving === draft.platform}
                      style={{ fontSize: "12px", padding: "6px 16px" }}
                    >
                      {isSaving === draft.platform ? "Saving..." : "Approve"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleCopy(content)}
                      style={{ fontSize: "12px", padding: "6px 16px" }}
                    >
                      Copy
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDiscard(draft.platform)}
                      style={{ fontSize: "12px", padding: "6px 16px", color: "var(--red)" }}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
