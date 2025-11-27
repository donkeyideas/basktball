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
    const { paymentIntentId } = body as { paymentIntentId?: string };

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Missing paymentIntentId" },
        { status: 400 },
      );
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 },
      );
    }

    const orderTotal = cartItems.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          userId,
          status: "PROCESSING",
          subtotal: orderTotal,
          shipping: 0,
          tax: 0,
          discount: 0,
          total: orderTotal,
        },
      });

      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: item.productId,
            name: item.product.name,
            image: (item.product.images[0] as string) ?? "",
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.product.price,
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return createdOrder;
    });

    return NextResponse.json(
      { orderId: order.id, orderNumber: order.orderNumber },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Checkout confirm error:", error);
    }
    return NextResponse.json(
      { error: "Failed to confirm checkout" },
      { status: 500 },
    );
  }
}


