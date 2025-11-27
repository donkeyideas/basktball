import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export default async function CartPage() {
  const session = await getServerSession(authOptions as any);

  if (!session || !session.user) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Your cart
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            Please sign in to view and manage your cart.
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
            Your cart
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            We could not determine your account. Please sign out and sign back
            in.
          </p>
        </section>
      </main>
    );
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-900 bg-black/90 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.18em] text-neutral-400 hover:text-white"
          >
            Continue shopping
          </Link>
        </div>
      </div>

      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:flex-row md:px-8 md:py-12">
        <div className="flex-1 space-y-4">
          {cartItems.length === 0 && (
            <p className="text-sm text-neutral-400">
              Your cart is empty. Explore the collection and add your first
              piece.
            </p>
          )}

          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 border-b border-neutral-900 pb-4 last:border-b-0"
            >
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-neutral-900">
                {item.product.images?.length ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.images[0] as string}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#27272a,_#000)]" />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between text-sm">
                <div>
                  <p className="font-medium text-white">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {item.color} • {item.size}
                  </p>
                </div>
                <div className="flex items-end justify-between text-xs text-neutral-300">
                  <p>Qty: {item.quantity}</p>
                  <p className="text-sm text-white">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="w-full max-w-sm space-y-4 rounded-md border border-neutral-900 bg-neutral-950 p-4 text-sm">
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
              <span>Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Tax</span>
              <span>Calculated at checkout</span>
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

          <Link
            href="/checkout"
            className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-white px-4 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200"
          >
            Proceed to Checkout
          </Link>
        </aside>
      </section>
    </main>
  );
}


