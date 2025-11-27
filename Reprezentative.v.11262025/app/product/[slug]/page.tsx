import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type ProductPageParams = {
  params: { slug: string };
};

export default async function ProductPage({ params }: ProductPageParams) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      variants: {
        orderBy: [{ color: "asc" }, { size: "asc" }],
      },
    },
  });

  if (!product) {
    notFound();
  }

  const primaryImage =
    product.images && product.images.length > 0 ? product.images[0] : null;

  const colors = Array.from(
    new Set(product.variants.map((variant) => variant.color)),
  );
  const sizes = Array.from(
    new Set(product.variants.map((variant) => variant.size)),
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-900 bg-black/90 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.18em] text-neutral-400 hover:text-white"
          >
            ← Back to shop
          </Link>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] text-neutral-500">
            {product.category}
          </p>
        </div>
      </div>

      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:flex-row md:px-8 md:py-12">
        {/* Gallery */}
        <div className="md:w-1/2">
          <div className="overflow-hidden rounded-md border border-neutral-800 bg-neutral-950">
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage as string}
                alt={product.name}
                className="h-[420px] w-full object-cover md:h-[520px]"
              />
            ) : (
              <div className="h-[420px] w-full bg-[radial-gradient(circle_at_top,_#27272a,_#000)] md:h-[520px]" />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((image, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${image}-${index}`}
                  src={image as string}
                  alt={`${product.name} ${index + 2}`}
                  className="h-20 w-full rounded-md object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6 md:w-1/2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-neutral-300">
              {product.material} • {product.fit.toLowerCase()}
            </p>
          </div>

          <div className="text-xl font-semibold text-white">
            ${product.price.toFixed(2)}
          </div>

          <div className="space-y-4 text-xs text-neutral-200">
            <p className="whitespace-pre-line text-sm text-neutral-300">
              {product.description}
            </p>

            {colors.length > 0 && (
              <div>
                <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Colors
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <div
                      key={color}
                      className="rounded-full border border-neutral-700 px-3 py-1 text-[0.7rem] text-neutral-200"
                    >
                      {color}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div>
                <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Sizes
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <div
                      key={size}
                      className="rounded-full border border-neutral-700 px-3 py-1 text-[0.7rem] text-neutral-200"
                    >
                      {size}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 text-xs text-neutral-300">
            <p>
              300+ GSM premium cotton blend, double-stitched seams, and a
              structured hood designed for everyday wear.
            </p>
            <p>
              Once the cart and checkout flows are live, this page will power
              full size/color selection and purchase actions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}


