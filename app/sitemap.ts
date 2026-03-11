import { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // cache for 1 hour

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/live`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/stats`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/teams`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/players`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Tools pages
  const toolPages: MetadataRoute.Sitemap = [
    "tools",
    "tools/shot-chart",
    "tools/compare",
    "tools/advanced-metrics",
    "tools/predictor",
    "tools/fantasy",
    "tools/betting",
  ].map((path) => ({
    url: `${BASE_URL}/${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Dynamic pages from database
  let playerPages: MetadataRoute.Sitemap = [];
  let teamPages: MetadataRoute.Sitemap = [];
  let articlePages: MetadataRoute.Sitemap = [];

  try {
    const timeout = <T>(p: Promise<T>, ms: number): Promise<T | null> =>
      Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);

    const [players, teams, articles] = await Promise.all([
      timeout(prisma.player.findMany({
        select: { id: true, updatedAt: true },
        take: 500,
      }), 10000),
      timeout(prisma.team.findMany({
        select: { id: true, league: true, updatedAt: true },
      }), 10000),
      timeout(prisma.article.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }), 10000),
    ]);

    playerPages = (players || []).map((p) => ({
      url: `${BASE_URL}/player/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    teamPages = (teams || []).map((t) => ({
      url: `${BASE_URL}/teams/${(t.league || "nba").toLowerCase()}/${t.id}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    articlePages = (articles || []).map((a) => ({
      url: `${BASE_URL}/news/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Sitemap: failed to fetch dynamic pages:", error);
  }

  return [...staticPages, ...toolPages, ...playerPages, ...teamPages, ...articlePages];
}
