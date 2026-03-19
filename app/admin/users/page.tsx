"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UserModal } from "@/components/admin/UserModal";

interface User {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  image: string | null;
  role: string;
  status: string;
  postCount: number;
  threadCount: number;
  reputation: number;
  lastActiveAt: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  new7d: number;
  active7d: number;
  bannedSuspended: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SignupDay {
  date: string;
  count: number;
}

interface RoleDist {
  role: string;
  count: number;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#EF4444",
  EDITOR: "#FF6B35",
  MODERATOR: "#3B82F6",
  PREMIUM: "#F59E0B",
  USER: "#6B7280",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#10B981",
  SUSPENDED: "#F59E0B",
  BANNED: "#EF4444",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [signupsByDay, setSignupsByDay] = useState<SignupDay[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDist[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("sort", sort);
      params.set("order", order);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setStats(data.stats);
        setSignupsByDay(data.signupsByDay || []);
        setRoleDistribution(data.roleDistribution || []);
        setPagination(data.pagination);
        setError(null);
      } else {
        setError(data.error || "Failed to load users");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, sort, order, page]);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  function handleSort(field: string) {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("desc");
    }
    setPage(1);
  }

  const sortArrow = (field: string) => {
    if (sort !== field) return "";
    return order === "asc" ? " \u25B2" : " \u25BC";
  };

  // Chart helpers
  const maxSignups = Math.max(...signupsByDay.map((d) => d.count), 1);
  const maxRoleCount = Math.max(...roleDistribution.map((r) => r.count), 1);

  const statCards = [
    {
      label: "Total Users",
      value: stats?.total ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "New Users (7d)",
      value: stats?.new7d ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
    },
    {
      label: "Active (7d)",
      value: stats?.active7d ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: "Banned / Suspended",
      value: stats?.bannedSuspended ?? "-",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <UserModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onUpdate={fetchUsers}
      />

      <div className="admin-header">
        <h1>USER MANAGEMENT</h1>
        <button className="btn btn-primary" onClick={fetchUsers}>
          Refresh
        </button>
      </div>

      <div className="admin-content">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading users...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
            <button className="btn btn-primary" onClick={fetchUsers} style={{ marginTop: "20px" }}>
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
                  <div className="value">{stat.value}</div>
                  <div className="label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
              {/* Signups Chart */}
              <div className="section">
                <div className="section-title">User Signups (14 Days)</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "160px", padding: "0 8px" }}>
                  {signupsByDay.map((day) => (
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
                          height: `${Math.max((day.count / maxSignups) * 120, day.count > 0 ? 4 : 0)}px`,
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

              {/* Role Distribution */}
              <div className="section">
                <div className="section-title">Users by Role</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {roleDistribution.map((r) => (
                    <div key={r.role} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "90px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: ROLE_COLORS[r.role] || "#fff",
                      }}>
                        {r.role}
                      </div>
                      <div style={{ flex: 1, height: "24px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{
                          width: `${(r.count / maxRoleCount) * 100}%`,
                          height: "100%",
                          background: ROLE_COLORS[r.role] || "#FF6B35",
                          borderRadius: "4px",
                          transition: "width 0.3s",
                          minWidth: r.count > 0 ? "4px" : "0",
                        }} />
                      </div>
                      <div style={{
                        width: "40px",
                        textAlign: "right",
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "var(--white, #fff)",
                      }}>
                        {r.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User Table */}
            <div className="section">
              <div className="section-title">All Users</div>

              {/* Filters */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  style={{
                    flex: 1,
                    minWidth: "200px",
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "var(--font-inter), sans-serif",
                  }}
                />
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                  style={{
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="">All Roles</option>
                  {["USER", "PREMIUM", "MODERATOR", "EDITOR", "ADMIN"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  style={{
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="">All Status</option>
                  {["ACTIVE", "SUSPENDED", "BANNED"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                      USER{sortArrow("name")}
                    </th>
                    <th onClick={() => handleSort("role")} style={{ cursor: "pointer" }}>
                      ROLE{sortArrow("role")}
                    </th>
                    <th onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                      STATUS{sortArrow("status")}
                    </th>
                    <th onClick={() => handleSort("postCount")} style={{ cursor: "pointer" }}>
                      POSTS{sortArrow("postCount")}
                    </th>
                    <th onClick={() => handleSort("threadCount")} style={{ cursor: "pointer" }}>
                      THREADS{sortArrow("threadCount")}
                    </th>
                    <th onClick={() => handleSort("reputation")} style={{ cursor: "pointer" }}>
                      REP{sortArrow("reputation")}
                    </th>
                    <th onClick={() => handleSort("createdAt")} style={{ cursor: "pointer" }}>
                      JOINED{sortArrow("createdAt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "30px" }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const displayName = user.displayName || user.name || user.email;
                      const initial = displayName[0]?.toUpperCase() || "?";
                      return (
                        <tr
                          key={user.id}
                          onClick={() => setSelectedUserId(user.id)}
                          style={{ cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,53,0.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                        >
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: ROLE_COLORS[user.role] || "#FF6B35",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "13px",
                                fontWeight: "bold",
                                color: "#fff",
                                flexShrink: 0,
                              }}>
                                {initial}
                              </div>
                              <div>
                                <div style={{ fontWeight: "600", fontSize: "14px" }}>{displayName}</div>
                                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: "3px 10px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              letterSpacing: "0.5px",
                              background: `${ROLE_COLORS[user.role]}22`,
                              color: ROLE_COLORS[user.role],
                            }}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding: "3px 10px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              letterSpacing: "0.5px",
                              background: `${STATUS_COLORS[user.status]}22`,
                              color: STATUS_COLORS[user.status],
                            }}>
                              {user.status}
                            </span>
                          </td>
                          <td style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "14px" }}>
                            {user.postCount}
                          </td>
                          <td style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "14px" }}>
                            {user.threadCount}
                          </td>
                          <td style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "14px" }}>
                            {user.reputation}
                          </td>
                          <td style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
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
                    Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, pagination.total)} of {pagination.total} users
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
          </>
        )}
      </div>
    </>
  );
}
