import { prisma } from "@/lib/prisma";
import { PricingTable } from "./PricingTable";

export default async function PricingPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  const cogsEntries = await prisma.productCOGS.findMany({
    orderBy: { effectiveDate: "desc" },
  });

  const latestCogsPerProduct = new Map<string, number>();
  for (const entry of cogsEntries) {
    if (latestCogsPerProduct.has(entry.productId)) continue;
    latestCogsPerProduct.set(entry.productId, entry.totalCOGS);
  }

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    cogsPerUnit: latestCogsPerProduct.get(p.id) ?? null,
  }));

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-800 bg-zinc-900/70 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              AI Pricing Engine
            </h1>
            <p className="mt-1 text-xs text-neutral-400">
              Analyze pricing against COGS and get AI-powered recommendations.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-6 px-6 py-6">
        <PricingTable products={rows} />
      </section>
    </main>
  );
}


