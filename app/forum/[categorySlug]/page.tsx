"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components";
import ThreadCard from "@/components/forum/ThreadCard";

interface Thread {
  id: string;
  title: string;
  slug: string;
  status: string;
  isPinned: boolean;
  isHot: boolean;
  tags: string[];
  postCount: number;
  viewCount: number;
  lastPostAt?: string | null;
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
  category?: {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CategoryPage() {
  const { data: session } = useSession();
  const { categorySlug } = useParams() as { categorySlug: string };
  const [threads, setThreads] = useState<Thread[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#FF6B35");

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum/threads?categorySlug=${categorySlug}&page=${page}&sort=${sort}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        setPagination(data.pagination);
        if (data.threads?.length > 0 && data.threads[0].category) {
          setCategoryName(data.threads[0].category.name);
          setCategoryColor(data.threads[0].category.color || "#FF6B35");
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [categorySlug, page, sort]);

  useEffect(() => {
    // Also fetch category info
    fetch("/api/forum/categories")
      .then((r) => r.json())
      .then((data) => {
        const cat = (data.categories || []).find((c: { slug: string }) => c.slug === categorySlug);
        if (cat) {
          setCategoryName(cat.name);
          setCategoryColor(cat.color || "#FF6B35");
        }
      })
      .catch(() => {});
  }, [categorySlug]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "20px", fontSize: "13px" }}>
        <Link href="/forum" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Forum</Link>
        <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 8px" }}>/</span>
        <span style={{ color: categoryColor }}>{categoryName || categorySlug}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{
          fontFamily: "var(--font-anton)",
          fontSize: "32px",
          color: "#fff",
          margin: 0,
          letterSpacing: "1px",
        }}>
          {categoryName || categorySlug.replace(/-/g, " ").toUpperCase()}
        </h1>
        {session?.user && (
          <Link
            href={`/forum/new?category=${categorySlug}`}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: "#FF6B35",
              color: "#fff",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "14px",
              fontFamily: "var(--font-barlow)",
              textTransform: "uppercase",
            }}
          >
            New Thread
          </Link>
        )}
      </div>

      {/* Sort tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
        {["latest", "newest", "hot", "top"].map((s) => (
          <button
            key={s}
            onClick={() => { setSort(s); setPage(1); }}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              background: sort === s ? "#FF6B35" : "#2a2a2a",
              color: sort === s ? "#fff" : "rgba(255,255,255,0.5)",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              textTransform: "capitalize",
              fontFamily: "var(--font-barlow)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Threads */}
      {loading ? (
        <div style={{ color: "rgba(255,255,255,0.4)", padding: "40px", textAlign: "center" }}>Loading threads...</div>
      ) : threads.length === 0 ? (
        <div style={{
          background: "#1A1A1A",
          borderRadius: "8px",
          border: "1px solid #2a2a2a",
          padding: "40px",
          textAlign: "center",
        }}>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>No threads yet. Be the first to start a discussion!</p>
          {session?.user && (
            <Link
              href={`/forum/new?category=${categorySlug}`}
              style={{ color: "#FF6B35", textDecoration: "none", fontWeight: "600" }}
            >
              Create a thread
            </Link>
          )}
        </div>
      ) : (
        <>
          {threads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #333", background: "transparent", color: "#fff", cursor: page > 1 ? "pointer" : "default", opacity: page > 1 ? 1 : 0.3 }}
              >
                Prev
              </button>
              <span style={{ padding: "8px 16px", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination!.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #333", background: "transparent", color: "#fff", cursor: page < pagination.totalPages ? "pointer" : "default", opacity: page < pagination.totalPages ? 1 : 0.3 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
        </div>
      </main>
      <Footer />
    </>
  );
}
