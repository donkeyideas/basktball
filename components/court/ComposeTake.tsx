"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import MentionAutocomplete from "./MentionAutocomplete";
import GifPicker from "./GifPicker";

// --- Types ---

interface ComposeTakeProps {
  onClose: () => void;
  onSubmit: (take: { content: string; tags: string[]; parentId?: string; gameId?: string; pollOptions?: string[]; pollDuration?: number; mediaUrls?: string[] }) => void;
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
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const validPollOptions = pollOptions.filter((o) => o.trim().length > 0);
  const pollValid = !showPoll || validPollOptions.length >= 2;
  const canPost = (content.trim().length > 0 || mediaUrls.length > 0) && !isOverLimit && !submitting && pollValid;

  const userName = session?.user?.name || "User";
  const userImage = session?.user?.image || null;

  // Auto-focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto-grow textarea + detect @mentions
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";

    // Detect @mention trigger
    const cursorPos = ta.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
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
      if (mediaUrls.length > 0) body.mediaUrls = mediaUrls;

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
  }, [canPost, content, tags, parentId, gameId, showPoll, validPollOptions, pollDuration, mediaUrls, onSubmit, onClose]);

  // Handle @mention selection
  const handleMentionSelect = useCallback((handle: string) => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const cursorPos = ta.selectionStart;
    const textBefore = content.slice(0, cursorPos);
    const textAfter = content.slice(cursorPos);
    const atIndex = textBefore.lastIndexOf("@");
    if (atIndex === -1) return;
    const newContent = textBefore.slice(0, atIndex) + `@${handle} ` + textAfter;
    setContent(newContent);
    setShowMentions(false);
    setTimeout(() => {
      const newPos = atIndex + handle.length + 2;
      ta.setSelectionRange(newPos, newPos);
      ta.focus();
    }, 0);
  }, [content]);

  // Handle image file selection and upload to R2 (supports multiple)
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Reset input so the same file can be re-selected
    e.target.value = "";

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 10 * 1024 * 1024; // 10 MB
    const remaining = 20 - mediaUrls.length;
    const filesToUpload = Array.from(files).slice(0, remaining);

    // Validate all files first
    for (const file of filesToUpload) {
      if (!allowedTypes.includes(file.type)) {
        alert("Only JPEG, PNG, WebP, and GIF images are allowed.");
        return;
      }
      if (file.size > maxSize) {
        alert("Each image must be under 10 MB.");
        return;
      }
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload/file", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const { publicUrl } = await res.json();
        uploadedUrls.push(publicUrl);
      }
      setMediaUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error("Image upload error:", err);
      alert(err instanceof Error ? err.message : "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [mediaUrls.length]);

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
    backgroundColor: "var(--dark-gray)",
    border: "1px solid var(--border-color)",
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
    borderBottom: "1px solid var(--border-subtle)",
  };

  const headerTitleStyle: React.CSSProperties = {
    fontFamily: "var(--font-anton), sans-serif",
    fontSize: "16px",
    color: "var(--white)",
    textTransform: "uppercase",
    letterSpacing: "1px",
  };

  const headerActionsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const cancelBtnStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--text-muted)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "8px",
    transition: "color 0.15s ease",
  };

  const postBtnStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: "14px",
    fontWeight: 700,
    color: canPost ? "var(--white)" : "var(--text-faint)",
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
    color: "var(--white)",
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
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: "15px",
    lineHeight: 1.45,
    color: "var(--text-primary)",
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
    borderTop: "1px solid var(--border-subtle)",
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
    fontFamily: "var(--font-inter), sans-serif",
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
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: "12px",
    color: "var(--text-muted)",
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
      : "var(--text-faint)",
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

        {/* Upload progress */}
        {uploading && (
          <div style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "13px",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}>
              <circle cx="8" cy="8" r="6" fill="none" stroke="#FF6B35" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
            </svg>
            Uploading image...
          </div>
        )}

        {/* Media preview */}
        {mediaUrls.length > 0 && (
          <div style={{ padding: "0 16px 8px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: mediaUrls.length === 1 ? "1fr" : "1fr 1fr",
              gap: "4px",
              borderRadius: "12px",
              overflow: "hidden",
            }}>
              {mediaUrls.map((url, i) => (
                <div key={i} style={{
                  position: "relative",
                  ...(mediaUrls.length === 3 && i === 0 ? { gridRow: "1 / 3" } : {}),
                }}>
                  <img
                    src={url}
                    alt={`Attached ${i + 1}`}
                    style={{
                      width: "100%",
                      height: mediaUrls.length === 1 ? "auto" : "120px",
                      maxHeight: mediaUrls.length === 1 ? "250px" : undefined,
                      objectFit: mediaUrls.length === 1 ? "contain" : "cover",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setMediaUrls((prev) => prev.filter((_, j) => j !== i))}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0,0,0,0.7)",
                      color: "var(--white)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Poll Creation UI */}
        {showPoll && (
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border-subtle)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}>
              <span style={{
                fontFamily: "var(--font-inter), sans-serif",
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
                  color: "var(--text-faint)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "var(--font-inter), sans-serif",
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
                    border: "1px solid var(--border-color)",
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-inter), sans-serif",
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
                      color: "var(--text-faint)",
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
                    fontFamily: "var(--font-inter), sans-serif",
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
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "12px",
                  color: "var(--text-faint)",
                }}>
                  Duration:
                </span>
                <select
                  value={pollDuration}
                  onChange={(e) => setPollDuration(Number(e.target.value))}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "var(--dark-gray)",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-inter), sans-serif",
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

        {/* Footer: tags + char count + action buttons */}
        <div style={{ ...footerStyle, position: "relative" }}>
          {/* Mention autocomplete dropdown */}
          <MentionAutocomplete
            query={mentionQuery}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentions(false)}
            visible={showMentions}
          />

          {/* GIF picker dropdown */}
          {showGifPicker && (
            <GifPicker
              onSelect={(gifUrl) => {
                setMediaUrls([gifUrl]);
                setShowGifPicker(false);
              }}
              onClose={() => setShowGifPicker(false)}
            />
          )}

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
          {/* Hidden file input for image uploads */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            style={{ display: "none" }}
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={mediaUrls.length >= 20 || uploading}
            style={{
              background: "none",
              border: "1px solid rgba(255,107,53,0.3)",
              color: (mediaUrls.length >= 20 || uploading) ? "var(--text-faint)" : "#FF6B35",
              cursor: (mediaUrls.length >= 20 || uploading) ? "not-allowed" : "pointer",
              fontSize: "11px",
              fontFamily: "var(--font-inter), sans-serif",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              flexShrink: 0,
              opacity: (mediaUrls.length >= 20 || uploading) ? 0.4 : 1,
            }}
          >
            {mediaUrls.length > 0 ? `IMG ${mediaUrls.length}/20` : "IMG"}
          </button>
          <button
            type="button"
            onClick={() => setShowGifPicker(!showGifPicker)}
            disabled={mediaUrls.length > 0 || uploading}
            style={{
              background: "none",
              border: "1px solid rgba(255,107,53,0.3)",
              color: (mediaUrls.length > 0 || uploading) ? "var(--text-faint)" : "#FF6B35",
              cursor: (mediaUrls.length > 0 || uploading) ? "not-allowed" : "pointer",
              fontSize: "11px",
              fontFamily: "var(--font-inter), sans-serif",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              flexShrink: 0,
              opacity: (mediaUrls.length > 0 || uploading) ? 0.4 : 1,
            }}
          >
            GIF
          </button>
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
                fontFamily: "var(--font-inter), sans-serif",
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
