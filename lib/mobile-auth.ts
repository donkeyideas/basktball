import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";

/** Thrown by requireMobileUser — catch with `instanceof AuthError` (never match on message strings). */
export class AuthError extends Error {
  public readonly reason: string;
  constructor(message: string, reason: string) {
    super(message);
    this.name = "AuthError";
    this.reason = reason;
  }
}

// Primary secret for signing NEW tokens
export const JWT_SIGN_SECRET =
  process.env.JWT_SECRET || process.env.AUTH_SECRET || "basktball-jwt-secret";

// All secrets to try when VERIFYING tokens (handles secret rotation gracefully)
const JWT_VERIFY_SECRETS = [
  process.env.JWT_SECRET,
  process.env.AUTH_SECRET,
  process.env.NEXTAUTH_SECRET,
  "basktball-jwt-secret",
].filter((s): s is string => !!s);

type JWTPayload = {
  userId: string;
  email: string;
  role: string;
};

type MobileUser = {
  id: string;
  email: string | null;
  name: string | null;
  displayName: string | null;
  image: string | null;
  avatarUrl: string | null;
  role: string;
  status: string | null;
};

function verifyTokenMultiSecret(token: string): JWTPayload | null {
  for (const secret of JWT_VERIFY_SECRETS) {
    try {
      return jwt.verify(token, secret) as JWTPayload;
    } catch {
      continue;
    }
  }
  return null;
}

// Detailed auth check with reason (used by requireMobileUser)
async function authenticateMobileUser(
  request: Request
): Promise<{ user: MobileUser | null; reason: string }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, reason: "no_token" };
  }

  try {
    const token = authHeader.slice(7);
    if (!token || token.length < 10) {
      return { user: null, reason: "empty_token" };
    }

    // Check if token is expired separately for better error messages
    const decoded = jwt.decode(token) as (JWTPayload & { exp?: number }) | null;
    if (!decoded) {
      return { user: null, reason: "malformed_token" };
    }
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return { user: null, reason: "token_expired" };
    }

    const payload = verifyTokenMultiSecret(token);
    if (!payload) {
      return { user: null, reason: "invalid_signature" };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        image: true,
        avatarUrl: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return { user: null, reason: "user_not_found" };
    }
    if (user.status === "BANNED") {
      return { user: null, reason: "user_banned" };
    }

    return { user, reason: "ok" };
  } catch (err) {
    console.error(
      "[mobile-auth] Auth error:",
      err instanceof Error ? err.message : err
    );
    return { user: null, reason: "server_error" };
  }
}

// Returns user or null (backward-compatible, used by many routes)
export async function getMobileUser(
  request: Request
): Promise<MobileUser | null> {
  const { user } = await authenticateMobileUser(request);
  return user;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  no_token: "No authentication token provided. Please log in.",
  empty_token: "Invalid authentication token. Please log in again.",
  malformed_token: "Corrupted token. Please log in again.",
  token_expired: "Your session has expired. Please log in again.",
  invalid_signature: "Invalid token. Please log in again.",
  user_not_found: "Account not found. Please log in again.",
  user_banned: "This account has been banned.",
  server_error: "Authentication error. Please try again.",
};

// Returns user or throws AuthError — catch with `instanceof AuthError`, never string-match.
export async function requireMobileUser(request: Request) {
  const { user, reason } = await authenticateMobileUser(request);
  if (!user) {
    console.warn("[mobile-auth] Rejected:", reason);
    const message = AUTH_ERROR_MESSAGES[reason] || "Unauthorized";
    throw new AuthError(message, reason);
  }
  return user;
}
