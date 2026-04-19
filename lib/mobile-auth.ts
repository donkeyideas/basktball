import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";

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

export async function getMobileUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyTokenMultiSecret(token);

    if (!payload) {
      console.error("[mobile-auth] JWT verification failed against all secrets");
      return null;
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

    if (!user || user.status === "BANNED") {
      return null;
    }

    return user;
  } catch (err) {
    console.error("[mobile-auth] Auth error:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function requireMobileUser(request: Request) {
  const user = await getMobileUser(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
