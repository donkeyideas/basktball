import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || !session.user) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const userId = (session.user as any).id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: "User session is missing an id" },
        { status: 400 },
      );
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ items: cartItems }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Cart GET error:", error);
    }
    return NextResponse.json(
      { error: "Failed to load cart" },
      { status: 500 },
    );
  }
}


