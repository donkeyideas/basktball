// scripts/migrate-handles.ts
// Generates unique handles for all existing users who don't have one.
// Run with: npx tsx scripts/migrate-handles.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateHandle(displayName: string | null | undefined): string {
  if (!displayName) return "user";
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20) || "user";
}

async function ensureUniqueHandle(base: string, takenHandles: Set<string>): Promise<string> {
  const sanitized = base.slice(0, 20) || "user";

  if (!takenHandles.has(sanitized)) {
    // Also check DB in case of partial runs
    const existing = await prisma.user.findUnique({ where: { handle: sanitized } });
    if (!existing) return sanitized;
  }

  for (let i = 1; i < 10000; i++) {
    const candidate = `${sanitized.slice(0, 17)}${i}`;
    if (!takenHandles.has(candidate)) {
      const existing = await prisma.user.findUnique({ where: { handle: candidate } });
      if (!existing) return candidate;
    }
  }

  return `${sanitized.slice(0, 14)}_${Date.now().toString(36)}`;
}

async function main() {
  const usersWithoutHandle = await prisma.user.findMany({
    where: { handle: null },
    select: { id: true, name: true, displayName: true },
  });

  console.log(`Found ${usersWithoutHandle.length} users without a handle.`);

  if (usersWithoutHandle.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const takenHandles = new Set<string>();

  // Pre-load existing handles
  const existing = await prisma.user.findMany({
    where: { handle: { not: null } },
    select: { handle: true },
  });
  for (const u of existing) {
    if (u.handle) takenHandles.add(u.handle);
  }

  let updated = 0;
  for (const user of usersWithoutHandle) {
    const base = generateHandle(user.displayName || user.name);
    const handle = await ensureUniqueHandle(base, takenHandles);

    await prisma.user.update({
      where: { id: user.id },
      data: { handle },
    });

    takenHandles.add(handle);
    updated++;
    console.log(`  ${user.displayName || user.name || user.id} → @${handle}`);
  }

  console.log(`\nDone! Updated ${updated} users.`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
