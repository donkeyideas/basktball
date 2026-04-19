import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

const SETTING_KEY = "auto_broadcast_schedule";
const DEFAULT_HOURS = [12, 18]; // 12 PM & 6 PM ET

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_KEY },
  });

  const hours: number[] = setting?.value ? JSON.parse(setting.value) : DEFAULT_HOURS;

  return NextResponse.json({ hours });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hours } = await request.json();

  if (
    !Array.isArray(hours) ||
    hours.some((h: unknown) => typeof h !== "number" || h < 0 || h > 23)
  ) {
    return NextResponse.json(
      { error: "Invalid hours. Must be array of 0-23." },
      { status: 400 }
    );
  }

  const sorted = [...new Set(hours)].sort((a, b) => a - b);

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: JSON.stringify(sorted), type: "json" },
    update: { value: JSON.stringify(sorted) },
  });

  return NextResponse.json({ hours: sorted });
}
