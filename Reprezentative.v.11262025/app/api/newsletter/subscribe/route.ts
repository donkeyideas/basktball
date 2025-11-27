import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail.includes("@")) {
      return NextResponse.json(
        { error: "Email format is invalid" },
        { status: 400 },
      );
    }

    await prisma.newsletter.upsert({
      where: { email: trimmedEmail },
      update: {
        subscribed: true,
        unsubscribedAt: null,
      },
      create: {
        email: trimmedEmail,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Newsletter subscribe error:", error);
    }
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 },
    );
  }
}


