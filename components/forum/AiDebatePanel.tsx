"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiDebatePanel() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/forum/ai/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: messages }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.error || "Failed to respond. Try again." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!session?.user) {
    return (
      <div style={{
        background: "#1A1A1A",
        borderRadius: "8px",
        border: "1px solid #2a2a2a",
        padding: "40px",
        textAlign: "center",
      }}>
        <h3 style={{ fontFamily: "var(--font-anton)", color: "#FF6B35", fontSize: "20px", marginBottom: "8px" }}>
          DEBATE THE AI
        </h3>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "16px" }}>
          Drop your hottest basketball take and the AI will argue the other side
        </p>
        <Link href="/login" style={{ color: "#FF6B35", textDecoration: "none", fontWeight: "600" }}>
          Sign in to debate
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      background: "#1A1A1A",
      borderRadius: "8px",
      border: "1px solid #2a2a2a",
      overflow: "hidden",
    }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #2a2a2a" }}>
        <h3 style={{ fontFamily: "var(--font-anton)", color: "#FF6B35", fontSize: "18px", margin: 0 }}>
          DEBATE THE AI
        </h3>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "4px 0 0 0" }}>
          Share a hot take. The AI will argue against you.
        </p>
      </div>

      <div style={{ padding: "16px", maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "20px", fontSize: "14px" }}>
            Drop your hottest take to get started...
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              padding: "10px 14px",
              borderRadius: "12px",
              background: msg.role === "user" ? "#FF6B35" : "#2a2a2a",
              color: "#fff",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            {msg.role === "assistant" && (
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#3B82F6", marginBottom: "4px", textTransform: "uppercase" }}>
                AI Opponent
              </div>
            )}
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: "12px", background: "#2a2a2a", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
            Thinking of a rebuttal...
          </div>
        )}
      </div>

      <form onSubmit={handleSend} style={{ padding: "12px", borderTop: "1px solid #2a2a2a", display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="LeBron is better than Jordan because..."
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #333",
            background: "#0D0D0D",
            color: "#fff",
            fontSize: "14px",
            fontFamily: "var(--font-barlow)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: input.trim() ? "#FF6B35" : "#333",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: input.trim() ? "pointer" : "default",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
