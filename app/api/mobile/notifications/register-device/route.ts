import { NextResponse } from "next/server";
import { requireMobileUser, AuthError } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const body = await request.json();
    const { token, platform } = body;

    if (!token || !platform) {
      return NextResponse.json({ message: "Token and platform required" }, { status: 400 });
    }

    if (!["ios", "android"].includes(platform)) {
      return NextResponse.json({ message: "Invalid platform" }, { status: 400 });
    }

    // Upsert device token
    await prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId: user.id,
        token,
        platform,
      },
      update: {
        userId: user.id,
        platform,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Device registration error:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
