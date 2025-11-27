import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: "User session is missing an id" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const {
      name,
      phone,
      marketingEmails,
      orderEmails,
      newArrivalsEmails,
    } = body as {
      name?: string;
      phone?: string;
      marketingEmails?: boolean;
      orderEmails?: boolean;
      newArrivalsEmails?: boolean;
    };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        marketingEmails: Boolean(marketingEmails),
        orderEmails: Boolean(orderEmails),
        newArrivalsEmails: Boolean(newArrivalsEmails),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        marketingEmails: true,
        orderEmails: true,
        newArrivalsEmails: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Profile update error:", error);
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}


