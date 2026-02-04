"use client";

import { useState, useEffect } from "react";

interface ContentItem {
  id: string;
  title: string;
  type: string;
  content: string;
  approved: boolean;
  generatedAt: string;
  player?: { name: string };
  game?: {
    homeTeam: { abbreviation: string };
    awayTeam: { abbreviation: string };
  };
}

export default function AdminContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  async function fetchContent() {
    try {
      const res = await fetch("/api/admin/content");
      const data = await res.json();
      if (data.success) {
        setContent(data.content || []);
        setError(null);
      } else {
        setError(data.error || "Failed to load content");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchContent();
  }, []);

  const filteredContent = content.filter(item => {
    if (filter === "pending") return !item.approved;
    if (filter === "approved") return item.approved;
    return true;
  });

  async function approveContent(id: string) {
    try {
      await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      await fetchContent();
    } catch {
      // Silent fail
    }
  }

  async function deleteContent(id: string) {
    if (!confirm("Are you sure you want to delete this content?")) return;
    try {
      await fetch(`/api/admin/content?id=${id}`, { method: "DELETE" });
      await fetchContent();
    } catch {
      // Silent fail
    }
  }

  return (
    <>
      <div className="admin-header">
        <h1>AI-GENERATED CONTENT</h1>
        <button className="btn btn-primary" onClick={fetchContent}>
          Refresh
        </button>
      </div>

      <div className="admin-content">
        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
          {[
            { id: "all" as const, label: "All Content" },
            { id: "pending" as const, label: "Pending Review" },
            { id: "approved" as const, label: "Approved" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: "10px 20px",
                background: filter === tab.id ? "var(--orange)" : "var(--dark-gray)",
                border: "2px solid",
                borderColor: filter === tab.id ? "var(--orange)" : "rgba(255,255,255,0.1)",
                color: "var(--white)",
                cursor: "pointer"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading content...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="section">
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>No content available.</p>
            </div>
          </div>
        ) : (
          <div className="section">
            <div className="section-title">
              {filter === "all" ? "All Content" : filter === "pending" ? "Pending Review" : "Approved Content"}
              {" "}({filteredContent.length})
            </div>
            {filteredContent.map(item => (
              <div key={item.id} className="content-item">
                <h4>{item.title || `${item.type} Content`}</h4>
                <div className="content-meta">
                  <span>Type: {item.type}</span>
                  <span>Generated: {new Date(item.generatedAt).toLocaleString()}</span>
                  {item.player && <span>Player: {item.player.name}</span>}
                  {item.game && (
                    <span>
                      Game: {item.game.homeTeam.abbreviation} vs {item.game.awayTeam.abbreviation}
                    </span>
                  )}
                  <span style={{
                    color: item.approved ? "var(--green)" : "var(--yellow)"
                  }}>
                    Status: {item.approved ? "Approved" : "Pending"}
                  </span>
                </div>
                <div className="content-preview">
                  {item.content?.slice(0, 300)}...
                </div>
                <div className="content-actions">
                  {!item.approved && (
                    <button className="primary" onClick={() => approveContent(item.id)}>
                      Approve
                    </button>
                  )}
                  <button onClick={() => deleteContent(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
