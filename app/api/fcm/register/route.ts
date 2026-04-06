import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, device } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || undefined;

    await prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId: session.user.id,
        token,
        platform: device || "web",
        userAgent,
      },
      update: {
        userId: session.user.id,
        platform: device || "web",
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FCM register error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    await prisma.deviceToken.deleteMany({
      where: { token, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FCM unregister error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
