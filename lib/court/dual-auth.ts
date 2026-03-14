import { auth } from "@/lib/auth";
import { getCourtUser } from "./auth";
import { getMobileUser } from "@/lib/mobile-auth";

/**
 * Combined auth for routes that serve both web (NextAuth) and mobile (JWT).
 * Returns { id, role } or null.
 */
export async function getDualUser(request: Request) {
  const session = await auth();
  const user = getCourtUser(session);
  if (user) return user;

  const mobileUser = await getMobileUser(request);
  if (mobileUser) return { id: mobileUser.id, role: mobileUser.role };

  return null;
}
