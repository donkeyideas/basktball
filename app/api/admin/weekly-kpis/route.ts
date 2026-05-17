import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return null;
  }
  return session.user;
}

// GET /api/admin/weekly-kpis — list recent weeks (up to 52)
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const entries = await prisma.weeklyKpiSnapshot.findMany({
      orderBy: { weekOf: "desc" },
      take: 52,
    });
    return NextResponse.json({ entries });
  } catch (err: any) {
    console.error("[weekly-kpis GET]", err);
    return NextResponse.json(
      { message: err.message ?? "Failed to fetch KPIs" },
      { status: 500 },
    );
  }
}

// POST /api/admin/weekly-kpis — upsert a week's entry (manual entry form)
export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      weekOf,
      dau,
      d1Retention,
      d7Retention,
      d30Retention,
      sessionsPerDau,
      avgSessionSecs,
      arpdau,
      rating,
      crashRate,
      notes,
    } = body;

    if (!weekOf || dau == null) {
      return NextResponse.json(
        { message: "weekOf and dau are required" },
        { status: 400 },
      );
    }

    const entry = await prisma.weeklyKpiSnapshot.upsert({
      where: { weekOf: new Date(weekOf) },
      update: {
        dau: Number(dau),
        d1Retention: Number(d1Retention) || 0,
        d7Retention: Number(d7Retention) || 0,
        d30Retention: Number(d30Retention) || 0,
        sessionsPerDau: Number(sessionsPerDau) || 0,
        avgSessionSecs: Number(avgSessionSecs) || 0,
        arpdau: Number(arpdau) || 0,
        rating: Number(rating) || 0,
        crashRate: Number(crashRate) || 0,
        notes: notes || null,
      },
      create: {
        weekOf: new Date(weekOf),
        dau: Number(dau),
        d1Retention: Number(d1Retention) || 0,
        d7Retention: Number(d7Retention) || 0,
        d30Retention: Number(d30Retention) || 0,
        sessionsPerDau: Number(sessionsPerDau) || 0,
        avgSessionSecs: Number(avgSessionSecs) || 0,
        arpdau: Number(arpdau) || 0,
        rating: Number(rating) || 0,
        crashRate: Number(crashRate) || 0,
        notes: notes || null,
      },
    });

    return NextResponse.json({ entry });
  } catch (err: any) {
    console.error("[weekly-kpis POST]", err);
    return NextResponse.json(
      { message: err.message ?? "Failed to save KPI entry" },
      { status: 500 },
    );
  }
}
