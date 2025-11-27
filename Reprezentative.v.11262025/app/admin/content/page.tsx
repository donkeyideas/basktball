"use client";

import { useEffect, useRef, useState } from "react";

type HeroContent = {
  videoUrl?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
};

export default function AdminContentPage() {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadHero() {
      try {
        const res = await fetch("/api/content/hero");
        if (!res.ok) throw new Error("Failed to load content");
        const data = await res.json();
        if (!cancelled) {
          setHero((data?.data as HeroContent) ?? {});
        }
      } catch {
        if (!cancelled) {
          setStatus("Failed to load hero content. Ensure the content API is implemented.");
        }
      }
    }
    loadHero();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleSave = (next: HeroContent) => {
    setHero(next);
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      setStatus(null);
      try {
        const res = await fetch("/api/content/hero", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: next }),
        });
        if (!res.ok) throw new Error();
        setStatus("Saved.");
        // Refresh preview
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.location.reload();
        }
      } catch {
        setStatus("Error saving hero content.");
      } finally {
        setSaving(false);
      }
    }, 500);
  };

  const handleChange = (field: keyof HeroContent, value: string) => {
    const current = hero ?? {};
    const next = { ...current, [field]: value };
    scheduleSave(next);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-800 bg-zinc-900/70 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Content Manager
            </h1>
            <p className="mt-1 text-xs text-neutral-400">
              Edit homepage hero content with a live preview.
            </p>
          </div>
          <p className="text-[0.7rem] text-neutral-400">
            Key: <span className="font-mono text-neutral-200">hero</span>
          </p>
        </div>
      </div>

      <section className="flex min-h-[calc(100vh-4.5rem)] flex-col md:flex-row">
        {/* Left: Live preview */}
        <div className="h-80 border-b border-neutral-900 md:h-auto md:w-1/2 md:border-r">
          <iframe
            ref={iframeRef}
            src="/"
            title="Homepage Preview"
            className="h-full w-full border-0 bg-black"
          />
        </div>

        {/* Right: Form */}
        <div className="flex-1 px-6 py-6">
          <div className="mb-4 flex items-center justify-between gap-4 text-[0.7rem] text-neutral-400">
            <p>
              Changes save automatically and update the preview in real time.
            </p>
            <p>{saving ? "Saving..." : status}</p>
          </div>

          <div className="space-y-4 rounded-md border border-neutral-800 bg-zinc-950/60 p-4 text-xs">
            <div>
              <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Hero Video URL
              </label>
              <input
                type="text"
                value={hero?.videoUrl ?? ""}
                onChange={(e) => handleChange("videoUrl", e.target.value)}
                placeholder="https://..."
                className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Headline
              </label>
              <textarea
                rows={2}
                value={hero?.headline ?? ""}
                onChange={(e) => handleChange("headline", e.target.value)}
                placeholder="The Heritage Collection"
                className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Subheadline
              </label>
              <textarea
                rows={3}
                value={hero?.subheadline ?? ""}
                onChange={(e) => handleChange("subheadline", e.target.value)}
                placeholder="Timeless design. Uncompromising quality. Wear what you stand for."
                className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  CTA Text
                </label>
                <input
                  type="text"
                  value={hero?.ctaText ?? ""}
                  onChange={(e) => handleChange("ctaText", e.target.value)}
                  placeholder="Explore Collection →"
                  className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  CTA Link
                </label>
                <input
                  type="text"
                  value={hero?.ctaLink ?? ""}
                  onChange={(e) => handleChange("ctaLink", e.target.value)}
                  placeholder="/shop"
                  className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


