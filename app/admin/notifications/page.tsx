"use client";

import { useState, useEffect, useCallback } from "react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, string> | null;
  read: boolean;
  pushed: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string;
  };
}

interface Stats {
  total: number;
  pushed: number;
  read: number;
  unread: number;
  byType: { type: string; count: number }[];
  dailyData: { date: string; count: number }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BroadcastLog {
  id: string;
  type: string;
  title: string;
  body: string | null;
  targetAudience: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  sentByUserId: string | null;
  createdAt: string;
}

interface GameLog {
  id: string;
  gameId: string;
  status: string;
  userCount: number;
  sentAt: string;
  game: {
    homeTeamId: string;
    awayTeamId: string;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: { name: string; abbreviation: string };
    awayTeam: { name: string; abbreviation: string };
  };
}

const TYPE_COLORS: Record<string, string> = {
  FIRE: "#EF4444",
  BRICK: "#6B7280",
  REPLY: "#3B82F6",
  REPOST: "#10B981",
  FOLLOW: "#8B5CF6",
  CHALLENGE: "#F59E0B",
  CHALLENGE_ACCEPT: "#F59E0B",
  CHALLENGE_VOTE: "#F59E0B",
  CHALLENGE_RESULT: "#F59E0B",
  PREDICTION_RESOLVED: "#EC4899",
  AGING_RESURFACED: "#14B8A6",
  STAT_CHECK: "#6366F1",
  MENTION: "#0EA5E9",
  POLL_ENDED: "#A855F7",
  GAME_LIVE: "#22C55E",
  GAME_FINAL: "#EF4444",
  SYSTEM: "#FF6B35",
};

const NOTIFICATION_TYPES = [
  "FIRE", "BRICK", "REPLY", "REPOST", "FOLLOW",
  "CHALLENGE", "CHALLENGE_ACCEPT", "CHALLENGE_VOTE", "CHALLENGE_RESULT",
  "PREDICTION_RESOLVED", "AGING_RESURFACED", "STAT_CHECK", "MENTION", "POLL_ENDED",
  "GAME_LIVE", "GAME_FINAL", "SYSTEM",
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>([]);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [pushedFilter, setPushedFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [page, setPage] = useState(1);

  // Broadcast form
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState("all");
  const [broadcastTeamId, setBroadcastTeamId] = useState("");
  const [broadcastRole, setBroadcastRole] = useState("PREMIUM");
  const [isSending, setIsSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  // Generate dropdown
  const [generateType, setGenerateType] = useState<"news" | "encouragement">("news");
  const [isGenerating, setIsGenerating] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<"history" | "broadcasts" | "games">("history");

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (pushedFilter) params.set("pushed", pushedFilter);
      if (readFilter) params.set("read", readFilter);
      params.set("page", String(page));
      params.set("limit", "30");

      const res = await fetch(`/api/admin/notifications?${params}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setStats(data.stats);
        setPagination(data.pagination);
        setError(null);
      } else {
        setError(data.error || "Failed to load notifications");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, pushedFilter, readFilter, page]);

  const fetchLogs = useCallback(async () => {
    try {
      const [broadcastRes, gameRes] = await Promise.all([
        fetch("/api/admin/notifications/logs"),
        fetch("/api/admin/notifications/game-logs"),
      ]);
      const broadcastData = await broadcastRes.json();
      const gameData = await gameRes.json();
      if (broadcastData.success) setBroadcastLogs(broadcastData.logs || []);
      if (gameData.success) setGameLogs(gameData.logs || []);
    } catch {
      // Non-critical, don't block
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchLogs();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchLogs();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchLogs]);

  async function handleSendBroadcast() {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;

    const confirmMsg = `Send notification to ${broadcastAudience === "all" ? "ALL users" : broadcastAudience === "team" ? `team ${broadcastTeamId}` : `role ${broadcastRole}`}?`;
    if (!confirm(confirmMsg)) return;

    setIsSending(true);
    setBroadcastResult(null);

    try {
      let targetAudience = "all";
      if (broadcastAudience === "team" && broadcastTeamId) {
        targetAudience = `team:${broadcastTeamId}`;
      } else if (broadcastAudience === "role") {
        targetAudience = `role:${broadcastRole}`;
      }

      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          body: broadcastBody,
          targetAudience,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setBroadcastResult(
          `Sent to ${data.totalRecipients} users. Push: ${data.successCount} success, ${data.failureCount} failed.`
        );
        setBroadcastTitle("");
        setBroadcastBody("");
        fetchNotifications();
        fetchLogs();
      } else {
        setBroadcastResult(`Error: ${data.error}`);
      }
    } catch {
      setBroadcastResult("Failed to send broadcast");
    } finally {
      setIsSending(false);
    }
  }

  const ENCOURAGEMENT_MESSAGES = [
    { title: "Don't miss the action!", body: "Games are heating up — open Basktball to check scores, make predictions, and challenge your friends!" },
    { title: "Your takes are waiting", body: "Got a hot take? Drop a post on Basktball and see if the community agrees. Fire or brick — you decide!" },
    { title: "Check today's games", body: "The schedule is loaded with matchups today. Open Basktball to follow along live and never miss a highlight!" },
    { title: "Challenge your friends!", body: "Think you know hoops? Send a challenge on Basktball and prove it. Bragging rights are on the line." },
    { title: "Stay in the loop", body: "Trade rumors, game recaps, and hot takes — it's all happening on Basktball right now. Come see what you're missing!" },
    { title: "Predictions are open!", body: "Lock in your picks before tip-off. Head to Basktball and put your basketball IQ to the test." },
    { title: "The timeline is buzzing", body: "The basketball community is going off right now. Open Basktball to join the conversation!" },
    { title: "New content just dropped", body: "Fresh posts, bold takes, and live game updates are waiting for you on Basktball. Don't sleep on it!" },
  ];

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      if (generateType === "news") {
        const res = await fetch("/api/news?limit=5");
        const data = await res.json();
        if (data.success && data.articles?.length > 0) {
          const article = data.articles[0];
          setBroadcastTitle(article.title);
          setBroadcastBody(article.description || article.content || "Check out the latest basketball news on Basktball!");
        } else {
          setBroadcastResult("Error: Could not fetch news articles");
        }
      } else {
        const msg = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
        setBroadcastTitle(msg.title);
        setBroadcastBody(msg.body);
      }
    } catch {
      setBroadcastResult("Error: Failed to generate notification");
    } finally {
      setIsGenerating(false);
    }
  }

  // Chart helpers
  const maxDaily = Math.max(...(stats?.dailyData?.map((d) => d.count) || [0]), 1);
  const maxTypeCount = Math.max(...(stats?.byType?.map((t) => t.count) || [0]), 1);

  const statCards = [
    {
      label: "Total Sent",
      value: stats?.total ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      label: "Pushed",
      value: stats?.pushed ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ),
    },
    {
      label: "Read",
      value: stats?.read ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      label: "Unread",
      value: stats?.unread ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="admin-header">
        <h1>NOTIFICATIONS</h1>
        <button className="btn btn-primary" onClick={() => { fetchNotifications(); fetchLogs(); }}>
          Refresh
        </button>
      </div>

      <div className="admin-content">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading notifications...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
            <button className="btn btn-primary" onClick={fetchNotifications} style={{ marginTop: "20px" }}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* KPI Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {statCards.map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="value">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</div>
                  <div className="label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
              {/* Daily Chart */}
              <div className="section">
                <div className="section-title">Notifications (14 Days)</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "160px", padding: "0 8px" }}>
                  {(stats?.dailyData || []).map((day) => (
                    <div
                      key={day.date}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100%",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: "4px",
                      }}>
                        {day.count > 0 ? day.count : ""}
                      </div>
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "32px",
                          height: `${Math.max((day.count / maxDaily) * 120, day.count > 0 ? 4 : 0)}px`,
                          background: "var(--orange, #FF6B35)",
                          borderRadius: "2px 2px 0 0",
                          transition: "height 0.3s",
                        }}
                      />
                      <div style={{
                        fontSize: "9px",
                        color: "rgba(255,255,255,0.3)",
                        marginTop: "4px",
                        transform: "rotate(-45deg)",
                        whiteSpace: "nowrap",
                      }}>
                        {day.date.slice(5)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Type Chart */}
              <div className="section">
                <div className="section-title">By Type</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                  {(stats?.byType || []).map((t) => (
                    <div key={t.type} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "120px",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: TYPE_COLORS[t.type] || "#fff",
                        whiteSpace: "nowrap",
                      }}>
                        {t.type}
                      </div>
                      <div style={{ flex: 1, height: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{
                          width: `${(t.count / maxTypeCount) * 100}%`,
                          height: "100%",
                          background: TYPE_COLORS[t.type] || "#FF6B35",
                          borderRadius: "4px",
                          transition: "width 0.3s",
                          minWidth: t.count > 0 ? "4px" : "0",
                        }} />
                      </div>
                      <div style={{
                        width: "50px",
                        textAlign: "right",
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontSize: "13px",
                        fontWeight: "bold",
                        color: "var(--white, #fff)",
                      }}>
                        {t.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Send Broadcast */}
            <div className="section" style={{ marginBottom: "30px" }}>
              <div className="section-title">Send System Broadcast</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Generate Controls */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <select
                    value={generateType}
                    onChange={(e) => setGenerateType(e.target.value as "news" | "encouragement")}
                    style={{
                      padding: "10px 14px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  >
                    <option value="news">From Latest News</option>
                    <option value="encouragement">Encouragement Message</option>
                  </select>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    style={{
                      padding: "10px 20px",
                      background: isGenerating ? "rgba(139,92,246,0.4)" : "linear-gradient(135deg, #8B5CF6, #6D28D9)",
                      border: "none",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: isGenerating ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          <path d="M2 17l10 5 10-5" />
                          <path d="M2 12l10 5 10-5" />
                        </svg>
                        Generate
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Notification title..."
                  style={{
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "var(--font-inter), sans-serif",
                  }}
                />
                <textarea
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Notification body..."
                  rows={3}
                  style={{
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "var(--font-inter), sans-serif",
                    resize: "vertical",
                  }}
                />
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={broadcastAudience}
                    onChange={(e) => setBroadcastAudience(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  >
                    <option value="all">All Users</option>
                    <option value="team">By Team</option>
                    <option value="role">By Role</option>
                  </select>
                  {broadcastAudience === "team" && (
                    <input
                      type="text"
                      value={broadcastTeamId}
                      onChange={(e) => setBroadcastTeamId(e.target.value)}
                      placeholder="Team ID (e.g. 1610612747)"
                      style={{
                        padding: "10px 14px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                        width: "250px",
                      }}
                    />
                  )}
                  {broadcastAudience === "role" && (
                    <select
                      value={broadcastRole}
                      onChange={(e) => setBroadcastRole(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    >
                      <option value="USER">USER</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={handleSendBroadcast}
                    disabled={isSending || !broadcastTitle.trim() || !broadcastBody.trim()}
                    style={{ opacity: isSending ? 0.6 : 1 }}
                  >
                    {isSending ? "Sending..." : "Send Broadcast"}
                  </button>
                </div>
                {broadcastResult && (
                  <div style={{
                    padding: "10px 14px",
                    background: broadcastResult.startsWith("Error") ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                    border: `1px solid ${broadcastResult.startsWith("Error") ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                    color: broadcastResult.startsWith("Error") ? "#EF4444" : "#10B981",
                    fontSize: "13px",
                  }}>
                    {broadcastResult}
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: "0", marginBottom: "0" }}>
              {([
                { key: "history", label: "Notification History" },
                { key: "broadcasts", label: "Broadcast Log" },
                { key: "games", label: "Game Notifications" },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "10px 24px",
                    background: activeTab === tab.key ? "rgba(255,255,255,0.08)" : "transparent",
                    border: "none",
                    borderBottom: activeTab === tab.key ? "2px solid #FF6B35" : "2px solid transparent",
                    color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.4)",
                    fontSize: "14px",
                    fontWeight: activeTab === tab.key ? "600" : "400",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification History Tab */}
            {activeTab === "history" && (
              <div className="section" style={{ marginTop: "0", borderTop: "none" }}>
                {/* Filters */}
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    style={{
                      padding: "10px 14px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  >
                    <option value="">All Types</option>
                    {NOTIFICATION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={pushedFilter}
                    onChange={(e) => { setPushedFilter(e.target.value); setPage(1); }}
                    style={{
                      padding: "10px 14px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  >
                    <option value="">All Push Status</option>
                    <option value="true">Pushed</option>
                    <option value="false">Not Pushed</option>
                  </select>
                  <select
                    value={readFilter}
                    onChange={(e) => { setReadFilter(e.target.value); setPage(1); }}
                    style={{
                      padding: "10px 14px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  >
                    <option value="">All Read Status</option>
                    <option value="true">Read</option>
                    <option value="false">Unread</option>
                  </select>
                </div>

                {/* Table */}
                <table className="jobs-table">
                  <thead>
                    <tr>
                      <th>TYPE</th>
                      <th>TITLE</th>
                      <th>USER</th>
                      <th>PUSHED</th>
                      <th>READ</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "30px" }}>
                          No notifications found
                        </td>
                      </tr>
                    ) : (
                      notifications.map((n) => (
                        <tr key={n.id}>
                          <td>
                            <span style={{
                              padding: "3px 10px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              letterSpacing: "0.5px",
                              background: `${TYPE_COLORS[n.type] || "#666"}22`,
                              color: TYPE_COLORS[n.type] || "#666",
                              whiteSpace: "nowrap",
                            }}>
                              {n.type}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: "500", fontSize: "13px" }}>{n.title}</div>
                            {n.body && (
                              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                                {n.body.length > 60 ? n.body.slice(0, 60) + "..." : n.body}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: "13px" }}>{n.user.displayName || n.user.name || n.user.email}</div>
                          </td>
                          <td>
                            <span style={{
                              display: "inline-block",
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: n.pushed ? "#10B981" : "rgba(255,255,255,0.2)",
                              marginRight: "6px",
                            }} />
                            <span style={{ fontSize: "12px", color: n.pushed ? "#10B981" : "rgba(255,255,255,0.4)" }}>
                              {n.pushed ? "Yes" : "No"}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              display: "inline-block",
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: n.read ? "#3B82F6" : "rgba(255,255,255,0.2)",
                              marginRight: "6px",
                            }} />
                            <span style={{ fontSize: "12px", color: n.read ? "#3B82F6" : "rgba(255,255,255,0.4)" }}>
                              {n.read ? "Yes" : "No"}
                            </span>
                          </td>
                          <td style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
                            {new Date(n.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "20px",
                    padding: "10px 0",
                  }}>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                      Showing {(page - 1) * 30 + 1}-{Math.min(page * 30, pagination.total)} of {pagination.total}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        style={{
                          padding: "6px 14px",
                          background: page > 1 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: page > 1 ? "#fff" : "rgba(255,255,255,0.3)",
                          fontSize: "13px",
                          cursor: page > 1 ? "pointer" : "default",
                        }}
                      >
                        Previous
                      </button>
                      <span style={{
                        padding: "6px 14px",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.6)",
                      }}>
                        Page {page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(pagination!.totalPages, p + 1))}
                        disabled={page >= pagination.totalPages}
                        style={{
                          padding: "6px 14px",
                          background: page < pagination.totalPages ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: page < pagination.totalPages ? "#fff" : "rgba(255,255,255,0.3)",
                          fontSize: "13px",
                          cursor: page < pagination.totalPages ? "pointer" : "default",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Broadcast Log Tab */}
            {activeTab === "broadcasts" && (
              <div className="section" style={{ marginTop: "0", borderTop: "none" }}>
                <table className="jobs-table">
                  <thead>
                    <tr>
                      <th>TITLE</th>
                      <th>AUDIENCE</th>
                      <th>RECIPIENTS</th>
                      <th>SUCCESS</th>
                      <th>FAILED</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {broadcastLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "30px" }}>
                          No broadcasts sent yet
                        </td>
                      </tr>
                    ) : (
                      broadcastLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <div style={{ fontWeight: "500", fontSize: "13px" }}>{log.title}</div>
                            {log.body && (
                              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                                {log.body.length > 50 ? log.body.slice(0, 50) + "..." : log.body}
                              </div>
                            )}
                          </td>
                          <td>
                            <span style={{
                              padding: "3px 10px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              background: "rgba(255,107,53,0.15)",
                              color: "#FF6B35",
                            }}>
                              {log.targetAudience.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "14px" }}>
                            {log.totalRecipients}
                          </td>
                          <td style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "14px", color: "#10B981" }}>
                            {log.successCount}
                          </td>
                          <td style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "14px", color: log.failureCount > 0 ? "#EF4444" : "rgba(255,255,255,0.4)" }}>
                            {log.failureCount}
                          </td>
                          <td style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Game Notifications Tab */}
            {activeTab === "games" && (
              <div className="section" style={{ marginTop: "0", borderTop: "none" }}>
                <table className="jobs-table">
                  <thead>
                    <tr>
                      <th>GAME</th>
                      <th>TRANSITION</th>
                      <th>SCORE</th>
                      <th>USERS NOTIFIED</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "30px" }}>
                          No game notifications sent yet
                        </td>
                      </tr>
                    ) : (
                      gameLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <div style={{ fontWeight: "500", fontSize: "13px" }}>
                              {log.game.awayTeam.abbreviation} @ {log.game.homeTeam.abbreviation}
                            </div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                              {log.game.awayTeam.name} vs {log.game.homeTeam.name}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: "3px 10px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              background: log.status === "LIVE" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                              color: log.status === "LIVE" ? "#22C55E" : "#EF4444",
                            }}>
                              {log.status}
                            </span>
                          </td>
                          <td style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "14px" }}>
                            {log.game.homeScore != null ? `${log.game.awayScore} - ${log.game.homeScore}` : "-"}
                          </td>
                          <td style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "14px" }}>
                            {log.userCount}
                          </td>
                          <td style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
                            {new Date(log.sentAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
