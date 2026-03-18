import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { postBotTake, botReactToTakes, botReplyToTakes, botRepostTakes } from "@/lib/bots/engine";

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
    select: { id: true, name: true, botActive: true },
  });

  if (!bot) {
    return NextResponse.json({ message: "Bot not found" }, { status: 404 });
  }

  const takeId = await postBotTake(bot.id);

  if (!takeId) {
    return NextResponse.json(
      { message: "Failed to generate take. Check bot personality and AI config." },
      { status: 500 }
    );
  }

  // Also react, reply, and repost
  await botReactToTakes(bot.id).catch(() => {});
  await botReplyToTakes(bot.id).catch(() => {});
  await botRepostTakes(bot.id).catch(() => {});

  const take = await prisma.take.findUnique({
    where: { id: takeId },
    select: { id: true, content: true, createdAt: true },
  });

  return NextResponse.json({ take });
}
