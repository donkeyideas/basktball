import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SupplierForm } from "./SupplierForm";

type SearchParams = {
  q?: string;
};

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = (searchParams.q ?? "").trim();

  const where: any = {};
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { country: { contains: query, mode: "insensitive" } },
    ];
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-800 bg-zinc-900/70 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Suppliers
            </h1>
            <p className="mt-1 text-xs text-neutral-400">
              Manage manufacturers and supply partners.
            </p>
          </div>
          <p className="text-[0.7rem] text-neutral-400">
            {suppliers.length} supplier{suppliers.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <section className="space-y-6 px-6 py-6">
        <form className="mb-2 flex w-full max-w-md items-center gap-2 text-xs">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search suppliers by name, email, country"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
          />
          <button
            type="submit"
            className="h-9 rounded-md border border-neutral-700 px-3 text-[0.7rem] uppercase tracking-[0.16em] text-neutral-200 hover:bg-neutral-900"
          >
            Search
          </button>
        </form>

        {/* Add supplier form */}
        <SupplierForm />

        {/* Supplier list */}
        <div className="overflow-hidden rounded-md border border-neutral-800 bg-zinc-950/60">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-zinc-900/80 text-[0.7rem] uppercase tracking-[0.16em] text-neutral-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Supplier</th>
                <th className="px-3 py-2 text-left font-medium">Contact</th>
                <th className="px-3 py-2 text-left font-medium">Country</th>
                <th className="px-3 py-2 text-right font-medium">MOQ</th>
                <th className="px-3 py-2 text-right font-medium">
                  Lead Time (days)
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  Quality / On-Time
                </th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-neutral-900 hover:bg-neutral-900/40"
                >
                  <td className="px-3 py-2 align-top">
                    <Link
                      href={`/admin/operations/suppliers/${encodeURIComponent(
                        s.id,
                      )}`}
                      className="inline-flex flex-col gap-0.5"
                    >
                      <span className="text-xs font-medium text-neutral-100">
                        {s.name}
                      </span>
                      <span className="text-[0.7rem] text-neutral-500">
                        {s.supplierType ?? "Supplier"}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 align-top text-[0.7rem] text-neutral-300">
                    {s.contactPerson && (
                      <span className="block">{s.contactPerson}</span>
                    )}
                    <span className="block text-neutral-400">{s.email}</span>
                    {s.phone && (
                      <span className="block text-neutral-500">{s.phone}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-[0.7rem] text-neutral-300">
                    {s.country}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[0.7rem] text-neutral-100">
                    {s.moq ?? "—"}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[0.7rem] text-neutral-100">
                    {s.leadTimeDays ?? "—"}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[0.7rem] text-neutral-100">
                    {s.qualityRating != null
                      ? `${s.qualityRating.toFixed(1)}/5`
                      : "—"}{" "}
                    {s.onTimeRate != null && (
                      <span className="ml-1 text-neutral-400">
                        ({s.onTimeRate.toFixed(1)}% on-time)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-xs text-neutral-500"
                  >
                    No suppliers yet. Use the form above to add your first
                    supplier.
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


