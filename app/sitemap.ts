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
      url: `${BASE_URL}/scores`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/standings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/schedule`,
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
      url: `${BASE_URL}/court`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/cards`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cards?tab=lab`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/stats/ask`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/share/take`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/playoffs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Tools pages (only live, non-WIP tools)
  const toolPages: MetadataRoute.Sitemap = [
    "tools",
    "tools/compare",
    "tools/metrics",
    "tools/predictor",
    "tools/fantasy",
    "tools/team-analytics",
    "tools/draft",
  ].map((path) => ({
    url: `${BASE_URL}/${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Dynamic pages from database
  let playerPages: MetadataRoute.Sitemap = [];
  let teamPages: MetadataRoute.Sitemap = [];
  let gamePages: MetadataRoute.Sitemap = [];
  let profilePages: MetadataRoute.Sitemap = [];

  try {
    const timeout = <T>(p: Promise<T>, ms: number): Promise<T | null> =>
      Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);

    const [players, teams, games, profiles] = await Promise.all([
      // All players (cap removed — was capped at 500)
      timeout(prisma.player.findMany({
        select: { id: true, updatedAt: true },
      }), 10000),
      timeout(prisma.team.findMany({
        select: { id: true, league: true, updatedAt: true },
      }), 10000),
      // Completed games only (GameStatus.FINAL). Most-recent first, capped at 20k
      // to stay comfortably under the 50k-URL sitemap limit.
      timeout(prisma.game.findMany({
        where: { status: "FINAL" },
        select: { id: true, updatedAt: true },
        orderBy: { gameDate: "desc" },
        take: 20000,
      }), 10000),
      // Public user profiles — quality gate: active account, has a name (the
      // public @handle that /user/[username] resolves), and at least one take
      // (so we don't index empty profiles). Route resolves users by `name`.
      timeout(prisma.user.findMany({
        where: {
          status: "ACTIVE",
          name: { not: null },
          takeCount: { gt: 0 },
        },
        select: { name: true, updatedAt: true },
        take: 20000,
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

    gamePages = (games || []).map((g) => ({
      url: `${BASE_URL}/game/${g.id}`,
      lastModified: g.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    profilePages = (profiles || [])
      .filter((u): u is { name: string; updatedAt: Date } => !!u.name)
      .map((u) => ({
        url: `${BASE_URL}/user/${encodeURIComponent(u.name)}`,
        lastModified: u.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.4,
      }));
  } catch (error) {
    console.error("Sitemap: failed to fetch dynamic pages:", error);
  }

  // NOTE: If the combined URL count ever approaches the 50,000-URL / 50MB
  // per-sitemap limit, split into a sitemap index via Next's
  // generateSitemaps() (https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps).
  return [
    ...staticPages,
    ...toolPages,
    ...playerPages,
    ...teamPages,
    ...gamePages,
    ...profilePages,
  ];
}
