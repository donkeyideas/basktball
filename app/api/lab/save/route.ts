import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to save queries" }, { status: 401 });
  }

  let body: { rawQuery?: string; parsed?: unknown; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.rawQuery || !body.parsed) {
    return NextResponse.json({ error: "Missing rawQuery or parsed" }, { status: 400 });
  }

  const saved = await prisma.savedLabQuery.create({
    data: {
      userId: session.user.id,
      rawQuery: body.rawQuery,
      parsed: body.parsed as never,
      label: body.label || null,
    },
  });

  return NextResponse.json({ saved: { id: saved.id, createdAt: saved.createdAt } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ saved: [] });
  }

  const saved = await prisma.savedLabQuery.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ saved });
}
