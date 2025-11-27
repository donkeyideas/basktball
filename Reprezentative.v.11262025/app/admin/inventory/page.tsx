import { prisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 10;

export default async function AdminInventoryPage() {
  const variants = await prisma.productVariant.findMany({
    include: {
      product: {
        select: {
          name: true,
          sku: true,
          category: true,
        },
      },
    },
    orderBy: [
      { available: "asc" },
      { product: { name: "asc" } },
      { size: "asc" },
    ],
  });

  const totalVariants = variants.length;

  const levelLabel = (available: number) => {
    if (available <= 0) return "Out of stock";
    if (available < LOW_STOCK_THRESHOLD) return "Low";
    return "In stock";
  };

  const levelColorClasses = (available: number) => {
    if (available <= 0) {
      return "bg-red-500/15 text-red-300 border-red-500/40";
    }
    if (available < LOW_STOCK_THRESHOLD) {
      return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    }
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-800 bg-zinc-900/70 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Inventory Manager
            </h1>
            <p className="mt-1 text-xs text-neutral-400">
              View stock levels across all variants. Color-coded by availability.
            </p>
          </div>
          <p className="text-[0.7rem] text-neutral-400">
            {totalVariants} variant{totalVariants === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <section className="px-6 py-6">
        <div className="overflow-hidden rounded-md border border-neutral-800 bg-zinc-950/60">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-zinc-900/80 text-[0.7rem] uppercase tracking-[0.16em] text-neutral-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Product</th>
                <th className="px-3 py-2 text-left font-medium">Color</th>
                <th className="px-3 py-2 text-left font-medium">Size</th>
                <th className="px-3 py-2 text-right font-medium">Stock</th>
                <th className="px-3 py-2 text-right font-medium">Reserved</th>
                <th className="px-3 py-2 text-right font-medium">Available</th>
                <th className="px-3 py-2 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr
                  key={variant.id}
                  className="border-t border-neutral-900 hover:bg-neutral-900/40"
                >
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-white">
                        {variant.product.name}
                      </span>
                      <span className="text-[0.7rem] text-neutral-500">
                        {variant.product.sku} • {variant.product.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full border border-neutral-700"
                        style={{ backgroundColor: variant.colorHex }}
                      />
                      <span className="text-xs text-neutral-200">
                        {variant.color}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-neutral-200">
                    {variant.size}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-xs text-neutral-100">
                    {variant.stock}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-xs text-neutral-100">
                    {variant.reserved}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-xs text-neutral-100">
                    {variant.available}
                  </td>
                  <td className="px-3 py-2 align-top text-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-full border px-2 py-1 text-[0.65rem] font-semibold ${levelColorClasses(
                        variant.available,
                      )}`}
                    >
                      {levelLabel(variant.available)}
                    </span>
                  </td>
                </tr>
              ))}
              {variants.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-xs text-neutral-500"
                  >
                    No variants found. Once products and variants are created,
                    they will appear here.
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


