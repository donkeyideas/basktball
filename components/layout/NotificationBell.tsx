"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  data: Record<string, string> | null;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function NotifIcon({ type, read }: { type: string; read: boolean }) {
  const color = read ? "rgba(255,255,255,0.4)" : "#FF6B35";
  const size = 16;
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (type) {
    case "FIRE":
      return <svg {...props}><path d="M12 12c0-3 2.5-5 2.5-8C8 7 6 11 6 14a6 6 0 0 0 12 0c0-1.5-.5-3-2-4.5-1 1-2 2-4 2.5z" fill={color} stroke="none" /></svg>;
    case "BRICK":
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="9" /><line x1="15" y1="9" x2="15" y2="15" /><line x1="9" y1="15" x2="9" y2="21" /></svg>;
    case "REPLY":
      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case "REPOST":
      return <svg {...props}><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>;
    case "FOLLOW":
      return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>;
    case "CHALLENGE":
      return <svg {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>;
    case "CHALLENGE_ACCEPT":
      return <svg {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
    case "CHALLENGE_VOTE":
      return <svg {...props}><path d="M14 9V5a3 3 0 0 0-6 0v4" /><rect x="2" y="9" width="20" height="12" rx="2" /><circle cx="12" cy="15" r="1" /></svg>;
    case "CHALLENGE_RESULT":
      return <svg {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" /><path d="M4 22h16" /><path d="M10 14.66V22" /><path d="M14 14.66V22" /><path d="M8 9h8a4 4 0 0 0 0-8H8a4 4 0 0 0 0 8z" /></svg>;
    case "PREDICTION_RESOLVED":
      return <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
    case "AGING_RESURFACED":
      return <svg {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case "STAT_CHECK":
      return <svg {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case "MENTION":
      return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" /></svg>;
    case "POLL_ENDED":
      return <svg {...props}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
    default:
      return <svg {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
  }
}

function getNotifLink(notif: Notification): string | null {
  if (notif.data?.takeId) return `/court/take/${notif.data.takeId}`;
  if (notif.data?.challengeId) return `/court`;
  if (notif.data?.followerId) return `/user/${notif.data.followerId}`;
  return null;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll unread count
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        const data = await res.json();
        setUnreadCount(data.count || 0);
      } catch { /* ignore */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/notifications?limit=10")
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.read) {
      fetch(`/api/notifications/${notif.id}/read`, { method: "POST" }).catch(() => {});
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    }
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px",
          position: "relative",
          color: "#fff",
        }}
        title="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "#EF4444",
            color: "#fff",
            fontSize: "10px",
            fontWeight: "700",
            borderRadius: "10px",
            padding: "1px 5px",
            minWidth: "16px",
            textAlign: "center",
            lineHeight: "14px",
            fontFamily: "var(--font-inter)",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "8px",
          background: "#1A1A1A",
          border: "1px solid #333",
          borderRadius: "12px",
          width: "340px",
          maxHeight: "420px",
          overflowY: "auto",
          zIndex: 200,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid #2a2a2a",
          }}>
            <span style={{
              fontFamily: "var(--font-anton)",
              fontSize: "14px",
              color: "#FF6B35",
              letterSpacing: "1px",
            }}>
              NOTIFICATIONS
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FF6B35",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>
              No notifications yet
            </div>
          ) : (
            notifications.map((notif) => {
              const link = getNotifLink(notif);
              const content = (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 16px",
                    cursor: "pointer",
                    background: notif.read ? "transparent" : "rgba(255,107,53,0.05)",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = notif.read ? "transparent" : "rgba(255,107,53,0.05)"; }}
                >
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: notif.read ? "rgba(255,255,255,0.06)" : "rgba(255,107,53,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}>
                    <NotifIcon type={notif.type} read={notif.read} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: "13px",
                      color: notif.read ? "rgba(255,255,255,0.5)" : "#fff",
                      fontWeight: notif.read ? 400 : 600,
                      lineHeight: "18px",
                    }}>
                      {notif.title}
                    </div>
                    {notif.body && (
                      <div style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.3)",
                        marginTop: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {notif.body}
                      </div>
                    )}
                    <div style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.25)",
                      marginTop: "2px",
                    }}>
                      {timeAgo(notif.createdAt)}
                    </div>
                  </div>
                  {!notif.read && (
                    <div style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#FF6B35",
                      flexShrink: 0,
                      marginTop: "6px",
                    }} />
                  )}
                </div>
              );

              return link ? (
                <Link key={notif.id} href={link} style={{ textDecoration: "none" }}>
                  {content}
                </Link>
              ) : (
                <div key={notif.id}>{content}</div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
