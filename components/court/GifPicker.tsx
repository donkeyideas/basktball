"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface GifResult {
  id: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Fetch trending on mount
  useEffect(() => {
    fetchGifs("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const fetchGifs = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/gifs?q=${encodeURIComponent(q)}` : "/api/gifs";
      const res = await fetch(url);
      const data = await res.json();
      setGifs(Array.isArray(data) ? data : []);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchGifs(val), 300);
    },
    [fetchGifs]
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 999,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(480px, 90vw)",
          maxHeight: "70vh",
          backgroundColor: "var(--dark-gray)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <span style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "16px",
            color: "#FF6B35",
            letterSpacing: "0.5px",
          }}>
            GIFs
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search GIFs..."
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "22px",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            &times;
          </button>
        </div>

        {/* GIF grid */}
        <div
          style={{
            overflowY: "auto",
            padding: "10px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            flex: 1,
          }}
        >
          {loading && gifs.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "30px", color: "var(--text-faint)", fontSize: "14px", fontFamily: "var(--font-inter), sans-serif" }}>
              Loading...
            </div>
          )}
          {!loading && gifs.length === 0 && query && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "30px", color: "var(--text-faint)", fontSize: "14px", fontFamily: "var(--font-inter), sans-serif" }}>
              No GIFs found
            </div>
          )}
          {gifs.map((gif) => (
            <div
              key={gif.id}
              onClick={() => onSelect(gif.url)}
              style={{
                cursor: "pointer",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "rgba(255,255,255,0.05)",
                aspectRatio: "1",
                transition: "transform 0.1s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <img
                src={gif.previewUrl || gif.url}
                alt=""
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          ))}
        </div>

        {/* GIPHY attribution */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--border-subtle)",
            textAlign: "right",
            fontSize: "11px",
            color: "var(--text-faint)",
            fontFamily: "var(--font-inter), sans-serif",
          }}
        >
          Powered by GIPHY
        </div>
      </div>
    </>
  );
}
