import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@basktball.com" },
    update: { passwordHash: adminPassword, role: "ADMIN" },
    create: {
      email: "admin@basktball.com",
      passwordHash: adminPassword,
      name: "Admin",
      displayName: "Admin",
      role: "ADMIN",
    },
  });
  console.log("Admin user seeded");

  // Seed BASKTBALL Bot user (for AI-generated threads)
  await prisma.user.upsert({
    where: { email: "bot@basktball.com" },
    update: {},
    create: {
      email: "bot@basktball.com",
      name: "BASKTBALL Bot",
      displayName: "BASKTBALL Bot",
      role: "EDITOR",
    },
  });
  console.log("Bot user seeded");

  // Seed forum categories
  const categories = [
    { name: "NBA Discussion", slug: "nba-discussion", description: "General NBA talk, game reactions, hot takes", icon: null, color: "#FF6B35", sortOrder: 1 },
    { name: "Trade Rumors & Free Agency", slug: "trade-rumors", description: "Trade speculation, free agent signings, rumors", icon: null, color: "#EF4444", sortOrder: 2 },
    { name: "Fantasy Basketball", slug: "fantasy-basketball", description: "Fantasy advice, waiver wire, trade evaluations", icon: null, color: "#10B981", sortOrder: 3 },
    { name: "Playoffs & Finals", slug: "playoffs-finals", description: "Playoff bracket, series predictions, Finals discussion", icon: null, color: "#F59E0B", sortOrder: 4 },
    { name: "College Basketball", slug: "college-basketball", description: "NCAA tournament, March Madness, recruiting", icon: null, color: "#3B82F6", sortOrder: 5 },
    { name: "NBA Draft", slug: "nba-draft", description: "Draft prospects, mock drafts, draft night reactions", icon: null, color: "#8B5CF6", sortOrder: 6 },
    { name: "WNBA", slug: "wnba", description: "WNBA discussion, scores, analysis", icon: null, color: "#EC4899", sortOrder: 7 },
    { name: "Basketball History", slug: "basketball-history", description: "GOAT debates, classic games, historical records", icon: null, color: "#C89F6C", sortOrder: 8 },
    { name: "Off Court", slug: "off-court", description: "Basketball culture, shoes, media, off-court news", icon: null, color: "#6B7280", sortOrder: 9 },
    { name: "Site Feedback", slug: "site-feedback", description: "Bug reports, feature requests, suggestions for BASKTBALL", icon: null, color: "#64748B", sortOrder: 10 },
  ];

  for (const cat of categories) {
    await prisma.forumCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, color: cat.color, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log(`${categories.length} forum categories seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
