import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || !session.user) {
      return NextResponse.json({ addresses: [] }, { status: 200 });
    }

    const userId = (session.user as any).id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: "User session is missing an id" },
        { status: 400 },
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Addresses GET error:", error);
    }
    return NextResponse.json(
      { error: "Failed to load addresses" },
      { status: 500 },
    );
  }
}

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
      label,
      name,
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault,
    } = body as {
      label?: string;
      name?: string;
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      phone?: string;
      isDefault?: boolean;
    };

    if (
      !name ||
      !street ||
      !city ||
      !state ||
      !zipCode ||
      !country ||
      !phone
    ) {
      return NextResponse.json(
        { error: "All address fields are required" },
        { status: 400 },
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          label,
          name,
          street,
          city,
          state,
          zipCode,
          country,
          phone,
          isDefault: Boolean(isDefault),
        },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Addresses POST error:", error);
    }
    return NextResponse.json(
      { error: "Failed to save address" },
      { status: 500 },
    );
  }
}


