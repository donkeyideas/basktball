"use client";

import { useState, useEffect, useCallback } from "react";

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  image: string | null;
  role: string;
  status: string;
  location: string | null;
  favoriteTeamId: string | null;
  takeCount: number;
  followerCount: number;
  followingCount: number;
  reputation: number;
  banReason: string | null;
  bannedUntil: string | null;
  bannedBy: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
  takes: {
    id: string;
    content: string;
    createdAt: string;
    fireCount: number;
    brickCount: number;
    replyCount: number;
  }[];
}

interface UserModalProps {
  userId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "var(--red)",
  EDITOR: "var(--orange)",
  MODERATOR: "var(--blue, #3B82F6)",
  PREMIUM: "var(--yellow)",
  USER: "var(--text-muted)",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "var(--green)",
  SUSPENDED: "var(--yellow)",
  BANNED: "var(--red)",
};

export function UserModal({ userId, onClose, onUpdate }: UserModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("");
  const [banReason, setBanReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (userId) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      fetchUser();
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, handleKeyDown]);

  async function fetchUser() {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setSelectedRole(data.user.role);
        setBanReason(data.user.banReason || "");
      }
    } catch {
      // Failed to fetch
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange() {
    if (!user || selectedRole === user.role) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Role updated to ${selectedRole}`, type: "success" });
        setUser((prev) => prev ? { ...prev, role: selectedRole } : prev);
        onUpdate();
      } else {
        setMessage({ text: data.error || "Failed to update role", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to update role", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          banReason: newStatus !== "ACTIVE" ? banReason : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `User status changed to ${newStatus}`, type: "success" });
        setUser((prev) => prev ? { ...prev, status: newStatus } : prev);
        onUpdate();
      } else {
        setMessage({ text: data.error || "Failed to update status", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to update status", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!user || !newPassword) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetPassword", newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Password has been reset", type: "success" });
        setNewPassword("");
      } else {
        setMessage({ text: data.error || "Failed to reset password", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to reset password", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (!userId) return null;

  const displayName = user?.displayName || user?.name || user?.email || "User";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--dark-gray, var(--dark-gray))",
          border: "2px solid var(--orange, #FF6B35)",
          maxWidth: "680px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          clipPath: "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)",
          animation: "slideInUp 0.3s ease-out",
        }}
      >
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading user data...
          </div>
        ) : !user ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--red)" }}>
            User not found
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: "24px 32px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: ROLE_COLORS[user.role] || "var(--orange)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-anton), sans-serif",
                fontSize: "20px",
                color: "var(--white)",
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontFamily: "var(--font-anton), sans-serif",
                  fontSize: "24px",
                  color: "var(--white, #fff)",
                  margin: 0,
                }}>
                  {displayName}
                </h2>
                <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>{user.email}</div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <span style={{
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  background: `${ROLE_COLORS[user.role]}22`,
                  color: ROLE_COLORS[user.role],
                }}>
                  {user.role}
                </span>
                <span style={{
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  background: `${STATUS_COLORS[user.status]}22`,
                  color: STATUS_COLORS[user.status],
                }}>
                  {user.status}
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Stats Row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "1px",
              background: "var(--border-subtle)",
              borderBottom: "1px solid var(--border-color)",
            }}>
              {[
                { label: "Takes", value: user.takeCount },
                { label: "Followers", value: user.followerCount },
                { label: "Following", value: user.followingCount },
                { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString() },
                { label: "Last Active", value: user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : "Never" },
              ].map((stat) => (
                <div key={stat.label} style={{
                  background: "var(--dark-gray, var(--dark-gray))",
                  padding: "14px 16px",
                  textAlign: "center",
                }}>
                  <div style={{
                    fontFamily: "var(--font-roboto-mono), monospace",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "var(--white, #fff)",
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Message */}
            {message && (
              <div style={{
                margin: "16px 32px 0",
                padding: "10px 14px",
                background: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                color: message.type === "success" ? "var(--green)" : "var(--red)",
                fontSize: "13px",
              }}>
                {message.text}
              </div>
            )}

            {/* Actions */}
            <div style={{ padding: "24px 32px" }}>
              {/* Change Role */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "bold" }}>
                  Change Role
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border-color)",
                      color: "var(--white)",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  >
                    {["USER", "PREMIUM", "MODERATOR", "EDITOR", "ADMIN"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleRoleChange}
                    disabled={saving || selectedRole === user.role}
                    style={{
                      padding: "8px 20px",
                      background: selectedRole !== user.role ? "var(--orange, #FF6B35)" : "var(--border-color)",
                      border: "none",
                      color: "var(--white)",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: selectedRole !== user.role ? "pointer" : "default",
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Change Status */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "bold" }}>
                  Account Status
                </label>
                {(user.status === "BANNED" || user.status === "SUSPENDED") && (
                  <div style={{ marginBottom: "8px" }}>
                    <input
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Ban/suspension reason..."
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid var(--border-color)",
                        color: "var(--white)",
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleStatusChange("ACTIVE")}
                    disabled={saving || user.status === "ACTIVE"}
                    style={{
                      padding: "8px 16px",
                      background: user.status !== "ACTIVE" ? "var(--green, #10B981)" : "rgba(16,185,129,0.2)",
                      border: "none",
                      color: "var(--white)",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: user.status !== "ACTIVE" ? "pointer" : "default",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ACTIVATE
                  </button>
                  <button
                    onClick={() => handleStatusChange("SUSPENDED")}
                    disabled={saving || user.status === "SUSPENDED"}
                    style={{
                      padding: "8px 16px",
                      background: user.status !== "SUSPENDED" ? "var(--yellow, #F59E0B)" : "rgba(245,158,11,0.2)",
                      border: "none",
                      color: "var(--white)",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: user.status !== "SUSPENDED" ? "pointer" : "default",
                      letterSpacing: "0.5px",
                    }}
                  >
                    SUSPEND
                  </button>
                  <button
                    onClick={() => handleStatusChange("BANNED")}
                    disabled={saving || user.status === "BANNED"}
                    style={{
                      padding: "8px 16px",
                      background: user.status !== "BANNED" ? "var(--red, #EF4444)" : "rgba(239,68,68,0.2)",
                      border: "none",
                      color: "var(--white)",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: user.status !== "BANNED" ? "pointer" : "default",
                      letterSpacing: "0.5px",
                    }}
                  >
                    BAN
                  </button>
                </div>
              </div>

              {/* Reset Password */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "bold" }}>
                  Reset Password
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border-color)",
                      color: "var(--white)",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handlePasswordReset}
                    disabled={saving || newPassword.length < 8}
                    style={{
                      padding: "8px 20px",
                      background: newPassword.length >= 8 ? "var(--orange, #FF6B35)" : "var(--border-color)",
                      border: "none",
                      color: "var(--white)",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: newPassword.length >= 8 ? "pointer" : "default",
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Recent Takes */}
              {user.takes.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "bold" }}>
                    Recent Takes
                  </label>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {user.takes.map((t) => (
                      <div key={t.id} style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--border-subtle)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ color: "var(--orange)", fontSize: "10px", fontWeight: "bold", marginRight: "8px" }}>TAKE</span>
                          <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                            {t.content.slice(0, 80)}{t.content.length > 80 ? "..." : ""}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                          <span style={{ color: "var(--orange)", fontSize: "11px" }}>{t.fireCount}F</span>
                          <span style={{ color: "var(--red)", fontSize: "11px" }}>{t.brickCount}B</span>
                          <span style={{ color: "var(--text-faint)", fontSize: "11px" }}>
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
