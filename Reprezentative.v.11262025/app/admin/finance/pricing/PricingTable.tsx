"use client";

import { useState } from "react";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  cogsPerUnit: number | null;
};

type Recommendation = {
  recommendedPrice: number;
  reasoning: string;
};

export function PricingTable({ products }: { products: ProductRow[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, Recommendation>>({});
  const [error, setError] = useState<string | null>(null);

  const handleRecommend = async (product: ProductRow) => {
    setLoadingId(product.id);
    setError(null);
    try {
      const res = await fetch("/api/ai/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          cogsPerUnit: product.cogsPerUnit,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch recommendation");
      }

      const data = (await res.json()) as Recommendation;
      setResults((prev) => ({
        ...prev,
        [product.id]: data,
      }));
    } catch (err) {
      console.error(err);
      setError("Error getting AI recommendation.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-neutral-800 bg-zinc-950/60 p-4 text-xs">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-300">
          AI Pricing Recommendations
        </h2>
        {error && (
          <p className="text-[0.7rem] text-red-400">{error}</p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead className="bg-zinc-900/80 text-[0.7rem] uppercase tracking-[0.16em] text-neutral-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Product</th>
              <th className="px-3 py-2 text-left font-medium">Category</th>
              <th className="px-3 py-2 text-right font-medium">Price</th>
              <th className="px-3 py-2 text-right font-medium">COGS</th>
              <th className="px-3 py-2 text-right font-medium">Margin %</th>
              <th className="px-3 py-2 text-center font-medium">
                AI Recommendation
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const margin =
                p.cogsPerUnit != null && p.price > 0
                  ? ((p.price - p.cogsPerUnit) / p.price) * 100
                  : null;
              const rec = results[p.id];
              return (
                <tr
                  key={p.id}
                  className="border-t border-neutral-900 align-top hover:bg-neutral-900/40"
                >
                  <td className="px-3 py-2 text-xs text-neutral-100">
                    {p.name}
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-300">
                    {p.category}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-neutral-100">
                    ${p.price.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-neutral-100">
                    {p.cogsPerUnit != null
                      ? `$${p.cogsPerUnit.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-neutral-100">
                    {margin != null ? `${margin.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-2 text-center text-xs">
                    <button
                      type="button"
                      onClick={() => handleRecommend(p)}
                      disabled={loadingId === p.id}
                      className="mb-2 inline-flex items-center justify-center rounded-md border border-sky-500 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-sky-300 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingId === p.id
                        ? "Requesting..."
                        : "Get AI Recommendation"}
                    </button>
                    {rec && (
                      <div className="mt-1 space-y-1 text-left text-[0.7rem] text-neutral-200">
                        <p>
                          <span className="font-semibold">Recommended:</span>{" "}
                          ${rec.recommendedPrice.toFixed(2)}
                        </p>
                        <p className="text-neutral-400">{rec.reasoning}</p>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-xs text-neutral-500"
                >
                  No products available for pricing analysis.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


