"use client";

import { useState, useEffect, useCallback } from "react";

interface Post {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
  status: string;
  tone: string | null;
  topic: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter / X",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
};

export default function QueueTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [publishing, setPublishing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (filterPlatform) params.set("platform", filterPlatform);
      if (filterStatus) params.set("status", filterStatus);
      else {
        // Default: show DRAFT and SCHEDULED only
        // We'll fetch both by not filtering (API returns all) and filter client-side
      }

      const res = await fetch(`/api/admin/social/posts?${params}`);
      const data = await res.json();
      if (data.success) {
        // Filter to DRAFT + SCHEDULED if no specific status filter
        const filtered = filterStatus
          ? data.posts
          : data.posts.filter((p: Post) => p.status === "DRAFT" || p.status === "SCHEDULED");
        setPosts(filtered);
        setTotal(data.total);
      }
    } catch {
      setMessage({ text: "Failed to fetch posts", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [page, filterPlatform, filterStatus]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handlePublish(postId: string) {
    setPublishing(postId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Post published successfully!", type: "success" });
        fetchPosts();
      } else {
        setMessage({ text: data.error || "Publish failed", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to publish post", type: "error" });
    } finally {
      setPublishing(null);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/admin/social/posts/${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
      } else {
        setMessage({ text: data.error || "Delete failed", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to delete post", type: "error" });
    }
  }

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)" }}>Loading queue...</div>;
  }

  return (
    <div>
      {message && (
        <div
          style={{
            background: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: message.type === "success" ? "var(--green)" : "var(--red)",
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <select
          value={filterPlatform}
          onChange={(e) => { setFilterPlatform(e.target.value); setPage(1); }}
          style={{
            padding: "8px 12px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            color: "white",
            fontSize: "13px",
          }}
        >
          <option value="">All Platforms</option>
          {Object.entries(PLATFORM_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          style={{
            padding: "8px 12px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            color: "white",
            fontSize: "13px",
          }}
        >
          <option value="">Draft & Scheduled</option>
          <option value="DRAFT">Draft Only</option>
          <option value="SCHEDULED">Scheduled Only</option>
        </select>

        <button className="btn btn-secondary" onClick={fetchPosts} style={{ fontSize: "13px", padding: "8px 16px" }}>
          Refresh
        </button>
      </div>

      {/* Posts Table */}
      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
          No posts in queue. Use the Generator tab to create content.
        </div>
      ) : (
        <table className="jobs-table">
          <thead>
            <tr>
              <th>Content</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td style={{ maxWidth: "400px" }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.content.substring(0, 100)}{post.content.length > 100 ? "..." : ""}
                  </div>
                  {post.topic && (
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
                      Topic: {post.topic}
                    </div>
                  )}
                </td>
                <td>
                  <span style={{ color: "var(--orange)", fontSize: "12px", fontWeight: 600 }}>
                    {PLATFORM_LABELS[post.platform] || post.platform}
                  </span>
                </td>
                <td>
                  <span className={`job-status ${post.status === "DRAFT" ? "paused" : "running"}`}>
                    {post.status}
                  </span>
                </td>
                <td style={{ fontSize: "12px", fontFamily: "'Roboto Mono', monospace", color: "rgba(255,255,255,0.5)" }}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handlePublish(post.id)}
                      disabled={publishing === post.id}
                      style={{ fontSize: "11px", padding: "4px 12px" }}
                    >
                      {publishing === post.id ? "..." : "Publish"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDelete(post.id)}
                      style={{ fontSize: "11px", padding: "4px 12px", color: "var(--red)" }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
          <button
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ fontSize: "13px", padding: "6px 16px" }}
          >
            Previous
          </button>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", alignSelf: "center" }}>
            Page {page}
          </span>
          <button
            className="btn btn-secondary"
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            style={{ fontSize: "13px", padding: "6px 16px" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
