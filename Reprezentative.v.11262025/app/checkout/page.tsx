import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { CheckoutPayment } from "@/components/CheckoutPayment";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions as any);

  if (!session || !session.user) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Checkout
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            Please sign in to complete your purchase.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-white px-5 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  const userId = (session.user as any).id as string | undefined;

  if (!userId) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Checkout
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            We could not determine your account. Please sign out and sign back
            in.
          </p>
        </section>
      </main>
    );
  }

  const [cartItems, addresses] = await Promise.all([
    prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    }),
    prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Checkout
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            Your cart is empty. Add items to your cart before checking out.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-white px-5 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200"
          >
            Back to shop
          </Link>
        </section>
      </main>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  // Create payment intent for Stripe
  let clientSecret: string | null = null;
  try {
    const intentResponse = await fetch(
      `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/checkout/create-intent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        cache: "no-store",
      },
    );

    if (intentResponse.ok) {
      const data = (await intentResponse.json()) as { clientSecret?: string };
      clientSecret = data.clientSecret ?? null;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Failed to create payment intent for checkout:", error);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-900 bg-black/90 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Checkout
          </h1>
          <Link
            href="/cart"
            className="text-xs uppercase tracking-[0.18em] text-neutral-400 hover:text-white"
          >
            Back to cart
          </Link>
        </div>
      </div>

      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:flex-row md:px-8 md:py-12">
        {/* Order summary */}
        <aside className="order-2 w-full max-w-sm space-y-4 rounded-md border border-neutral-900 bg-neutral-950 p-4 text-sm md:order-1">
          <h2 className="text-base font-semibold tracking-tight">
            Order Summary
          </h2>
          <div className="space-y-2 text-xs text-neutral-300">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-neutral-100">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Shipping</span>
              <span>Calculated at payment</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Tax</span>
              <span>Calculated at payment</span>
            </div>
          </div>
          <div className="border-t border-neutral-900 pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-300">Estimated Total</span>
              <span className="text-sm font-semibold text-white">
                ${subtotal.toFixed(2)}
              </span>
            </div>
          </div>
          <p className="text-[0.7rem] text-neutral-500">
            Taxes and final shipping will be calculated when payment is
            processed.
          </p>
        </aside>

        {/* Shipping address & payment */}
        <div className="order-1 flex-1 space-y-4 rounded-md border border-neutral-900 bg-neutral-950 p-4 text-sm md:order-2">
          <h2 className="text-base font-semibold tracking-tight">
            Shipping &amp; Payment
          </h2>

          {/* Shipping address */}
          <div className="space-y-2 rounded-md border border-neutral-800 bg-black/40 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-neutral-200">
                Shipping address
              </p>
              <Link
                href="/account/addresses"
                className="text-[0.7rem] uppercase tracking-[0.18em] text-neutral-400 hover:text-white"
              >
                Manage
              </Link>
            </div>
            {addresses.length === 0 && (
              <p className="text-[0.7rem] text-neutral-400">
                You do not have any saved addresses yet. Add one in your
                account before placing an order.
              </p>
            )}
            {addresses.length > 0 && (
              <div className="rounded-md border border-neutral-800 bg-black p-3 text-[0.7rem] text-neutral-200">
                {addresses[0].label && (
                  <p className="text-neutral-400">{addresses[0].label}</p>
                )}
                <p>{addresses[0].name}</p>
                <p>{addresses[0].street}</p>
                <p>
                  {addresses[0].city}, {addresses[0].state}{" "}
                  {addresses[0].zipCode}
                </p>
                <p>{addresses[0].country}</p>
                <p className="mt-1 text-neutral-400">{addresses[0].phone}</p>
              </div>
            )}
          </div>

          {/* Stripe Payment Element */}
          <div className="space-y-2 rounded-md border border-neutral-800 bg-black/40 p-3 text-xs">
            <p className="font-semibold text-neutral-200">Payment</p>
            <p className="mb-2 text-[0.7rem] text-neutral-400">
              Enter your payment details below. Your card information is
              processed securely by Stripe.
            </p>
            <CheckoutPayment clientSecret={clientSecret} />
          </div>
        </div>
      </section>
    </main>
  );
}


