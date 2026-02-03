"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { analytics } from "@/components/Analytics";

// Ad slot types matching the database enum
export type AdSlotType =
  | "HEADER_BANNER"
  | "SIDEBAR_TOP"
  | "SIDEBAR_BOTTOM"
  | "IN_CONTENT"
  | "FOOTER_BANNER"
  | "MOBILE_STICKY"
  | "INTERSTITIAL"
  | "LIVE_SCORES_INLINE"
  | "PLAYER_CARD_INLINE"
  | "TOOL_SIDEBAR";

export interface AdData {
  id: string;
  imageUrl?: string;
  htmlContent?: string;
  linkUrl?: string;
  altText?: string;
  campaignId: string;
}

interface AdSlotProps {
  slot: AdSlotType;
  className?: string;
  fallback?: React.ReactNode;
}

// Slot dimensions for placeholder sizing
const slotDimensions: Record<AdSlotType, { width: string; height: string }> = {
  HEADER_BANNER: { width: "728px", height: "90px" },
  SIDEBAR_TOP: { width: "300px", height: "250px" },
  SIDEBAR_BOTTOM: { width: "300px", height: "250px" },
  IN_CONTENT: { width: "728px", height: "90px" },
  FOOTER_BANNER: { width: "728px", height: "90px" },
  MOBILE_STICKY: { width: "320px", height: "50px" },
  INTERSTITIAL: { width: "100%", height: "100%" },
  LIVE_SCORES_INLINE: { width: "100%", height: "auto" },
  PLAYER_CARD_INLINE: { width: "100%", height: "auto" },
  TOOL_SIDEBAR: { width: "300px", height: "600px" },
};

export function AdSlot({ slot, className, fallback }: AdSlotProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const response = await fetch(`/api/ads/${slot}`);
        if (response.ok) {
          const data = await response.json();
          if (data.ad) {
            setAd(data.ad);
            // Track impression
            analytics.adImpression(slot, data.ad.id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch ad:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAd();
  }, [slot]);

  const handleClick = () => {
    if (ad) {
      analytics.adClick(slot, ad.id);
      // Track click on server
      fetch("/api/ads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad.id, type: "click" }),
      }).catch(console.error);
    }
  };

  // Show nothing while loading (prevents layout shift)
  if (isLoading) {
    return <AdSkeleton slot={slot} className={className} />;
  }

  // Show fallback or nothing if no ad
  if (!ad || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  const dimensions = slotDimensions[slot];

  return (
    <div
      className={cn(
        "ad-container relative",
        slot === "MOBILE_STICKY" && "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        className
      )}
      data-ad-slot={slot}
      style={{
        maxWidth: dimensions.width,
        minHeight: dimensions.height !== "auto" ? dimensions.height : undefined,
      }}
    >
      {ad.htmlContent ? (
        <div
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: ad.htmlContent }}
          className="cursor-pointer"
        />
      ) : ad.imageUrl ? (
        <a
          href={ad.linkUrl || "#"}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={handleClick}
          className="block"
        >
          <img
            src={ad.imageUrl}
            alt={ad.altText || "Advertisement"}
            className="w-full h-auto"
            loading="lazy"
          />
        </a>
      ) : null}
      <span className="absolute bottom-1 right-1 text-[10px] text-white/30 uppercase tracking-wide">
        Ad
      </span>
    </div>
  );
}

function AdSkeleton({
  slot,
  className,
}: {
  slot: AdSlotType;
  className?: string;
}) {
  const dimensions = slotDimensions[slot];

  // Don't show skeleton for inline ads
  if (slot === "LIVE_SCORES_INLINE" || slot === "PLAYER_CARD_INLINE") {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-[var(--dark-gray)]/50 animate-pulse",
        className
      )}
      style={{
        maxWidth: dimensions.width,
        height: dimensions.height !== "auto" ? dimensions.height : "100px",
      }}
    />
  );
}

// Wrapper components for specific ad placements
export function HeaderBanner({ className }: { className?: string }) {
  return (
    <div className={cn("hidden md:flex justify-center py-2 bg-[var(--black)]", className)}>
      <AdSlot slot="HEADER_BANNER" />
    </div>
  );
}

export function SidebarAds({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <AdSlot slot="SIDEBAR_TOP" />
      <AdSlot slot="SIDEBAR_BOTTOM" />
    </div>
  );
}

export function InContentAd({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-6", className)}>
      <AdSlot slot="IN_CONTENT" />
    </div>
  );
}

export function FooterBanner({ className }: { className?: string }) {
  return (
    <div className={cn("hidden md:flex justify-center py-4 bg-[var(--dark-gray)]", className)}>
      <AdSlot slot="FOOTER_BANNER" />
    </div>
  );
}

export function MobileStickyAd() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--black)] border-t border-[var(--border)]">
      <div className="relative">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-6 right-2 bg-[var(--dark-gray)] text-white/50 text-xs px-2 py-1 hover:text-white"
        >
          Close
        </button>
        <div className="flex justify-center p-2">
          <AdSlot slot="MOBILE_STICKY" />
        </div>
      </div>
    </div>
  );
}

export function ToolSidebarAd({ className }: { className?: string }) {
  return (
    <div className={cn("hidden lg:block", className)}>
      <AdSlot slot="TOOL_SIDEBAR" />
    </div>
  );
}

export default AdSlot;
