"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";

export type CogsFormValues = {
  fabricCost: number;
  fabricYards: number;
  trimsCost: number;
  packagingCost: number;
  laborCost: number;
  patternCost: number;
  gradingCost: number;
  sampleCost: number;
  printingCost: number;
  qcCost: number;
  freightCost: number;
  dutiesCost: number;
  brokerageCost: number;
  domesticShipping: number;
  warehousingCost: number;
  handlingCost: number;
  shrinkageRate: number;
  notes?: string;
};

export function CogsForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CogsFormValues>({
    defaultValues: {
      fabricCost: 0,
      fabricYards: 0,
      trimsCost: 0,
      packagingCost: 0,
      laborCost: 0,
      patternCost: 0,
      gradingCost: 0,
      sampleCost: 0,
      printingCost: 0,
      qcCost: 0,
      freightCost: 0,
      dutiesCost: 0,
      brokerageCost: 0,
      domesticShipping: 0,
      warehousingCost: 0,
      handlingCost: 0,
      shrinkageRate: 0,
      notes: "",
    },
  });

  const watched = watch();

  const totalCOGS = useMemo(() => {
    const numericFields: (keyof CogsFormValues)[] = [
      "fabricCost",
      "trimsCost",
      "packagingCost",
      "laborCost",
      "patternCost",
      "gradingCost",
      "sampleCost",
      "printingCost",
      "qcCost",
      "freightCost",
      "dutiesCost",
      "brokerageCost",
      "domesticShipping",
      "warehousingCost",
      "handlingCost",
    ];

    let total = 0;
    numericFields.forEach((key) => {
      const value = watched[key] ?? 0;
      if (typeof value === "number" && !Number.isNaN(value)) {
        total += value;
      }
    });

    // Treat shrinkage as percentage of total added on top
    const shrinkage = watched.shrinkageRate ?? 0;
    if (typeof shrinkage === "number" && shrinkage > 0) {
      total += total * (shrinkage / 100);
    }

    return total;
  }, [watched]);

  const onSubmit = async (data: CogsFormValues) => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      const payload = {
        ...data,
        totalCOGS,
      };
      // Placeholder API call – route to be implemented with real persistence.
      const res = await fetch(`/api/admin/finance/cogs/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to save COGS");
      }
      setStatus("COGS entry saved.");
    } catch (error) {
      console.error(error);
      setStatus("Error saving COGS entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const numberField = (
    name: keyof CogsFormValues,
    label: string,
    helper?: string,
  ) => (
    <div>
      <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </label>
      <input
        type="number"
        step="0.01"
        min="0"
        className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
        {...register(name, { valueAsNumber: true, min: 0 })}
      />
      {helper && (
        <p className="mt-1 text-[0.65rem] text-neutral-500">{helper}</p>
      )}
      {errors[name] && (
        <p className="mt-1 text-[0.7rem] text-red-400">
          {(errors[name] as any).message}
        </p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 rounded-md border border-neutral-800 bg-zinc-950/60 p-6 text-xs text-white"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            COGS for {productName}
          </h1>
          <p className="mt-1 text-[0.7rem] text-neutral-400">
            Enter detailed cost breakdown for this product. Total COGS is
            calculated automatically.
          </p>
        </div>
        <Link
          href="/admin/finance/cogs"
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-neutral-200 hover:bg-neutral-900"
        >
          Back to COGS Dashboard
        </Link>
      </div>

      {/* Materials */}
      <section className="space-y-3 rounded-md border border-neutral-800 bg-black/40 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
          Materials
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          {numberField("fabricCost", "Fabric Cost (per unit)")}
          {numberField("fabricYards", "Fabric Yards (per unit)", "For reference")}
          {numberField("trimsCost", "Trims Cost")}
          {numberField("packagingCost", "Packaging Cost")}
        </div>
      </section>

      {/* Manufacturing */}
      <section className="space-y-3 rounded-md border border-neutral-800 bg-black/40 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
          Manufacturing
        </h2>
        <div className="grid gap-4 md:grid-cols-5">
          {numberField("laborCost", "Cut & Sew Labor")}
          {numberField("patternCost", "Pattern Cost (per unit)")}
          {numberField("gradingCost", "Grading Cost (per unit)")}
          {numberField("sampleCost", "Sample Cost (per unit)")}
          {numberField("printingCost", "Printing/Embroidery")}
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {numberField("qcCost", "Quality Control")}
        </div>
      </section>

      {/* Freight */}
      <section className="space-y-3 rounded-md border border-neutral-800 bg-black/40 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
          Freight & Logistics
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          {numberField("freightCost", "International Freight")}
          {numberField("dutiesCost", "Duties / Tariffs")}
          {numberField("brokerageCost", "Customs Brokerage")}
          {numberField("domesticShipping", "Domestic Shipping")}
        </div>
      </section>

      {/* Inventory */}
      <section className="space-y-3 rounded-md border border-neutral-800 bg-black/40 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
          Inventory & Overhead
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          {numberField("warehousingCost", "Warehousing Cost")}
          {numberField("handlingCost", "Handling & Fulfillment")}
          {numberField(
            "shrinkageRate",
            "Shrinkage Rate (%)",
            "Percentage of units lost/damaged (applied to total).",
          )}
        </div>
      </section>

      {/* Notes + total */}
      <section className="space-y-3 rounded-md border border-neutral-800 bg-black/40 p-4">
        <div className="grid gap-4 md:grid-cols-[2fr,1fr] md:items-start">
          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Notes
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              placeholder="Any context about this cost structure (e.g., season, supplier, MOQ)."
              {...register("notes")}
            />
          </div>
          <div className="rounded-md border border-neutral-800 bg-black/60 p-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Total COGS (per unit)
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              ${totalCOGS.toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4">
        {status && (
          <p className="text-[0.7rem] text-neutral-300">{status}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="ml-auto inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save COGS Entry"}
        </button>
      </div>
    </form>
  );
}


