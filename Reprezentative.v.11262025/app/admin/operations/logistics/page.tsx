import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UpdateTrackingForm } from "./UpdateTrackingForm";

export default async function LogisticsPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-800 bg-zinc-900/70 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Shipments
            </h1>
            <p className="mt-1 text-xs text-neutral-400">
              Basic outbound shipment tracking for recent orders.
            </p>
          </div>
        </div>
      </div>

      <section className="px-6 py-6">
        <div className="overflow-x-auto rounded-md border border-neutral-800 bg-zinc-950/60">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-zinc-900/80 text-[0.7rem] uppercase tracking-[0.16em] text-neutral-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Order</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">
                  Tracking / Carrier
                </th>
                <th className="px-3 py-2 text-left font-medium">
                  Shipped / Delivered
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-neutral-900 hover:bg-neutral-900/40"
                >
                  <td className="px-3 py-2 align-top text-xs text-neutral-100">
                    <div className="flex flex-col gap-0.5">
                      <span>{order.orderNumber}</span>
                      <span className="text-[0.7rem] text-neutral-500">
                        {order.createdAt.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-[0.7rem] text-neutral-200">
                    {order.status}
                  </td>
                  <td className="px-3 py-2 align-top text-[0.7rem] text-neutral-200">
                    <div className="space-y-1">
                      {order.trackingNumber && order.carrier ? (
                        <Link
                          href="#"
                          className="text-sky-400 hover:underline"
                        >
                          {order.trackingNumber} ({order.carrier})
                        </Link>
                      ) : (
                        <span className="text-neutral-500">
                          No tracking assigned
                        </span>
                      )}
                      <UpdateTrackingForm
                        orderId={order.id}
                        trackingNumber={order.trackingNumber}
                        carrier={order.carrier}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-[0.7rem] text-neutral-200">
                    <div className="flex flex-col gap-0.5">
                      <span>
                        Shipped:{" "}
                        <span className="text-neutral-300">
                          {order.shippedAt
                            ? order.shippedAt.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </span>
                      </span>
                      <span>
                        Delivered:{" "}
                        <span className="text-neutral-300">
                          {order.deliveredAt
                            ? order.deliveredAt.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </span>
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-xs text-neutral-500"
                  >
                    No orders found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}


