import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { cache } from "@/lib/cache/redis";

const PROPERTY_ID = process.env.GOOGLE_GA4_PROPERTY_ID || "";

let analyticsClient: BetaAnalyticsDataClient | null = null;

function getAnalyticsClient() {
  if (analyticsClient) return analyticsClient;

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY env vars must be set");
  }

  analyticsClient = new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
  });

  return analyticsClient;
}

export interface GA4Overview {
  totalUsers: number;
  totalSessions: number;
  totalPageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: Array<{
    path: string;
    pageViews: number;
    users: number;
    avgDuration: number;
  }>;
  topSources: Array<{
    source: string;
    medium: string;
    users: number;
    sessions: number;
  }>;
  dailyData: Array<{
    date: string;
    users: number;
    sessions: number;
    pageViews: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    users: number;
    percentage: number;
  }>;
}

/**
 * Fetch GA4 analytics data for the last N days.
 * Cached for 30 minutes.
 */
export async function getGA4Overview(days = 28): Promise<GA4Overview | null> {
  if (!PROPERTY_ID) return null;

  const cacheKey = `google:ga4:overview:${days}`;
  const cached = await cache.get<GA4Overview>(cacheKey);
  if (cached) return cached;

  try {
    const client = getAnalyticsClient();
    const property = `properties/${PROPERTY_ID}`;

    // Fetch overview metrics, top pages, sources, daily data, and device breakdown in parallel
    const [overviewRes, pagesRes, sourcesRes, dailyRes, deviceRes] = await Promise.all([
      // Overall metrics
      client.runReport({
        property,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
        metrics: [
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
      }),
      // Top pages
      client.runReport({
        property,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "totalUsers" },
          { name: "averageSessionDuration" },
        ],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 20,
      }),
      // Traffic sources
      client.runReport({
        property,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [
          { name: "totalUsers" },
          { name: "sessions" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 15,
      }),
      // Daily trend
      client.runReport({
        property,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      // Device breakdown
      client.runReport({
        property,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "totalUsers" }],
      }),
    ]);

    // Parse overview metrics
    const overviewRow = overviewRes[0]?.rows?.[0];
    const totalUsers = parseInt(overviewRow?.metricValues?.[0]?.value || "0");
    const totalSessions = parseInt(overviewRow?.metricValues?.[1]?.value || "0");
    const totalPageViews = parseInt(overviewRow?.metricValues?.[2]?.value || "0");
    const avgSessionDuration = parseFloat(overviewRow?.metricValues?.[3]?.value || "0");
    const bounceRate = parseFloat(overviewRow?.metricValues?.[4]?.value || "0") * 100;

    // Parse top pages
    const topPages = (pagesRes[0]?.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || "/",
      pageViews: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
      avgDuration: parseFloat(row.metricValues?.[2]?.value || "0"),
    }));

    // Parse traffic sources
    const topSources = (sourcesRes[0]?.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || "(direct)",
      medium: row.dimensionValues?.[1]?.value || "(none)",
      users: parseInt(row.metricValues?.[0]?.value || "0"),
      sessions: parseInt(row.metricValues?.[1]?.value || "0"),
    }));

    // Parse daily data
    const dailyData = (dailyRes[0]?.rows || []).map((row) => {
      const dateStr = row.dimensionValues?.[0]?.value || "";
      const formatted = dateStr.length === 8
        ? `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
        : dateStr;
      return {
        date: formatted,
        users: parseInt(row.metricValues?.[0]?.value || "0"),
        sessions: parseInt(row.metricValues?.[1]?.value || "0"),
        pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
      };
    });

    // Parse device breakdown
    const deviceRows = (deviceRes[0]?.rows || []).map((row) => ({
      device: row.dimensionValues?.[0]?.value || "unknown",
      users: parseInt(row.metricValues?.[0]?.value || "0"),
      percentage: 0,
    }));
    const totalDeviceUsers = deviceRows.reduce((s, d) => s + d.users, 0);
    const deviceBreakdown = deviceRows.map((d) => ({
      ...d,
      percentage: totalDeviceUsers > 0 ? Math.round((d.users / totalDeviceUsers) * 100) : 0,
    }));

    const result: GA4Overview = {
      totalUsers,
      totalSessions,
      totalPageViews,
      avgSessionDuration,
      bounceRate,
      topPages,
      topSources,
      dailyData,
      deviceBreakdown,
    };

    await cache.set(cacheKey, result, 1800); // 30 min cache
    return result;
  } catch (error) {
    console.error("Google Analytics API error:", error);
    return null;
  }
}
