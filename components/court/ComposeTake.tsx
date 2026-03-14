"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";

// --- Types ---

interface ComposeTakeProps {
  onClose: () => void;
  onSubmit: (take: { content: string; tags: string[]; parentId?: string; gameId?: string; pollOptions?: string[]; pollDuration?: number }) => void;
  parentId?: string;
  gameId?: string;
}

// --- Helpers ---

function getInitial(name: string): string {
  return (name?.charAt(0) || "?").toUpperCase();
}

const MAX_CHARS = 2000;

// --- Component ---

export default function ComposeTake({ onClose, onSubmit, parentId, gameId }: ComposeTakeProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState(24);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const validPollOptions = pollOptions.filter((o) => o.trim().length > 0);
  const pollValid = !showPoll || validPollOptions.length >= 2;
  const canPost = content.trim().length > 0 && !isOverLimit && !submitting && pollValid;

  const userName = session?.user?.name || "User";
  const userImage = session?.user?.image || null;

  // Auto-focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto-grow textarea
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, []);

  // Tag input: add tag on Enter or comma
  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const raw = tagInput.trim().replace(/^#/, "").replace(/[^a-zA-Z0-9_]/g, "");
        if (raw.length > 0 && !tags.includes(raw) && tags.length < 5) {
          setTags((prev) => [...prev, raw]);
        }
        setTagInput("");
      } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1));
      }
    },
    [tagInput, tags]
  );

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  // Submit
  const handlePost = useCallback(async () => {
    if (!canPost) return;
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        content: content.trim(),
        tags,
      };
      if (parentId) body.parentId = parentId;
      if (gameId) body.gameId = gameId;
      if (showPoll && validPollOptions.length >= 2) {
        body.pollOptions = validPollOptions.map((o) => o.trim());
        body.pollDuration = pollDuration;
      }

      const res = await fetch("/api/court/takes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        onSubmit({ content: content.trim(), tags, parentId, gameId, ...data });
        setContent("");
        setTags([]);
        setPollOptions(["", ""]);
        setShowPoll(false);
        onClose();
      } else {
        console.error("Failed to post take:", res.status);
      }
    } catch (err) {
      console.error("Error posting take:", err);
    } finally {
      setSubmitting(false);
    }
  }, [canPost, content, tags, parentId, gameId, showPoll, validPollOptions, pollDuration, onSubmit, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // --- Styles ---

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "10vh",
    zIndex: 1000,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#1A1A1A",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "520px",
    margin: "0 16px",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const headerTitleStyle: React.CSSProperties = {
    fontFamily: "var(--font-anton), sans-serif",
    fontSize: "16px",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: "1px",
  };

  const headerActionsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const cancelBtnStyle: React.CSSProperties = {
    fontFamily: "var(--font-barlow), sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.5)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "8px",
    transition: "color 0.15s ease",
  };

  const postBtnStyle: React.CSSProperties = {
    fontFamily: "var(--font-barlow), sans-serif",
    fontSize: "14px",
    fontWeight: 700,
    color: canPost ? "#FFFFFF" : "rgba(255,255,255,0.3)",
    backgroundColor: canPost ? "#FF6B35" : "rgba(255,107,53,0.2)",
    border: "none",
    cursor: canPost ? "pointer" : "not-allowed",
    padding: "6px 20px",
    borderRadius: "20px",
    transition: "background-color 0.15s ease, color 0.15s ease",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  };

  const bodyStyle: React.CSSProperties = {
    display: "flex",
    gap: "10px",
    padding: "16px",
    alignItems: "flex-start",
  };

  const avatarStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#FF6B35",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
    fontFamily: "var(--font-anton), sans-serif",
    fontSize: "16px",
    color: "#FFFFFF",
    lineHeight: 1,
  };

  const avatarImgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    fontFamily: "var(--font-barlow), sans-serif",
    fontSize: "15px",
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.9)",
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    resize: "none",
    minHeight: "80px",
    maxHeight: "200px",
    overflow: "auto",
    width: "100%",
  };

  const footerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    flexWrap: "wrap",
    gap: "8px",
  };

  const tagAreaStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
    flex: 1,
  };

  const tagPillStyle: React.CSSProperties = {
    fontFamily: "var(--font-barlow), sans-serif",
    fontSize: "11px",
    fontWeight: 600,
    color: "#FF6B35",
    backgroundColor: "rgba(255,107,53,0.12)",
    padding: "2px 8px",
    borderRadius: "10px",
    lineHeight: 1.5,
    display: "flex",
    alignItems: "center",
    gap: "4px",
    textTransform: "uppercase",
  };

  const tagRemoveBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#FF6B35",
    cursor: "pointer",
    padding: "0",
    fontSize: "13px",
    lineHeight: 1,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
  };

  const tagInputStyle: React.CSSProperties = {
    fontFamily: "var(--font-barlow), sans-serif",
    fontSize: "12px",
    color: "rgba(255,255,255,0.6)",
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    width: "80px",
  };

  const charCountStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "12px",
    fontWeight: 500,
    color: isOverLimit
      ? "#EF4444"
      : charCount > MAX_CHARS - 20
      ? "#F59E0B"
      : "rgba(255,255,255,0.35)",
    flexShrink: 0,
  };

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={headerTitleStyle}>{parentId ? "Reply" : "New Take"}</span>
          <div style={headerActionsStyle}>
            <button type="button" style={cancelBtnStyle} onClick={onClose}>
              Cancel
            </button>
            <button type="button" style={postBtnStyle} onClick={handlePost} disabled={!canPost}>
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>

        {/* Body: avatar + textarea */}
        <div style={bodyStyle}>
          <div style={avatarStyle}>
            {userImage ? (
              <img src={userImage} alt={userName} style={avatarImgStyle} />
            ) : (
              getInitial(userName)
            )}
          </div>
          <textarea
            ref={textareaRef}
            style={textareaStyle}
            placeholder={parentId ? "Drop your reply..." : "What's your take?"}
            value={content}
            onChange={handleContentChange}
            maxLength={MAX_CHARS + 10}
          />
        </div>

        {/* Poll Creation UI */}
        {showPoll && (
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}>
              <span style={{
                fontFamily: "var(--font-barlow), sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#FF6B35",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Poll Options
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowPoll(false);
                  setPollOptions(["", ""]);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontWeight: 600,
                }}
              >
                Remove Poll
              </button>
            </div>
            {pollOptions.map((opt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const updated = [...pollOptions];
                    updated[i] = e.target.value;
                    setPollOptions(updated);
                  }}
                  placeholder={`Option ${i + 1}${i < 2 ? " (required)" : ""}`}
                  maxLength={80}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.85)",
                    fontFamily: "var(--font-barlow), sans-serif",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                {i >= 2 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions((prev) => prev.filter((_, j) => j !== i))}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      fontSize: "16px",
                      lineHeight: 1,
                      padding: "4px",
                    }}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPollOptions((prev) => [...prev, ""])}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,107,53,0.3)",
                    color: "#FF6B35",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontFamily: "var(--font-barlow), sans-serif",
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  + Add Option
                </button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                <span style={{
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.4)",
                }}>
                  Duration:
                </span>
                <select
                  value={pollDuration}
                  onChange={(e) => setPollDuration(Number(e.target.value))}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "#1A1A1A",
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "var(--font-barlow), sans-serif",
                    fontSize: "12px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>1 day</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer: tags + char count */}
        <div style={footerStyle}>
          <div style={tagAreaStyle}>
            {tags.map((tag) => (
              <span key={tag} style={tagPillStyle}>
                #{tag}
                <button
                  type="button"
                  style={tagRemoveBtnStyle}
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  x
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                type="text"
                style={tagInputStyle}
                placeholder="#tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            )}
          </div>
          {!showPoll && !parentId && (
            <button
              type="button"
              onClick={() => setShowPoll(true)}
              style={{
                background: "none",
                border: "1px solid rgba(255,107,53,0.3)",
                color: "#FF6B35",
                cursor: "pointer",
                fontSize: "11px",
                fontFamily: "var(--font-barlow), sans-serif",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                flexShrink: 0,
              }}
            >
              + Poll
            </button>
          )}
          <span style={charCountStyle}>
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>
    </div>
  );
}
