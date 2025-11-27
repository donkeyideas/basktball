"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

export type SupplierFormValues = {
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  country: string;
  supplierType?: string;
  moq?: number;
  leadTimeDays?: number;
  qualityRating?: number;
  onTimeRate?: number;
  defectRate?: number;
  communicationRating?: number;
  notes?: string;
};

export function SupplierForm({ supplierId }: { supplierId?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>();

  const onSubmit = async (values: SupplierFormValues) => {
    setSubmitting(true);
    setStatus(null);
    try {
      const payload = { ...values };
      const url = supplierId
        ? `/api/admin/operations/suppliers/${supplierId}`
        : "/api/admin/operations/suppliers";
      const method = supplierId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save supplier");
      setStatus("Supplier saved.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus("Error saving supplier.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-md border border-neutral-800 bg-zinc-950/60 p-4 text-xs text-white"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-300">
          {supplierId ? "Edit Supplier" : "Add Supplier"}
        </h2>
        {status && (
          <p className="text-[0.7rem] text-neutral-400">{status}</p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Name
          </label>
          <input
            type="text"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="mt-1 text-[0.7rem] text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Contact Person
          </label>
          <input
            type="text"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("contactPerson")}
          />
        </div>

        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Email
          </label>
          <input
            type="email"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="mt-1 text-[0.7rem] text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Phone
          </label>
          <input
            type="text"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("phone")}
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Country
          </label>
          <input
            type="text"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("country", { required: "Country is required" })}
          />
          {errors.country && (
            <p className="mt-1 text-[0.7rem] text-red-400">
              {errors.country.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Type
          </label>
          <input
            type="text"
            placeholder="FABRIC, MANUFACTURER, etc."
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("supplierType")}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            MOQ
          </label>
          <input
            type="number"
            min="0"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("moq", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Lead Time (days)
          </label>
          <input
            type="number"
            min="0"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("leadTimeDays", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Quality Rating (1–5)
          </label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="5"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("qualityRating", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            On-Time Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("onTimeRate", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Defect Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("defectRate", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Communication Rating (1–5)
          </label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="5"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("communicationRating", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Notes
          </label>
          <input
            type="text"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("notes")}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : supplierId ? "Save Changes" : "Add Supplier"}
        </button>
      </div>
    </form>
  );
}


