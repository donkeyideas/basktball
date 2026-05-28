"use client";

import { useState } from "react";

interface PostEditorProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  replyToId?: string | null;
  onCancelReply?: () => void;
}

export default function PostEditor({ onSubmit, placeholder = "Write your reply...", submitLabel = "Post Reply", replyToId, onCancelReply }: PostEditorProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  }

  async function handleAiHelp() {
    if (aiLoading || !content.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/forum/ai/writing-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: content }),
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.draft);
      }
    } catch {
      // Silently fail
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: "var(--dark-gray)",
      borderRadius: "8px",
      border: "1px solid #2a2a2a",
      padding: "16px",
    }}>
      {replyToId && onCancelReply && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
          fontSize: "12px",
          color: "#FF6B35",
        }}>
          Replying to a post
          <button
            type="button"
            onClick={onCancelReply}
            style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "12px" }}
          >
            Cancel
          </button>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #333",
          background: "var(--black)",
          color: "var(--white)",
          fontSize: "14px",
          fontFamily: "var(--font-inter)",
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
          minHeight: "100px",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
        <button
          type="button"
          onClick={handleAiHelp}
          disabled={aiLoading || !content.trim()}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #333",
            background: "transparent",
            color: content.trim() ? "#3B82F6" : "var(--text-faint)",
            fontSize: "13px",
            cursor: content.trim() ? "pointer" : "default",
            fontFamily: "var(--font-inter)",
          }}
        >
          {aiLoading ? "AI thinking..." : "AI Help"}
        </button>

        <button
          type="submit"
          disabled={loading || !content.trim()}
          style={{
            padding: "8px 20px",
            borderRadius: "6px",
            border: "none",
            background: content.trim() ? "#FF6B35" : "#444",
            color: "var(--white)",
            fontSize: "14px",
            fontWeight: "600",
            cursor: content.trim() ? "pointer" : "default",
            fontFamily: "var(--font-inter)",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          {loading ? "Posting..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
