"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

export type ExpenseFormValues = {
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  isRecurring: boolean;
  frequency?: string;
  notes?: string;
};

export function ExpenseForm() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    defaultValues: {
      category: "",
      description: "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      vendor: "",
      isRecurring: false,
      frequency: "",
      notes: "",
    },
  });

  const isRecurring = watch("isRecurring");

  const onSubmit = async (values: ExpenseFormValues) => {
    setSubmitting(true);
    setStatus(null);
    try {
      const payload = {
        ...values,
        amount: Number(values.amount),
      };
      const res = await fetch("/api/admin/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add expense");
      setStatus("Expense added.");
      reset({
        category: values.category,
        description: "",
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        vendor: "",
        isRecurring: values.isRecurring,
        frequency: values.frequency,
        notes: "",
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus("Error adding expense.");
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
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
          Add Expense
        </h2>
        {status && (
          <p className="text-[0.7rem] text-neutral-400">{status}</p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Category
          </label>
          <select
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-2 text-xs text-white outline-none focus:border-neutral-500"
            {...register("category", { required: "Category is required" })}
          >
            <option value="">Select category</option>
            <option value="MARKETING">Marketing</option>
            <option value="PLATFORM">Platform & Tools</option>
            <option value="TEAM">Team & Overhead</option>
            <option value="RETURNS">Returns & Customer Service</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.category && (
            <p className="mt-1 text-[0.7rem] text-red-400">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Amount (USD)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("amount", {
              required: "Amount is required",
              valueAsNumber: true,
              min: { value: 0, message: "Amount must be positive" },
            })}
          />
          {errors.amount && (
            <p className="mt-1 text-[0.7rem] text-red-400">
              {errors.amount.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Date
          </label>
          <input
            type="date"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none focus:border-neutral-500"
            {...register("date", { required: "Date is required" })}
          />
          {errors.date && (
            <p className="mt-1 text-[0.7rem] text-red-400">
              {errors.date.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Vendor
          </label>
          <input
            type="text"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("vendor")}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.5fr,1fr] md:items-start">
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Description
          </label>
          <input
            type="text"
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            {...register("description", {
              required: "Description is required",
            })}
          />
          {errors.description && (
            <p className="mt-1 text-[0.7rem] text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[0.7rem] font-medium text-neutral-300">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-neutral-700 bg-black text-emerald-500"
              {...register("isRecurring")}
            />
            Recurring expense
          </label>
          {isRecurring && (
            <select
              className="h-9 w-full rounded-md border border-neutral-800 bg-black px-2 text-xs text-white outline-none focus:border-neutral-500"
              {...register("frequency")}
            >
              <option value="">Frequency</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          Notes
        </label>
        <textarea
          rows={2}
          className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
          {...register("notes")}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Add Expense"}
        </button>
      </div>
    </form>
  );
}


