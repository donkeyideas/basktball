"use client";

import Script from "next/script";

interface AnalyticsProps {
  gaId?: string;
}

export function Analytics({ gaId }: AnalyticsProps) {
  const measurementId = gaId || process.env.NEXT_PUBLIC_GA_ID;

  if (!measurementId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  );
}

// Analytics event tracking utilities
export function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, parameters);
  }
}

// Predefined event trackers
export const analytics = {
  // Page interactions
  pageView: (pagePath: string, pageTitle: string) => {
    trackEvent("page_view", {
      page_path: pagePath,
      page_title: pageTitle,
    });
  },

  // Tool usage
  toolUsed: (toolName: string) => {
    trackEvent("tool_used", {
      tool_name: toolName,
    });
  },

  // Player/Team views
  playerViewed: (playerId: string, playerName: string) => {
    trackEvent("player_viewed", {
      player_id: playerId,
      player_name: playerName,
    });
  },

  teamViewed: (teamId: string, teamName: string) => {
    trackEvent("team_viewed", {
      team_id: teamId,
      team_name: teamName,
    });
  },

  // Search
  search: (searchTerm: string, category?: string) => {
    trackEvent("search", {
      search_term: searchTerm,
      search_category: category || "all",
    });
  },

  // Engagement
  scrollDepth: (percentage: number) => {
    trackEvent("scroll_depth", {
      percent_scrolled: percentage,
    });
  },

  timeOnPage: (seconds: number) => {
    trackEvent("time_on_page", {
      engagement_time_sec: seconds,
    });
  },

  // Ad interactions
  adImpression: (adSlot: string, adId: string) => {
    trackEvent("ad_impression", {
      ad_slot: adSlot,
      ad_id: adId,
    });
  },

  adClick: (adSlot: string, adId: string) => {
    trackEvent("ad_click", {
      ad_slot: adSlot,
      ad_id: adId,
    });
  },

  // Outbound links
  outboundClick: (url: string) => {
    trackEvent("click", {
      link_url: url,
      link_type: "outbound",
    });
  },
};

export default Analytics;
