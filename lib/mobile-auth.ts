import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "basktball-jwt-secret";

type JWTPayload = {
  userId: string;
  email: string;
  role: string;
};

export async function getMobileUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.warn("[mobile-auth] Missing or malformed Authorization header");
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

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
      console.warn("[mobile-auth] User not found or banned:", payload.userId);
      return null;
    }

    return user;
  } catch (err) {
    console.error("[mobile-auth] JWT verification failed:", err instanceof Error ? err.message : err);
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
