"use client";

import { useState, useEffect, useCallback } from "react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "UNREAD" | "READ" | "REPLIED" | "ARCHIVED";
  adminNote: string | null;
  readAt: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface InboxStats {
  total: number;
  unread: number;
  read: number;
  replied: number;
  archived: number;
}

const STATUS_COLORS: Record<string, string> = {
  UNREAD: "#3B82F6",
  READ: "#6B7280",
  REPLIED: "#10B981",
  ARCHIVED: "#F59E0B",
};

const STATUS_LABELS: Record<string, string> = {
  UNREAD: "Unread",
  READ: "Read",
  REPLIED: "Replied",
  ARCHIVED: "Archived",
};

export default function AdminInboxPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<InboxStats>({ total: 0, unread: 0, read: 0, replied: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        status: statusFilter,
        search,
      });

      const res = await fetch(`/api/admin/inbox?${params}`);
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setAdminNote(msg.adminNote || "");

    // Auto-mark as read
    if (msg.status === "UNREAD") {
      try {
        await fetch(`/api/admin/inbox/${msg.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "READ" }),
        });
        fetchMessages();
      } catch { /* ignore */ }
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inbox/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedMessage(data.message);
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (!selectedMessage) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inbox/${selectedMessage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedMessage(data.message);
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await fetch(`/api/admin/inbox/${id}`, { method: "DELETE" });
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        Loading inbox...
      </div>
    );
  }

  return (
    <>
      <div className="admin-header">
        <h1>Inbox</h1>
        <p>Contact form submissions and messages</p>
      </div>

      <div className="admin-content">
        {/* Stats Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Messages</div>
          </div>
          <div className="stat-card" style={{ borderColor: stats.unread > 0 ? "#3B82F6" : undefined }}>
            <div className="stat-value" style={{ color: stats.unread > 0 ? "#3B82F6" : undefined }}>
              {stats.unread}
            </div>
            <div className="stat-label">Unread</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.read}</div>
            <div className="stat-label">Read</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "#10B981" }}>{stats.replied}</div>
            <div className="stat-label">Replied</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.archived}</div>
            <div className="stat-label">Archived</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              flex: "1",
              minWidth: "200px",
              padding: "10px 14px",
              background: "var(--border-subtle)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: "var(--white)",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              padding: "10px 14px",
              background: "var(--dark-gray)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: "var(--white)",
              fontSize: "14px",
              outline: "none",
            }}
          >
            <option value="ALL">All Status</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
            <option value="REPLIED">Replied</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Messages List */}
        <div className="section">
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-faint)" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 16px", display: "block", opacity: 0.4 }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              No messages found
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border-subtle)", borderRadius: "8px", overflow: "hidden" }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: "16px",
                    padding: "16px 20px",
                    background: msg.status === "UNREAD" ? "rgba(59, 130, 246, 0.05)" : "var(--dark-gray)",
                    cursor: "pointer",
                    alignItems: "center",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border-subtle)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = msg.status === "UNREAD" ? "rgba(59, 130, 246, 0.05)" : "var(--dark-gray)"; }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: STATUS_COLORS[msg.status] || "#6B7280",
                    flexShrink: 0,
                  }} />

                  {/* Content */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{
                        fontWeight: msg.status === "UNREAD" ? "700" : "500",
                        fontSize: "15px",
                        color: msg.status === "UNREAD" ? "var(--white)" : "var(--text-secondary)",
                      }}>
                        {msg.name}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--text-faint)" }}>
                        &lt;{msg.email}&gt;
                      </span>
                      <span style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: `${STATUS_COLORS[msg.status]}20`,
                        color: STATUS_COLORS[msg.status],
                        fontWeight: "600",
                      }}>
                        {STATUS_LABELS[msg.status]}
                      </span>
                    </div>
                    <div style={{
                      fontWeight: msg.status === "UNREAD" ? "600" : "400",
                      fontSize: "14px",
                      color: msg.status === "UNREAD" ? "var(--white)" : "var(--text-secondary)",
                      marginBottom: "2px",
                    }}>
                      {msg.subject}
                    </div>
                    <div style={{
                      fontSize: "13px",
                      color: "var(--text-faint)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {msg.message.slice(0, 120)}
                    </div>
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: "13px", color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                    {formatDate(msg.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              marginTop: "20px",
            }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: "6px 12px",
                  background: page === 1 ? "var(--border-subtle)" : "var(--border-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: page === 1 ? "var(--text-faint)" : "#fff",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  fontSize: "13px",
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "6px 12px",
                  background: page === totalPages ? "var(--border-subtle)" : "var(--border-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: page === totalPages ? "var(--text-faint)" : "#fff",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  fontSize: "13px",
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedMessage(null); }}
          onKeyDown={(e) => { if (e.key === "Escape") setSelectedMessage(null); }}
        >
          <div style={{
            background: "var(--dark-gray)",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            maxWidth: "700px",
            width: "100%",
            maxHeight: "85vh",
            overflow: "auto",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: "700" }}>{selectedMessage.subject}</h2>
                  <span style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: `${STATUS_COLORS[selectedMessage.status]}20`,
                    color: STATUS_COLORS[selectedMessage.status],
                    fontWeight: "600",
                  }}>
                    {STATUS_LABELS[selectedMessage.status]}
                  </span>
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  From: <span style={{ color: "var(--white)" }}>{selectedMessage.name}</span> &lt;{selectedMessage.email}&gt;
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-faint)", marginTop: "4px" }}>
                  {new Date(selectedMessage.createdAt).toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "24px",
                  lineHeight: "1",
                  padding: "4px",
                }}
              >
                &times;
              </button>
            </div>

            {/* Message Body */}
            <div style={{
              padding: "24px",
              borderBottom: "1px solid var(--border-color)",
              whiteSpace: "pre-wrap",
              lineHeight: "1.7",
              fontSize: "15px",
              color: "var(--text-secondary)",
            }}>
              {selectedMessage.message}
            </div>

            {/* Status Actions */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              alignItems: "center",
            }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", marginRight: "8px" }}>
                Mark as:
              </span>
              {(["UNREAD", "READ", "REPLIED", "ARCHIVED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(selectedMessage.id, s)}
                  disabled={saving || selectedMessage.status === s}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: selectedMessage.status === s
                      ? `1px solid ${STATUS_COLORS[s]}`
                      : "1px solid var(--border-color)",
                    background: selectedMessage.status === s
                      ? `${STATUS_COLORS[s]}20`
                      : "var(--border-subtle)",
                    color: selectedMessage.status === s
                      ? STATUS_COLORS[s]
                      : "var(--text-secondary)",
                    cursor: selectedMessage.status === s ? "default" : "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Admin Note */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>
                Admin Note
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add internal notes about this message..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--border-subtle)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "var(--white)",
                  fontSize: "14px",
                  outline: "none",
                  resize: "vertical",
                  marginBottom: "10px",
                }}
              />
              <button
                onClick={saveNote}
                disabled={saving}
                style={{
                  padding: "8px 20px",
                  background: "var(--orange)",
                  color: "var(--white)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {saving ? "Saving..." : "Save Note"}
              </button>
            </div>

            {/* Reply via Email & Delete */}
            <div style={{
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                onClick={() => updateStatus(selectedMessage.id, "REPLIED")}
                style={{
                  padding: "10px 20px",
                  background: "#10B981",
                  color: "var(--white)",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Reply via Email
              </a>
              <button
                onClick={() => deleteMessage(selectedMessage.id)}
                style={{
                  padding: "10px 20px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#EF4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
