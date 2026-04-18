// @mention extraction and user resolution
import { prisma } from "@/lib/db/prisma";

const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

export function extractMentions(text: string): string[] {
  const matches = text.matchAll(MENTION_REGEX);
  const handles = new Set<string>();
  for (const m of matches) {
    handles.add(m[1].toLowerCase());
  }
  return Array.from(handles);
}

export async function resolveMentionedUserIds(handles: string[]): Promise<string[]> {
  if (handles.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { handle: { in: handles } },
    select: { id: true },
  });

  return users.map((u) => u.id);
}
