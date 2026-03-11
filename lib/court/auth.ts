/**
 * Simple auth helper for Court API routes.
 * Does NOT import Redis or any heavy dependencies.
 */
export function getCourtUser(session: { user?: { id?: string; role?: string; name?: string | null; email?: string | null } } | null) {
  if (!session?.user?.id) {
    return null;
  }
  return session.user as { id: string; role: string; name?: string; email?: string };
}
