"use client";

import { useState, useEffect } from "react";

interface ContentData {
  [key: string]: string;
}

export default function AdminContentPage() {
  const [content, setContent] = useState<ContentData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function fetchContent() {
    try {
      const res = await fetch("/api/admin/content");
      const data = await res.json();
      if (data.success) {
        setContent(data.content || {});
        setError(null);
      } else {
        setError(data.error || "Failed to load content");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchContent();
  }, []);

  async function saveContent(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Content saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to save content");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsSaving(false);
    }
  }

  function updateField(key: string, value: string) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "#111",
    border: "1px solid #333",
    borderRadius: "6px",
    color: "var(--white)",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical",
    lineHeight: "1.5",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "6px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  };

  const sectionStyle: React.CSSProperties = {
    background: "var(--dark-gray)",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "20px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: "var(--font-anton), Anton, sans-serif",
    fontSize: "20px",
    color: "#FF6B35",
    letterSpacing: "1px",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "2px solid #FF6B35",
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: "16px",
  };

  const rowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  };

  if (isLoading) {
    return (
      <>
        <div className="admin-header">
          <h1>CONTENT</h1>
        </div>
        <div className="admin-content">
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--text-muted)" }}>Loading content...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="admin-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>CONTENT MANAGER</h1>
          <button
            onClick={saveContent}
            disabled={isSaving}
            style={{
              background: "#FF6B35",
              color: "var(--white)",
              border: "none",
              padding: "10px 28px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "1px",
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? "SAVING..." : "SAVE ALL CHANGES"}
          </button>
        </div>
      </div>

      <div className="admin-content">
        <form onSubmit={saveContent}>
          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid #EF4444",
              color: "#EF4444",
              padding: "15px",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid #10B981",
              color: "#10B981",
              padding: "15px",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "14px",
            }}>
              {success}
            </div>
          )}

          {/* Hero Section */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>HERO SECTION</div>
            <p style={{ color: "var(--text-faint)", fontSize: "13px", marginBottom: "20px", marginTop: "-12px" }}>
              The main banner area at the top of the homepage
            </p>

            <div style={rowStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Title Line 1</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={content.content_hero_title_line1 || ""}
                  onChange={(e) => updateField("content_hero_title_line1", e.target.value)}
                  placeholder="DOMINATE"
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Title Line 2</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={content.content_hero_title_line2 || ""}
                  onChange={(e) => updateField("content_hero_title_line2", e.target.value)}
                  placeholder="THE DATA"
                />
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Subtitle</label>
              <textarea
                style={textareaStyle}
                value={content.content_hero_subtitle || ""}
                onChange={(e) => updateField("content_hero_subtitle", e.target.value)}
                placeholder="Real-time basketball analytics..."
              />
            </div>

            <div style={rowStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Button 1 Text</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={content.content_hero_btn1_text || ""}
                  onChange={(e) => updateField("content_hero_btn1_text", e.target.value)}
                  placeholder="LIVE SCORES"
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Button 1 Link</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={content.content_hero_btn1_link || ""}
                  onChange={(e) => updateField("content_hero_btn1_link", e.target.value)}
                  placeholder="/live"
                />
              </div>
            </div>

            <div style={rowStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Button 2 Text</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={content.content_hero_btn2_text || ""}
                  onChange={(e) => updateField("content_hero_btn2_text", e.target.value)}
                  placeholder="EXPLORE TOOLS"
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Button 2 Link</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={content.content_hero_btn2_link || ""}
                  onChange={(e) => updateField("content_hero_btn2_link", e.target.value)}
                  placeholder="/tools"
                />
              </div>
            </div>
          </div>

          {/* App Download Links */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>APP DOWNLOAD LINKS</div>
            <p style={{ color: "var(--text-faint)", fontSize: "13px", marginBottom: "20px", marginTop: "-12px" }}>
              Links to your mobile app on app stores. Leave blank to hide a badge.
            </p>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Google Play Store URL</label>
              <input
                type="text"
                style={inputStyle}
                value={content.content_google_play_url || ""}
                onChange={(e) => updateField("content_google_play_url", e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=com.basktball.app"
              />
              <p style={{ color: "var(--text-faint)", fontSize: "12px", marginTop: "4px" }}>
                Shows the Google Play badge in the header, hero, and Court page
              </p>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Apple App Store URL</label>
              <input
                type="text"
                style={inputStyle}
                value={content.content_apple_store_url || ""}
                onChange={(e) => updateField("content_apple_store_url", e.target.value)}
                placeholder="https://apps.apple.com/app/basktball/id..."
              />
              <p style={{ color: "var(--text-faint)", fontSize: "12px", marginTop: "4px" }}>
                Shows the App Store badge in the header, hero, and Court page
              </p>
            </div>
          </div>

          {/* Social Proof Stats */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>SOCIAL PROOF STATS</div>
            <p style={{ color: "var(--text-faint)", fontSize: "13px", marginBottom: "20px", marginTop: "-12px" }}>
              The three stat boxes shown on the homepage
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div style={{ background: "#111", borderRadius: "8px", padding: "16px", border: "1px solid #2a2a2a" }}>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Stat 1 Value</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={content.content_stat1_value || ""}
                    onChange={(e) => updateField("content_stat1_value", e.target.value)}
                    placeholder="5,000+"
                  />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Stat 1 Label</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={content.content_stat1_label || ""}
                    onChange={(e) => updateField("content_stat1_label", e.target.value)}
                    placeholder="Basketball Fans"
                  />
                </div>
              </div>

              <div style={{ background: "#111", borderRadius: "8px", padding: "16px", border: "1px solid #2a2a2a" }}>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Stat 2 Value</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={content.content_stat2_value || ""}
                    onChange={(e) => updateField("content_stat2_value", e.target.value)}
                    placeholder="30+"
                  />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Stat 2 Label</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={content.content_stat2_label || ""}
                    onChange={(e) => updateField("content_stat2_label", e.target.value)}
                    placeholder="NBA Teams Tracked Live"
                  />
                </div>
              </div>

              <div style={{ background: "#111", borderRadius: "8px", padding: "16px", border: "1px solid #2a2a2a" }}>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Stat 3 Value</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={content.content_stat3_value || ""}
                    onChange={(e) => updateField("content_stat3_value", e.target.value)}
                    placeholder="1,000+"
                  />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Stat 3 Label</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={content.content_stat3_label || ""}
                    onChange={(e) => updateField("content_stat3_label", e.target.value)}
                    placeholder="Takes Shared on The Court"
                  />
                </div>
              </div>
            </div>

            <div style={{ ...fieldGroupStyle, marginTop: "16px" }}>
              <label style={labelStyle}>Community Link Text</label>
              <input
                type="text"
                style={inputStyle}
                value={content.content_community_link_text || ""}
                onChange={(e) => updateField("content_community_link_text", e.target.value)}
                placeholder="JOIN THE COMMUNITY"
              />
            </div>
          </div>

          {/* FAQ Section */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>FAQ SECTION</div>
            <p style={{ color: "var(--text-faint)", fontSize: "13px", marginBottom: "20px", marginTop: "-12px" }}>
              Frequently asked questions shown at the bottom of the homepage
            </p>

            {[1, 2, 3, 4].map((num) => (
              <div key={num} style={{
                background: "#111",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #2a2a2a",
                marginBottom: "12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{
                    background: "#FF6B35",
                    color: "var(--white)",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>{num}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: 600 }}>FAQ #{num}</span>
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Question</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={content[`content_faq${num}_question`] || ""}
                    onChange={(e) => updateField(`content_faq${num}_question`, e.target.value)}
                    placeholder="Enter question..."
                  />
                </div>
                <div style={{ marginBottom: 0 }}>
                  <label style={labelStyle}>Answer</label>
                  <textarea
                    style={textareaStyle}
                    value={content[`content_faq${num}_answer`] || ""}
                    onChange={(e) => updateField(`content_faq${num}_answer`, e.target.value)}
                    placeholder="Enter answer..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>FOOTER</div>
            <p style={{ color: "var(--text-faint)", fontSize: "13px", marginBottom: "20px", marginTop: "-12px" }}>
              Text shown at the bottom of every page
            </p>

            <div style={rowStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Copyright Text</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={content.content_footer_copyright || ""}
                  onChange={(e) => updateField("content_footer_copyright", e.target.value)}
                  placeholder="BASKTBALL. All rights reserved."
                />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Update Note</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={content.content_footer_update_note || ""}
                  onChange={(e) => updateField("content_footer_update_note", e.target.value)}
                  placeholder="ALL STATS UPDATED IN REAL-TIME"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "10px", paddingBottom: "40px" }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                background: "#FF6B35",
                color: "var(--white)",
                border: "none",
                padding: "14px 40px",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "1px",
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? "SAVING..." : "SAVE ALL CHANGES"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
