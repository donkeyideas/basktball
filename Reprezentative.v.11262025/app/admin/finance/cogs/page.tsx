import Link from "next/link";
import { prisma } from "@/lib/prisma";

type LatestCogs = {
  productId: string;
  productName: string;
  category: string;
  totalCOGS: number;
  materials: number;
  manufacturing: number;
  freight: number;
  inventory: number;
  effectiveDate: Date;
};

export default async function CogsDashboardPage() {
  const cogsEntries = await prisma.productCOGS.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
    orderBy: { effectiveDate: "desc" },
  });

  // Build latest COGS per product
  const latestByProduct = new Map<string, LatestCogs>();

  for (const entry of cogsEntries) {
    if (latestByProduct.has(entry.productId)) continue;

    const materials =
      entry.fabricCost + entry.trimsCost + entry.packagingCost;
    const manufacturing =
      entry.laborCost +
      entry.patternCost +
      entry.gradingCost +
      entry.sampleCost +
      entry.printingCost +
      entry.qcCost;
    const freight =
      entry.freightCost +
      entry.dutiesCost +
      entry.brokerageCost +
      entry.domesticShipping;
    const inventory = entry.warehousingCost + entry.handlingCost;

    latestByProduct.set(entry.productId, {
      productId: entry.productId,
      productName: entry.product.name,
      category: entry.product.category,
      totalCOGS: entry.totalCOGS,
      materials,
      manufacturing,
      freight,
      inventory,
      effectiveDate: entry.effectiveDate,
    });
  }

  const latest = Array.from(latestByProduct.values());

  const totalCOGS = latest.reduce((sum, item) => sum + item.totalCOGS, 0);
  const totalMaterials = latest.reduce((sum, i) => sum + i.materials, 0);
  const totalManufacturing = latest.reduce(
    (sum, i) => sum + i.manufacturing,
    0,
  );
  const totalFreight = latest.reduce((sum, i) => sum + i.freight, 0);
  const totalInventory = latest.reduce((sum, i) => sum + i.inventory, 0);

  const topCostProducts = [...latest]
    .sort((a, b) => b.totalCOGS - a.totalCOGS)
    .slice(0, 5);

  const history = cogsEntries.slice(0, 15);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-800 bg-zinc-900/70 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              COGS Manager
            </h1>
            <p className="mt-1 text-xs text-neutral-400">
              Track materials, manufacturing, freight, and inventory costs by
              product.
            </p>
          </div>
        </div>
      </div>

      <section className="px-6 py-6 space-y-8">
        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 p-4">
            <p className="text-[0.7rem] uppercase tracking-[0.16em]">
              Total COGS
            </p>
            <p className="mt-2 text-2xl font-semibold">
              ${totalCOGS.toFixed(2)}
            </p>
            <p className="mt-1 text-[0.7rem] opacity-90">
              Across {latest.length} products
            </p>
          </div>
          <div className="rounded-md bg-gradient-to-br from-sky-500 to-sky-600 p-4">
            <p className="text-[0.7rem] uppercase tracking-[0.16em]">
              Materials
            </p>
            <p className="mt-2 text-xl font-semibold">
              ${totalMaterials.toFixed(2)}
            </p>
          </div>
          <div className="rounded-md bg-gradient-to-br from-purple-500 to-purple-600 p-4">
            <p className="text-[0.7rem] uppercase tracking-[0.16em]">
              Manufacturing
            </p>
            <p className="mt-2 text-xl font-semibold">
              ${totalManufacturing.toFixed(2)}
            </p>
          </div>
          <div className="rounded-md bg-gradient-to-br from-amber-500 to-amber-600 p-4">
            <p className="text-[0.7rem] uppercase tracking-[0.16em]">
              Freight & Inventory
            </p>
            <p className="mt-2 text-xl font-semibold">
              ${(totalFreight + totalInventory).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Breakdown + top products */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          {/* COGS breakdown chart (simple bar representation) */}
          <div className="space-y-3 rounded-md border border-neutral-800 bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
                  COGS Breakdown
                </h2>
                <p className="mt-1 text-[0.7rem] text-neutral-500">
                  Distribution across materials, manufacturing, freight, and
                  inventory.
                </p>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {[
                {
                  label: "Materials",
                  value: totalMaterials,
                  color: "bg-emerald-500",
                },
                {
                  label: "Manufacturing",
                  value: totalManufacturing,
                  color: "bg-sky-500",
                },
                {
                  label: "Freight",
                  value: totalFreight,
                  color: "bg-amber-500",
                },
                {
                  label: "Inventory",
                  value: totalInventory,
                  color: "bg-purple-500",
                },
              ].map((item) => {
                const pct =
                  totalCOGS > 0 ? (item.value / totalCOGS) * 100 : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[0.75rem]">
                      <span className="text-neutral-300">{item.label}</span>
                      <span className="text-neutral-400">
                        ${item.value.toFixed(2)}{" "}
                        <span className="ml-1 text-[0.7rem] text-neutral-500">
                          ({pct.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-900">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${pct || 2}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Products with highest COGS */}
          <div className="space-y-3 rounded-md border border-neutral-800 bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
                Highest COGS Products
              </h2>
            </div>
            <div className="divide-y divide-neutral-900">
              {topCostProducts.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div>
                    <p className="text-xs font-medium text-white">
                      {item.productName}
                    </p>
                    <p className="text-[0.7rem] text-neutral-500">
                      {item.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-neutral-100">
                      ${item.totalCOGS.toFixed(2)}
                    </p>
                    <Link
                      href={`/admin/finance/cogs/${item.productId}`}
                      className="text-[0.7rem] text-sky-400 hover:underline"
                    >
                      Edit COGS →
                    </Link>
                  </div>
                </div>
              ))}
              {topCostProducts.length === 0 && (
                <p className="py-4 text-center text-[0.7rem] text-neutral-500">
                  No COGS entries yet. Start by adding COGS for a product.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cost history timeline */}
        <div className="space-y-3 rounded-md border border-neutral-800 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
              Recent COGS History
            </h2>
          </div>
          <div className="space-y-2 text-[0.75rem]">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-neutral-900 pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-xs text-white">
                    {entry.product.name}{" "}
                    <span className="ml-1 text-[0.7rem] text-neutral-500">
                      ({entry.product.category})
                    </span>
                  </p>
                  <p className="text-[0.7rem] text-neutral-500">
                    Effective{" "}
                    {entry.effectiveDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-neutral-100">
                    ${entry.totalCOGS.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="py-4 text-center text-[0.7rem] text-neutral-500">
                No COGS history yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}


