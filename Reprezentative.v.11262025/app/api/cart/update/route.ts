import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest) {
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
    const { cartItemId, quantity } = body as {
      cartItemId?: string;
      quantity?: number;
    };

    if (!cartItemId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: cartItemId },
      });

      if (!cartItem || cartItem.userId !== userId) {
        throw new Error("Cart item not found");
      }

      const variant = await tx.productVariant.findUnique({
        where: {
          productId_color_size: {
            productId: cartItem.productId,
            color: cartItem.color,
            size: cartItem.size,
          },
        },
      });

      if (!variant) {
        throw new Error("Variant not found");
      }

      const delta = quantity - cartItem.quantity;

      if (delta > 0 && variant.available < delta) {
        throw new Error("Insufficient stock");
      }

      await tx.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });

      if (delta !== 0) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            reserved: { increment: delta },
            available: { decrement: delta },
          },
        });
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Cart update error:", error);
    }
    const message =
      error instanceof Error ? error.message : "Failed to update cart";
    return NextResponse.json(
      { error: message },
      { status: message === "Insufficient stock" ? 400 : 500 },
    );
  }
}


