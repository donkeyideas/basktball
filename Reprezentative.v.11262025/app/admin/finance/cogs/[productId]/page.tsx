import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CogsForm } from "./CogsForm";

export default async function ProductCogsPage({
  params,
}: {
  params: { productId: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-6 text-white">
      <CogsForm productId={product.id} productName={product.name} />
    </main>
  );
}


