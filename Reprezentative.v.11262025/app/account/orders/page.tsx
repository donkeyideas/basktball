import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export default async function AccountOrdersPage() {
  const session = await getServerSession(authOptions as any);

  if (!session || !session.user) {
    return (
      <main className="min-h-screen bg-black text-white">
        <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Your orders
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            Please sign in to view your order history.
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
        <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Your orders
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            We could not determine your account. Please sign out and sign back
            in.
          </p>
        </section>
      </main>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-900 bg-black/90 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Your orders
          </h1>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.18em] text-neutral-400 hover:text-white"
          >
            Continue shopping
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
        {orders.length === 0 && (
          <p className="text-sm text-neutral-400">
            You have not placed any orders yet.
          </p>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="space-y-2 rounded-md border border-neutral-900 bg-neutral-950 p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Order {order.orderNumber}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Placed{" "}
                    {order.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold text-white">
                    ${order.total.toFixed(2)}
                  </p>
                  <p className="text-neutral-400">{order.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}


