import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { uploadAvatar } from "@/lib/supabase-storage";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return null;
  }
  return session.user;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const bot = await prisma.user.findUnique({
    where: { id, isBot: true },
    select: { id: true },
  });

  if (!bot) {
    return NextResponse.json({ message: "Bot not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return NextResponse.json({ message: "Image data required" }, { status: 400 });
    }

    if (image.length > 7_000_000) {
      return NextResponse.json({ message: "Image too large (max 5MB)" }, { status: 400 });
    }

    const avatarUrl = await uploadAvatar(bot.id, image, mimeType);

    await prisma.user.update({
      where: { id: bot.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Bot avatar upload error:", detail);
    return NextResponse.json({ message: `Upload failed: ${detail}` }, { status: 500 });
  }
}
