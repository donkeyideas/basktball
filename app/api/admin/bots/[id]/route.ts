import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return null;
  }
  return session.user;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const bot = await prisma.user.findUnique({
    where: { id, isBot: true },
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
    },
  });

  if (!bot) {
    return NextResponse.json({ message: "Bot not found" }, { status: 404 });
  }

  return NextResponse.json({ bot });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { displayName, bio, personality, avatarUrl, botActive } = body;

  const existing = await prisma.user.findUnique({
    where: { id, isBot: true },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Bot not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (displayName !== undefined) data.displayName = displayName;
  if (bio !== undefined) data.bio = bio || null;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl || null;
  if (botActive !== undefined) data.botActive = botActive;
  if (personality !== undefined) {
    data.botPersonality = personality ? JSON.stringify(personality) : null;
  }

  const bot = await prisma.user.update({
    where: { id },
    data,
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
    },
  });

  return NextResponse.json({ bot });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.user.findUnique({
    where: { id, isBot: true },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Bot not found" }, { status: 404 });
  }

  // Soft delete: deactivate and mark
  await prisma.user.update({
    where: { id },
    data: {
      botActive: false,
      status: "SUSPENDED",
    },
  });

  return NextResponse.json({ message: "Bot deactivated" });
}
