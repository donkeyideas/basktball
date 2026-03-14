"use client";

import { useState, useEffect, useCallback } from "react";

interface Post {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
  status: string;
  publishedAt: string | null;
  externalId: string | null;
  createdAt: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter / X",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
};

export default function PublishedTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/social/posts?status=PUBLISHED&page=${page}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
        setTotal(data.total);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Count by platform
  const platformCounts: Record<string, number> = {};
  posts.forEach((p) => {
    platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
  });

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)" }}>Loading...</div>;
  }

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="value" style={{ fontFamily: "'Roboto Mono', monospace" }}>{total}</div>
          <div className="label">Total Published</div>
        </div>
        {Object.entries(PLATFORM_LABELS).map(([id, label]) => (
          <div className="stat-card" key={id}>
            <div className="value" style={{ fontFamily: "'Roboto Mono', monospace" }}>
              {platformCounts[id] || 0}
            </div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
          No published posts yet.
        </div>
      ) : (
        <table className="jobs-table">
          <thead>
            <tr>
              <th>Content</th>
              <th>Platform</th>
              <th>Published</th>
              <th>External ID</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td style={{ maxWidth: "450px" }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.content.substring(0, 120)}{post.content.length > 120 ? "..." : ""}
                  </div>
                </td>
                <td>
                  <span style={{ color: "var(--orange)", fontSize: "12px", fontWeight: 600 }}>
                    {PLATFORM_LABELS[post.platform] || post.platform}
                  </span>
                </td>
                <td style={{ fontSize: "12px", fontFamily: "'Roboto Mono', monospace", color: "rgba(255,255,255,0.5)" }}>
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : "—"}
                </td>
                <td style={{ fontSize: "11px", fontFamily: "'Roboto Mono', monospace", color: "rgba(255,255,255,0.3)" }}>
                  {post.externalId || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ fontSize: "13px", padding: "6px 16px" }}>
            Previous
          </button>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", alignSelf: "center" }}>
            Page {page}
          </span>
          <button className="btn btn-secondary" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} style={{ fontSize: "13px", padding: "6px 16px" }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
