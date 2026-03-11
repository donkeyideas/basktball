import { google } from "googleapis";
import { getGoogleAuth } from "./auth";
import { cache } from "@/lib/cache/redis";

const SITE_URL = process.env.GOOGLE_SEARCH_CONSOLE_SITE || "";

function getSearchConsole() {
  return google.searchconsole({ version: "v1", auth: getGoogleAuth() });
}

export interface GSCQueryRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCOverview {
  totalClicks: number;
  totalImpressions: number;
  avgCTR: number;
  avgPosition: number;
  topQueries: GSCQueryRow[];
  topPages: GSCQueryRow[];
  dailyData: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

/**
 * Fetch Search Console data for the last N days.
 * Cached for 30 minutes.
 */
export async function getSearchConsoleOverview(days = 28): Promise<GSCOverview | null> {
  if (!SITE_URL) return null;

  const cacheKey = `google:gsc:overview:${days}`;
  const cached = await cache.get<GSCOverview>(cacheKey);
  if (cached) return cached;

  try {
    const sc = getSearchConsole();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // GSC data lags by ~2 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // Fetch top queries, top pages, and daily trend in parallel
    const [queriesRes, pagesRes, dailyRes] = await Promise.all([
      sc.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ["query"],
          rowLimit: 20,
          type: "web",
        },
      }),
      sc.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ["page"],
          rowLimit: 20,
          type: "web",
        },
      }),
      sc.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ["date"],
          type: "web",
        },
      }),
    ]);

    const mapRows = (rows: typeof queriesRes.data.rows): GSCQueryRow[] =>
      (rows || []).map((r) => ({
        keys: r.keys || [],
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr || 0,
        position: r.position || 0,
      }));

    const topQueries = mapRows(queriesRes.data.rows);
    const topPages = mapRows(pagesRes.data.rows);
    const dailyRows = mapRows(dailyRes.data.rows);

    const totalClicks = dailyRows.reduce((s, r) => s + r.clicks, 0);
    const totalImpressions = dailyRows.reduce((s, r) => s + r.impressions, 0);
    const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const avgPosition =
      dailyRows.length > 0
        ? dailyRows.reduce((s, r) => s + r.position, 0) / dailyRows.length
        : 0;

    const dailyData = dailyRows.map((r) => ({
      date: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));

    const result: GSCOverview = {
      totalClicks,
      totalImpressions,
      avgCTR,
      avgPosition,
      topQueries,
      topPages,
      dailyData,
    };

    await cache.set(cacheKey, result, 1800); // 30 min cache
    return result;
  } catch (error) {
    console.error("Google Search Console API error:", error);
    return null;
  }
}
