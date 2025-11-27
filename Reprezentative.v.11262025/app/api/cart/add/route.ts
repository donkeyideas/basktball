import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = (session.user as any).id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: "User session is missing an id" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { productId, size, color, quantity } = body as {
      productId?: string;
      size?: string;
      color?: string;
      quantity?: number;
    };

    if (!productId || !size || !color || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: {
          productId_color_size: {
            productId,
            color,
            size,
          },
        },
      });

      if (!variant) {
        throw new Error("Variant not found");
      }

      if (variant.available < quantity) {
        throw new Error("Insufficient stock");
      }

      const existing = await tx.cartItem.findUnique({
        where: {
          userId_productId_size_color: {
            userId,
            productId,
            size,
            color,
          },
        },
      });

      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            userId,
            productId,
            size,
            color,
            quantity,
          },
        });
      }

      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          reserved: { increment: quantity },
          available: { decrement: quantity },
        },
      });

      return true;
    });

    return NextResponse.json({ success: result }, { status: 200 });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Cart add error:", error);
    }
    const message =
      error instanceof Error ? error.message : "Failed to add to cart";
    return NextResponse.json(
      { error: message },
      { status: message === "Insufficient stock" ? 400 : 500 },
    );
  }
}


