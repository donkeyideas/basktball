"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ChatMsg {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    displayName?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
    image?: string | null;
    role: string;
    favoriteTeamId?: string | null;
  };
}

interface LiveChatRoomProps {
  gameId: string;
  compact?: boolean;
}

export default function LiveChatRoom({ gameId, compact }: LiveChatRoomProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/forum/chat/${gameId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // Silently fail
    }
  }, [gameId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);

    try {
      const res = await fetch(`/api/forum/chat/${gameId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) {
        setInput("");
        fetchMessages();
      }
    } catch {
      // Silently fail
    } finally {
      setSending(false);
    }
  }

  const height = compact ? "300px" : "500px";

  return (
    <div style={{
      background: "var(--dark-gray)",
      borderRadius: "8px",
      border: "1px solid #2a2a2a",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height,
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid #2a2a2a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontWeight: "700", fontSize: "14px", color: "#FF6B35", fontFamily: "var(--font-inter)" }}>
          LIVE CHAT
        </span>
        <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-faint)", padding: "20px", fontSize: "14px" }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => {
          const displayName = msg.author.displayName || msg.author.name || "Anon";
          return (
            <div key={msg.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#FF6B35",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "700",
                color: "var(--white)",
                flexShrink: 0,
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: msg.author.role === "ADMIN" ? "#EF4444" : msg.author.role === "MODERATOR" ? "#8B5CF6" : "#FF6B35" }}>
                  {displayName}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-faint)", marginLeft: "6px" }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px", wordBreak: "break-word" }}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {session?.user ? (
        <form onSubmit={handleSend} style={{
          padding: "10px",
          borderTop: "1px solid #2a2a2a",
          display: "flex",
          gap: "8px",
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #333",
              background: "var(--black)",
              color: "var(--white)",
              fontSize: "13px",
              fontFamily: "var(--font-inter)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: input.trim() ? "#FF6B35" : "var(--border-color)",
              color: "var(--white)",
              fontSize: "13px",
              fontWeight: "600",
              cursor: input.trim() ? "pointer" : "default",
            }}
          >
            Send
          </button>
        </form>
      ) : (
        <div style={{ padding: "10px", borderTop: "1px solid #2a2a2a", textAlign: "center" }}>
          <Link href="/login" style={{ color: "#FF6B35", fontSize: "13px", textDecoration: "none" }}>
            Sign in to chat
          </Link>
        </div>
      )}
    </div>
  );
}
