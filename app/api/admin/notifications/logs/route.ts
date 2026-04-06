import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await prisma.notificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Notification logs error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notification logs" },
      { status: 500 }
    );
  }
}
