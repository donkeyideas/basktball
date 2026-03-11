"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components";
import PostEditor from "@/components/forum/PostEditor";

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
}

export default function NewThreadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCategory = searchParams.get("category");

  const [title, setTitle] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/forum/categories")
      .then((r) => r.json())
      .then((data) => {
        const cats = data.categories || [];
        setCategories(cats);
        if (preselectedCategory) {
          const found = cats.find((c: Category) => c.slug === preselectedCategory);
          if (found) setSelectedCategoryId(found.id);
        }
      })
      .catch(() => {});
  }, [preselectedCategory]);

  if (status === "loading") {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!session?.user) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
            <h1 style={{ fontFamily: "var(--font-anton)", color: "#FF6B35", fontSize: "28px", marginBottom: "16px" }}>SIGN IN REQUIRED</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>You need to be signed in to create a thread.</p>
            <Link href="/login" style={{ color: "#FF6B35", textDecoration: "none", fontWeight: "600" }}>Sign In</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  async function handleSubmit(content: string) {
    if (!title.trim() || !selectedCategoryId) {
      setError("Title and category are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          categoryId: selectedCategoryId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/forum/thread/${data.thread.slug}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create thread");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "20px", fontSize: "13px" }}>
        <Link href="/forum" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Forum</Link>
        <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 8px" }}>/</span>
        <span style={{ color: "rgba(255,255,255,0.6)" }}>New Thread</span>
      </div>

      <h1 style={{
        fontFamily: "var(--font-anton)",
        fontSize: "28px",
        color: "#FF6B35",
        margin: "0 0 24px 0",
        letterSpacing: "1px",
      }}>
        CREATE NEW THREAD
      </h1>

      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "8px",
          padding: "10px 14px",
          marginBottom: "16px",
          color: "#EF4444",
          fontSize: "14px",
        }}>
          {error}
        </div>
      )}

      {/* Category selector */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", fontFamily: "var(--font-barlow)" }}>
          Category *
        </label>
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #333",
            background: "#0D0D0D",
            color: "#fff",
            fontSize: "15px",
            fontFamily: "var(--font-barlow)",
            outline: "none",
          }}
        >
          <option value="">Select a category...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "6px", fontFamily: "var(--font-barlow)" }}>
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="What's your topic?"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #333",
            background: "#0D0D0D",
            color: "#fff",
            fontSize: "15px",
            fontFamily: "var(--font-barlow)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Content */}
      <PostEditor
        onSubmit={handleSubmit}
        placeholder="Write your thread content..."
        submitLabel={loading ? "Creating..." : "Create Thread"}
      />
        </div>
      </main>
      <Footer />
    </>
  );
}
