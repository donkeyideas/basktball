import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm, type AdminProductInitial } from "./ProductForm";

export default async function AdminProductEditPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  const initial: AdminProductInitial = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    sku: product.sku,
    category: product.category,
    featured: product.featured,
    isNew: product.isNew,
    inStock: product.inStock,
  };

  return (
    <main className="min-h-screen bg-black px-6 py-6 text-white">
      <ProductForm product={initial} />
    </main>
  );
}


