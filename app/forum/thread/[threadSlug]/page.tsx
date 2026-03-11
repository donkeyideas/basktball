"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components";
import PostCard from "@/components/forum/PostCard";
import PostEditor from "@/components/forum/PostEditor";

interface Post {
  id: string;
  content: string;
  postNumber: number;
  isEdited: boolean;
  editedAt?: string | null;
  likeCount: number;
  dislikeCount: number;
  replyToId?: string | null;
  createdAt: string;
  author: {
    id: string;
    displayName?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
    image?: string | null;
    role: string;
    reputation?: number;
    postCount?: number;
    favoriteTeamId?: string | null;
    createdAt?: string;
  };
  reactions: { id: string; userId: string; type: string }[];
}

interface Thread {
  id: string;
  title: string;
  slug: string;
  status: string;
  isPinned: boolean;
  tags: string[];
  postCount: number;
  viewCount: number;
  createdAt: string;
  author: {
    id: string;
    displayName?: string | null;
    name?: string | null;
    role: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
  };
}

export default function ThreadPage() {
  const { data: session } = useSession();
  const { threadSlug } = useParams() as { threadSlug: string };
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchThread = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum/threads/by-slug/${threadSlug}?page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setThread(data.thread);
        setPosts(data.posts || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [threadSlug, page]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  async function handlePostReply(content: string) {
    if (!thread) return;
    const res = await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, threadId: thread.id, replyToId }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to post");
    }

    setReplyToId(null);
    fetchThread();
  }

  async function handleSummarize() {
    if (!thread || summaryLoading) return;
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/forum/threads/${thread.id}/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to generate summary");
      }
    } catch {
      alert("Failed to generate summary");
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading && !thread) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", padding: "40px", textAlign: "center" }}>Loading thread...</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!thread) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", padding: "40px", textAlign: "center" }}>Thread not found</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "20px", fontSize: "13px" }}>
        <Link href="/forum" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Forum</Link>
        <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 8px" }}>/</span>
        <Link href={`/forum/${thread.category.slug}`} style={{ color: thread.category.color || "rgba(255,255,255,0.4)", textDecoration: "none" }}>
          {thread.category.name}
        </Link>
        <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 8px" }}>/</span>
        <span style={{ color: "rgba(255,255,255,0.6)" }}>{thread.title.slice(0, 50)}</span>
      </div>

      {/* Thread header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
          {thread.isPinned && (
            <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", background: "rgba(255,107,53,0.2)", color: "#FF6B35" }}>PINNED</span>
          )}
          {thread.status === "LOCKED" && (
            <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", background: "rgba(107,114,128,0.2)", color: "#6B7280" }}>LOCKED</span>
          )}
          {thread.tags?.map((tag) => (
            <span key={tag} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: "#2a2a2a", color: "rgba(255,255,255,0.5)" }}>
              {tag}
            </span>
          ))}
        </div>

        <h1 style={{
          fontFamily: "var(--font-anton)",
          fontSize: "28px",
          color: "#fff",
          margin: "0 0 8px 0",
          letterSpacing: "0.5px",
          lineHeight: "1.2",
        }}>
          {thread.title}
        </h1>

        <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
          <span>{thread.postCount} posts</span>
          <span>{thread.viewCount} views</span>
        </div>
      </div>

      {/* AI Summary */}
      {thread.postCount >= 10 && session?.user && (
        <div style={{ marginBottom: "16px" }}>
          {summary ? (
            <div style={{
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: "8px",
              padding: "16px",
            }}>
              <div style={{ fontWeight: "700", color: "#8B5CF6", marginBottom: "8px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
                AI Thread Summary
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.6" }}>{summary}</div>
            </div>
          ) : (
            <button
              onClick={handleSummarize}
              disabled={summaryLoading}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #333",
                background: "transparent",
                color: "#8B5CF6",
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: "var(--font-barlow)",
              }}
            >
              {summaryLoading ? "Generating summary..." : "Summarize this thread"}
            </button>
          )}
        </div>
      )}

      {/* Posts */}
      <div style={{ marginBottom: "20px" }}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onReply={thread.status === "OPEN" ? (postId: string) => setReplyToId(postId) : undefined}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #333", background: "transparent", color: "#fff", cursor: page > 1 ? "pointer" : "default", opacity: page > 1 ? 1 : 0.3 }}
          >
            Prev
          </button>
          <span style={{ padding: "8px 16px", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #333", background: "transparent", color: "#fff", cursor: page < totalPages ? "pointer" : "default", opacity: page < totalPages ? 1 : 0.3 }}
          >
            Next
          </button>
        </div>
      )}

      {/* Reply editor */}
      {session?.user && thread.status === "OPEN" && (
        <PostEditor
          onSubmit={handlePostReply}
          replyToId={replyToId}
          onCancelReply={() => setReplyToId(null)}
        />
      )}

      {!session?.user && (
        <div style={{
          background: "#1A1A1A",
          borderRadius: "8px",
          border: "1px solid #2a2a2a",
          padding: "24px",
          textAlign: "center",
        }}>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>Sign in to join the discussion</p>
          <Link href="/login" style={{ color: "#FF6B35", textDecoration: "none", fontWeight: "600" }}>
            Sign In
          </Link>
        </div>
      )}
        </div>
      </main>
      <Footer />
    </>
  );
}
