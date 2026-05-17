import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return null;
  }
  return session.user;
}

/**
 * POST /api/admin/weekly-kpis/fetch
 *
 * Pulls last-7-days metrics from Google Analytics 4 and upserts a row
 * for the current week. Uses the same GA4 env-var pattern as
 * lib/google/analytics.ts (GOOGLE_GA4_PROPERTY_ID + GOOGLE_CLIENT_EMAIL
 * + GOOGLE_PRIVATE_KEY).
 */
export async function POST() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const propertyId = process.env.GOOGLE_GA4_PROPERTY_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!propertyId || !clientEmail || !privateKey) {
      return NextResponse.json(
        {
          message:
            "GA4 not configured. Set GOOGLE_GA4_PROPERTY_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY env vars.",
        },
        { status: 400 },
      );
    }

    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
    });

    // Date range: last 7 days
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const startDate = weekAgo.toISOString().split("T")[0];
    const endDate = now.toISOString().split("T")[0];

    // Monday of current week
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    // Core metrics
    const [metricsResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "sessionsPerUser" },
        { name: "averageSessionDuration" },
        { name: "totalRevenue" },
      ],
    });

    // Retention via cohort
    let d1Retention = 0;
    let d7Retention = 0;
    try {
      const [cohortResponse] = await client.runReport({
        property: `properties/${propertyId}`,
        dimensions: [{ name: "cohortNthDay" }],
        metrics: [{ name: "cohortActiveUsers" }, { name: "cohortTotalUsers" }],
        cohortSpec: {
          cohorts: [
            {
              name: "recent",
              dateRange: {
                startDate: new Date(now.getTime() - 8 * 86400000).toISOString().split("T")[0],
                endDate: new Date(now.getTime() - 2 * 86400000).toISOString().split("T")[0],
              },
            },
          ],
          cohortsRange: { endOffset: 7, granularity: "DAILY" as any },
        },
      });

      for (const row of cohortResponse?.rows || []) {
        const nthDay = parseInt(row.dimensionValues?.[0]?.value || "0");
        const active = parseInt(row.metricValues?.[0]?.value || "0");
        const total = parseInt(row.metricValues?.[1]?.value || "1");
        const retention = total > 0 ? (active / total) * 100 : 0;
        if (nthDay === 1) d1Retention = retention;
        if (nthDay === 7) d7Retention = retention;
      }
    } catch {
      // cohort data may not be available
    }

    const row = metricsResponse?.rows?.[0];
    const dau = parseInt(row?.metricValues?.[0]?.value || "0");
    const sessions = parseInt(row?.metricValues?.[1]?.value || "0");
    const sessionsPerDau = parseFloat(row?.metricValues?.[2]?.value || "0");
    const avgSessionSecs = Math.round(parseFloat(row?.metricValues?.[3]?.value || "0"));
    const totalRevenue = parseFloat(row?.metricValues?.[4]?.value || "0");
    const arpdau = dau > 0 ? totalRevenue / dau : 0;

    const entry = await prisma.weeklyKpiSnapshot.upsert({
      where: { weekOf: monday },
      update: {
        dau,
        d1Retention: Math.round(d1Retention * 10) / 10,
        d7Retention: Math.round(d7Retention * 10) / 10,
        d30Retention: 0,
        sessionsPerDau: Math.round(sessionsPerDau * 10) / 10,
        avgSessionSecs,
        arpdau: Math.round(arpdau * 100) / 100,
        rating: 0,
        crashRate: 0,
        notes: "Auto-fetched from GA4",
      },
      create: {
        weekOf: monday,
        dau,
        d1Retention: Math.round(d1Retention * 10) / 10,
        d7Retention: Math.round(d7Retention * 10) / 10,
        d30Retention: 0,
        sessionsPerDau: Math.round(sessionsPerDau * 10) / 10,
        avgSessionSecs,
        arpdau: Math.round(arpdau * 100) / 100,
        rating: 0,
        crashRate: 0,
        notes: "Auto-fetched from GA4",
      },
    });

    return NextResponse.json({
      success: true,
      entry,
      raw: { dau, sessions, sessionsPerDau, avgSessionSecs, totalRevenue, arpdau, d1Retention, d7Retention },
    });
  } catch (err: any) {
    console.error("[weekly-kpis/fetch]", err);
    return NextResponse.json(
      { message: err.message ?? "Failed to fetch KPIs from GA4" },
      { status: 500 },
    );
  }
}
