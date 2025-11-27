import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
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
    const { cartItemId } = body as { cartItemId?: string };

    if (!cartItemId) {
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

      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            reserved: { decrement: cartItem.quantity },
            available: { increment: cartItem.quantity },
          },
        });
      }

      await tx.cartItem.delete({
        where: { id: cartItemId },
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Cart remove error:", error);
    }
    const message =
      error instanceof Error ? error.message : "Failed to remove cart item";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}


