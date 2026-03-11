import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await prisma.contactMessage.count({
      where: { status: "UNREAD" },
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ success: true, count: 0 });
  }
}
