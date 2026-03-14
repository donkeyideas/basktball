import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getDualUser } from "@/lib/court/dual-auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDualUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: {
        id: true,
        challengedId: true,
        status: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found" },
        { status: 404 }
      );
    }

    // Must be the challenged user
    if (challenge.challengedId !== user.id) {
      return NextResponse.json(
        { message: "Only the challenged user can decline this challenge" },
        { status: 403 }
      );
    }

    // Must be in OPEN status
    if (challenge.status !== "OPEN") {
      return NextResponse.json(
        { message: `Challenge cannot be declined (current status: ${challenge.status})` },
        { status: 400 }
      );
    }

    const updatedChallenge = await prisma.challenge.update({
      where: { id },
      data: { status: "DECLINED" },
      include: {
        challenger: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            image: true,
          },
        },
        challenged: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ challenge: updatedChallenge });
  } catch (error) {
    console.error("Decline challenge error:", error);
    return NextResponse.json(
      { message: "Failed to decline challenge" },
      { status: 500 }
    );
  }
}
