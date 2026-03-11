import { cache } from "@/lib/cache/redis";

/**
 * Generate a URL-friendly slug from a title.
 * Appends a short random suffix to ensure uniqueness.
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

/**
 * Sanitize user-generated content.
 * Strips potential HTML/script injection while preserving text.
 */
export function sanitizeContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Check AI rate limit for a user.
 * Returns true if the user is within limits, false if rate-limited.
 */
export async function checkAiRateLimit(userId: string): Promise<boolean> {
  const key = `forum:ai-rate:${userId}`;
  try {
    const count = await cache.incr(key);
    if (count === 1) {
      // First call - set TTL to 1 hour
      await cache.set(key, "1", 3600);
    }
    return count <= 20; // 20 AI calls per hour
  } catch {
    return true; // Allow on cache failure
  }
}

/**
 * Get the current user from a session for API routes.
 */
export function requireAuth(session: { user?: { id?: string; role?: string } } | null) {
  if (!session?.user?.id) {
    return null;
  }
  return session.user as { id: string; role: string; name?: string; email?: string };
}
