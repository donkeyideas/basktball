import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function SupplierDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              sku: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!supplier) {
    return (
      <main className="min-h-screen bg-black px-6 py-6 text-white">
        <p className="text-sm text-neutral-300">Supplier not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-800 bg-zinc-900/70 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {supplier.name}
            </h1>
            <p className="mt-1 text-xs text-neutral-400">
              {supplier.supplierType ?? "Supplier"} • {supplier.country}
            </p>
          </div>
          <Link
            href="/admin/operations/suppliers"
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-neutral-200 hover:bg-neutral-900"
          >
            Back to suppliers
          </Link>
        </div>
      </div>

      <section className="space-y-6 px-6 py-6 text-xs">
        {/* Supplier info */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1 rounded-md border border-neutral-800 bg-zinc-950/60 p-4">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-300">
              Contact
            </h2>
            {supplier.contactPerson && (
              <p className="text-neutral-200">{supplier.contactPerson}</p>
            )}
            <p className="text-neutral-400">{supplier.email}</p>
            {supplier.phone && (
              <p className="text-neutral-400">{supplier.phone}</p>
            )}
          </div>
          <div className="space-y-1 rounded-md border border-neutral-800 bg-zinc-950/60 p-4">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-300">
              Terms
            </h2>
            <p className="text-neutral-300">
              MOQ:{" "}
              <span className="text-neutral-100">
                {supplier.moq ?? "Not set"}
              </span>
            </p>
            <p className="text-neutral-300">
              Lead time:{" "}
              <span className="text-neutral-100">
                {supplier.leadTimeDays != null
                  ? `${supplier.leadTimeDays} days`
                  : "Not set"}
              </span>
            </p>
            {supplier.paymentTerms && (
              <p className="text-neutral-300">
                Payment terms:{" "}
                <span className="text-neutral-100">
                  {supplier.paymentTerms}
                </span>
              </p>
            )}
          </div>
          <div className="space-y-1 rounded-md border border-neutral-800 bg-zinc-950/60 p-4">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-300">
              Performance
            </h2>
            <p className="text-neutral-300">
              Quality:{" "}
              <span className="text-neutral-100">
                {supplier.qualityRating != null
                  ? `${supplier.qualityRating.toFixed(1)}/5`
                  : "N/A"}
              </span>
            </p>
            <p className="text-neutral-300">
              On-time:{" "}
              <span className="text-neutral-100">
                {supplier.onTimeRate != null
                  ? `${supplier.onTimeRate.toFixed(1)}%`
                  : "N/A"}
              </span>
            </p>
            <p className="text-neutral-300">
              Defect rate:{" "}
              <span className="text-neutral-100">
                {supplier.defectRate != null
                  ? `${supplier.defectRate.toFixed(1)}%`
                  : "N/A"}
              </span>
            </p>
          </div>
        </div>

        {/* Products supplied */}
        <div className="space-y-3 rounded-md border border-neutral-800 bg-zinc-950/60 p-4">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-300">
            Products Supplied
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead className="bg-zinc-900/80 text-[0.7rem] uppercase tracking-[0.16em] text-neutral-400">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Product</th>
                  <th className="px-3 py-2 text-left font-medium">Category</th>
                  <th className="px-3 py-2 text-left font-medium">SKU</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Unit Price
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    MOQ (Supplier)
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Lead Time (days)
                  </th>
                </tr>
              </thead>
              <tbody>
                {supplier.products.map((sp) => (
                  <tr
                    key={sp.id}
                    className="border-t border-neutral-900 hover:bg-neutral-900/40"
                  >
                    <td className="px-3 py-2 align-top text-xs text-neutral-100">
                      {sp.product.name}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-neutral-300">
                      {sp.product.category}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-neutral-300">
                      {sp.product.sku}
                    </td>
                    <td className="px-3 py-2 align-top text-right text-xs text-neutral-100">
                      ${sp.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 align-top text-right text-xs text-neutral-100">
                      {sp.moq ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-right text-xs text-neutral-100">
                      {sp.leadTimeDays ?? "—"}
                    </td>
                  </tr>
                ))}
                {supplier.products.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-xs text-neutral-500"
                    >
                      No products linked to this supplier yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}


