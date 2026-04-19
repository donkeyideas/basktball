"use client";

import React, { useState } from "react";

interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  videoEmbedUrl: string | null;
  videoProvider: string | null;
}

interface LinkPreviewCardProps {
  preview: LinkPreviewData;
}

export default function LinkPreviewCard({ preview }: LinkPreviewCardProps) {
  const hasVideo = !!preview.videoEmbedUrl;
  const [showVideo, setShowVideo] = useState(hasVideo && !preview.image);

  if (!preview.title && !preview.description && !preview.image && !hasVideo) return null;

  const isVertical = preview.videoProvider === "instagram" || preview.videoProvider === "tiktok";
  // Platform-specific heights to show full content without scroll
  const embedHeight = preview.videoProvider === "tiktok" ? 750
    : preview.videoProvider === "instagram" ? 780
    : 340;

  return (
    <div
      style={{
        margin: "8px 0",
        borderRadius: "12px",
        border: "1px solid var(--border-color)",
        overflow: "hidden",
        // Dark background when video is playing to eliminate white side gaps
        backgroundColor: showVideo ? "#000" : "rgba(255,255,255,0.03)",
        cursor: hasVideo && !showVideo ? "pointer" : undefined,
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasVideo && !showVideo) {
          setShowVideo(true);
        } else if (!hasVideo) {
          window.open(preview.url, "_blank", "noopener,noreferrer");
        }
      }}
    >
      {/* Video embed */}
      {showVideo && preview.videoEmbedUrl ? (
        <div
          style={{
            backgroundColor: "#000",
            overflow: "hidden",
            // Center narrow vertical embeds (TikTok/Instagram) in the container
            display: "flex",
            justifyContent: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <iframe
            src={preview.videoEmbedUrl}
            scrolling="no"
            style={{
              // TikTok embeds are ~325px wide natively; Instagram ~540px
              // Constrain width so there's no white side padding from the embed's own page
              width: preview.videoProvider === "tiktok" ? "325px"
                : preview.videoProvider === "instagram" ? "540px"
                : "100%",
              maxWidth: "100%",
              height: embedHeight,
              border: "none",
              display: "block",
              overflow: "hidden",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : preview.image ? (
        <div style={{ position: "relative" }}>
          <img
            src={preview.image}
            alt={preview.title || ""}
            style={{
              width: "100%",
              maxHeight: "250px",
              objectFit: "cover",
              display: "block",
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          {hasVideo && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,107,53,0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      ) : hasVideo && !showVideo ? (
        /* Play button for videos without thumbnail */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 0",
            backgroundColor: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "rgba(255,107,53,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: "12px",
              color: "var(--text-faint)",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            Click to play
          </div>
        </div>
      ) : null}

      {/* Text content — hide when video is playing (embed shows its own branding) */}
      {!showVideo && (preview.title || preview.description || preview.siteName) && (
        <div style={{ padding: "10px 12px" }}>
          {preview.siteName && (
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-faint)",
                fontFamily: "var(--font-inter), sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "4px",
              }}
            >
              {preview.siteName}
            </div>
          )}
          {preview.title && (
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-inter), sans-serif",
                lineHeight: 1.3,
                marginBottom: preview.description ? "4px" : 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {preview.title}
            </div>
          )}
          {preview.description && (
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-inter), sans-serif",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {preview.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
