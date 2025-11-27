"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";

export type AdminProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: number;
  sku: string;
  category: string;
  featured: boolean;
  isNew: boolean;
  inStock: boolean;
  // COGS fields (UI only for now – persistence will come with ProductCOGS)
  fabricCost: number;
  laborCost: number;
  freightCost: number;
  inventoryCost: number;
};

export type AdminProductInitial = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  sku: string;
  category: string;
  featured: boolean;
  isNew: boolean;
  inStock: boolean;
};

export function ProductForm({ product }: { product: AdminProductInitial }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminProductFormValues>({
    defaultValues: {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      sku: product.sku,
      category: product.category,
      featured: product.featured,
      isNew: product.isNew,
      inStock: product.inStock,
      fabricCost: 0,
      laborCost: 0,
      freightCost: 0,
      inventoryCost: 0,
    },
  });

  const onSubmit = async (data: AdminProductFormValues) => {
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // Placeholder – API route or server action will be wired later.
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save product");
      }

      setStatusMessage("Product saved successfully.");
    } catch (error) {
      console.error(error);
      setStatusMessage("There was an error saving this product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 rounded-md border border-neutral-800 bg-zinc-950/60 p-6 text-xs text-white"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Edit Product
          </h1>
          <p className="mt-1 text-[0.7rem] text-neutral-400">
            Update product details, pricing, and cost of goods.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-neutral-200 hover:bg-neutral-900"
        >
          Back to list
        </Link>
      </div>

      {/* Basic info */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
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
              Slug
            </label>
            <input
              type="text"
              className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              {...register("slug", { required: "Slug is required" })}
            />
            {errors.slug && (
              <p className="mt-1 text-[0.7rem] text-red-400">
                {errors.slug.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              SKU
            </label>
            <input
              type="text"
              className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              {...register("sku", { required: "SKU is required" })}
            />
            {errors.sku && (
              <p className="mt-1 text-[0.7rem] text-red-400">
                {errors.sku.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Category
            </label>
            <input
              type="text"
              className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              {...register("category", { required: "Category is required" })}
            />
            {errors.category && (
              <p className="mt-1 text-[0.7rem] text-red-400">
                {errors.category.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Description
            </label>
            <textarea
              rows={6}
              className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                {...register("price", {
                  required: "Price is required",
                  valueAsNumber: true,
                  min: { value: 0, message: "Price must be positive" },
                })}
              />
              {errors.price && (
                <p className="mt-1 text-[0.7rem] text-red-400">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-[0.7rem] font-medium text-neutral-300">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-neutral-700 bg-black text-emerald-500"
                  {...register("featured")}
                />
                Featured
              </label>
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-[0.7rem] font-medium text-neutral-300">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-neutral-700 bg-black text-blue-500"
                  {...register("inStock")}
                />
                In Stock
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[0.7rem] font-medium text-neutral-300">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-neutral-700 bg-black text-amber-500"
                {...register("isNew")}
              />
              Mark as New Arrival
            </label>
          </div>
        </div>
      </section>

      {/* COGS section */}
      <section className="space-y-4 rounded-md border border-neutral-800 bg-black/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
              Cost of Goods (COGS)
            </h2>
            <p className="mt-1 text-[0.7rem] text-neutral-500">
              Track true cost per item. These fields will map to the Finance
              Hub&apos;s COGS Manager.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Materials
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              {...register("fabricCost", {
                valueAsNumber: true,
                min: { value: 0, message: "Must be positive" },
              })}
            />
            {errors.fabricCost && (
              <p className="mt-1 text-[0.7rem] text-red-400">
                {errors.fabricCost.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Manufacturing
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              {...register("laborCost", {
                valueAsNumber: true,
                min: { value: 0, message: "Must be positive" },
              })}
            />
            {errors.laborCost && (
              <p className="mt-1 text-[0.7rem] text-red-400">
                {errors.laborCost.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Freight & Duties
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              {...register("freightCost", {
                valueAsNumber: true,
                min: { value: 0, message: "Must be positive" },
              })}
            />
            {errors.freightCost && (
              <p className="mt-1 text-[0.7rem] text-red-400">
                {errors.freightCost.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Inventory & Handling
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              {...register("inventoryCost", {
                valueAsNumber: true,
                min: { value: 0, message: "Must be positive" },
              })}
            />
            {errors.inventoryCost && (
              <p className="mt-1 text-[0.7rem] text-red-400">
                {errors.inventoryCost.message}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4">
        {statusMessage && (
          <p className="text-[0.7rem] text-neutral-300">{statusMessage}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="ml-auto inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}


