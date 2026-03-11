import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "basktball-jwt-secret";

type JWTPayload = {
  userId: string;
  email: string;
  role: string;
};

export async function getMobileUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
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
      return null;
    }

    return user;
  } catch {
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
