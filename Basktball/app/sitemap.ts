import { MetadataRoute } from "next";

// Base URL for the site
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages with their priorities and change frequencies
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
    {
      url: `${BASE_URL}/insights`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  // Tools pages
  const toolPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/shot-chart`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/advanced-metrics`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/predictor`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/fantasy`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/betting`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  // In production, you would fetch dynamic pages from the database:
  // const players = await prisma.player.findMany({ select: { id: true, updatedAt: true } });
  // const playerPages = players.map((player) => ({
  //   url: `${BASE_URL}/players/${player.id}`,
  //   lastModified: player.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }));

  // const teams = await prisma.team.findMany({ select: { id: true, updatedAt: true } });
  // const teamPages = teams.map((team) => ({
  //   url: `${BASE_URL}/teams/${team.id}`,
  //   lastModified: team.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }));

  // const articles = await prisma.article.findMany({
  //   where: { status: 'PUBLISHED' },
  //   select: { slug: true, updatedAt: true }
  // });
  // const articlePages = articles.map((article) => ({
  //   url: `${BASE_URL}/articles/${article.slug}`,
  //   lastModified: article.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }));

  return [...staticPages, ...toolPages];
}
