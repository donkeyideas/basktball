import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return null;
  }
  return session.user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const bots = await prisma.user.findMany({
    where: { isBot: true },
    select: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      bio: true,
      avatarUrl: true,
      image: true,
      botPersonality: true,
      botActive: true,
      takeCount: true,
      createdAt: true,
      favoriteTeamId: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bots });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { handle, displayName, bio, personality, avatarUrl, favoriteTeamId } = body;

  if (!handle || !displayName) {
    return NextResponse.json({ message: "Handle and display name are required" }, { status: 400 });
  }

  // Check handle uniqueness
  const existing = await prisma.user.findFirst({
    where: { name: { equals: handle, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json({ message: "Handle already taken" }, { status: 409 });
  }

  const email = `bot-${handle.toLowerCase()}@basktball.com`;
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

  const bot = await prisma.user.create({
    data: {
      email,
      name: handle,
      displayName,
      bio: bio || null,
      avatarUrl: avatarUrl || null,
      passwordHash,
      isBot: true,
      botActive: true,
      botPersonality: personality ? JSON.stringify(personality) : null,
      favoriteTeamId: favoriteTeamId || null,
      role: "USER",
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      bio: true,
      avatarUrl: true,
      botPersonality: true,
      botActive: true,
      takeCount: true,
      createdAt: true,
      favoriteTeamId: true,
    },
  });

  return NextResponse.json({ bot }, { status: 201 });
}
