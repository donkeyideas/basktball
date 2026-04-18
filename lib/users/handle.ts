// Handle generation and uniqueness for @mentions
import { prisma } from "@/lib/db/prisma";

export function generateHandle(displayName: string | null | undefined): string {
  if (!displayName) return "user";
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20) || "user";
}

export async function ensureUniqueHandle(base: string): Promise<string> {
  const sanitized = base.slice(0, 20) || "user";

  const existing = await prisma.user.findUnique({ where: { handle: sanitized } });
  if (!existing) return sanitized;

  // Append incrementing number
  for (let i = 1; i < 1000; i++) {
    const candidate = `${sanitized.slice(0, 17)}${i}`;
    const found = await prisma.user.findUnique({ where: { handle: candidate } });
    if (!found) return candidate;
  }

  // Fallback: use random suffix
  return `${sanitized.slice(0, 14)}_${Date.now().toString(36)}`;
}
