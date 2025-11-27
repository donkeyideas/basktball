import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

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

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
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

    // Amount in cents
    const amount = cartItems.reduce((sum, item) => {
      const line = Math.round(item.product.price * 100) * item.quantity;
      return sum + line;
    }, 0);

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        userId,
      },
    });

    return NextResponse.json(
      { clientSecret: intent.client_secret },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Create payment intent error:", error);
    }
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 },
    );
  }
}


