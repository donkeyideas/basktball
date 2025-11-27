import Link from "next/link";
import { prisma } from "@/lib/prisma";

type SortOption = "featured" | "price-asc" | "price-desc" | "newest";

type ShopPageSearchParams = {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  size?: string | string[];
  color?: string | string[];
  sort?: SortOption;
  page?: string;
};

const PAGE_SIZE = 12;

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : value.split(",").map((v) => v.trim()).filter(Boolean);
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: ShopPageSearchParams;
}) {
  const page = Math.max(parseInt(searchParams.page ?? "1", 10) || 1, 1);
  const sort: SortOption = searchParams.sort ?? "featured";

  const category = searchParams.category;
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const sizes = toArray(searchParams.size);
  const colors = toArray(searchParams.color);

  // Build Prisma where clause
  const where: any = {
    inStock: true,
  };

  if (category) {
    where.category = category;
  }
  if (typeof minPrice === "number" && !Number.isNaN(minPrice)) {
    where.price = { ...(where.price ?? {}), gte: minPrice };
  }
  if (typeof maxPrice === "number" && !Number.isNaN(maxPrice)) {
    where.price = { ...(where.price ?? {}), lte: maxPrice };
  }

  // For sizes/colors we filter via ProductVariant; ensure there is at least one matching variant.
  if (sizes.length > 0 || colors.length > 0) {
    where.variants = {
      some: {
        ...(sizes.length > 0 && { size: { in: sizes } }),
        ...(colors.length > 0 && { color: { in: colors } }),
        available: { gt: 0 },
      },
    };
  }

  // Sorting
  let orderBy: any = { createdAt: "desc" as const };
  if (sort === "price-asc") {
    orderBy = { price: "asc" };
  } else if (sort === "price-desc") {
    orderBy = { price: "desc" };
  } else if (sort === "featured") {
    orderBy = [{ featured: "desc" as const }, { createdAt: "desc" as const }];
  } else if (sort === "newest") {
    orderBy = { createdAt: "desc" };
  }

  const [totalCount, products, filterMeta] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);

  const priceMinGlobal = filterMeta._min.price ?? 0;
  const priceMaxGlobal = filterMeta._max.price ?? 0;

  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
  });

  const categoryOptions = categories.map((c) => c.category).sort();

  const queryWithout = (key: string, value?: string | string[]) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (k === key) return;
      if (Array.isArray(v)) {
        v.forEach((item) => params.append(k, item));
      } else if (typeof v === "string" && v.length > 0) {
        params.set(k, v);
      }
    });
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((val) => params.append(key, val));
      } else {
        params.set(key, value);
      }
    }
    return params.toString() ? `?${params.toString()}` : "";
  };

  return (
    <main className="min-h-screen bg-black pt-20 text-white md:pt-24">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 md:flex-row md:gap-12 md:px-8 md:pb-24">
        {/* Filters sidebar */}
        <aside className="w-full space-y-8 md:w-64">
          <div>
            <h1 className="text-2xl font-light tracking-tight md:text-3xl">
              The Collection
            </h1>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">
              {totalCount} {totalCount === 1 ? "Product" : "Products"}
            </p>
          </div>

          <div className="space-y-6 text-sm text-neutral-200">
            {/* Category filter */}
            <div>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                Category
              </h2>
              <div className="space-y-1 text-xs">
                <Link
                  href={queryWithout("category")}
                  className={`block py-1 text-neutral-300 hover:text-white ${
                    !category ? "text-white" : ""
                  }`}
                >
                  All
                </Link>
                {categoryOptions.map((cat) => (
                  <Link
                    key={cat}
                    href={queryWithout("category", cat)}
                    className={`block py-1 text-neutral-300 hover:text-white ${
                      category === cat ? "text-white" : ""
                    }`}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            {/* Price filter (static links for now, based on global min/max) */}
            {priceMaxGlobal > 0 && (
              <div>
                <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                  Price
                </h2>
                <div className="space-y-1 text-xs">
                  <Link
                    href={queryWithout("minPrice")}
                    className="block py-1 text-neutral-300 hover:text-white"
                  >
                    All prices
                  </Link>
                  <Link
                    href={queryWithout("minPrice", String(Math.round(priceMinGlobal)))}
                    className="block py-1 text-neutral-300 hover:text-white"
                  >
                    From ${Math.round(priceMinGlobal)}
                  </Link>
                  <Link
                    href={queryWithout(
                      "maxPrice",
                      String(Math.round((priceMinGlobal + priceMaxGlobal) / 2)),
                    )}
                    className="block py-1 text-neutral-300 hover:text-white"
                  >
                    Up to ${Math.round((priceMinGlobal + priceMaxGlobal) / 2)}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Products + sort + pagination */}
        <section className="flex-1 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-neutral-400">
              Showing{" "}
              <span className="text-neutral-100">
                {products.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–
                {(page - 1) * PAGE_SIZE + products.length}
              </span>{" "}
              of <span className="text-neutral-100">{totalCount}</span>
            </p>

            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <span className="hidden uppercase tracking-[0.18em] md:inline">
                Sort
              </span>
              <div className="inline-flex gap-3">
                <Link
                  href={queryWithout("sort", "featured")}
                  className={`hover:text-white ${
                    sort === "featured" ? "text-white" : "text-neutral-400"
                  }`}
                >
                  Featured
                </Link>
                <Link
                  href={queryWithout("sort", "newest")}
                  className={`hover:text-white ${
                    sort === "newest" ? "text-white" : "text-neutral-400"
                  }`}
                >
                  Newest
                </Link>
                <Link
                  href={queryWithout("sort", "price-asc")}
                  className={`hover:text-white ${
                    sort === "price-asc" ? "text-white" : "text-neutral-400"
                  }`}
                >
                  Price ↑
                </Link>
                <Link
                  href={queryWithout("sort", "price-desc")}
                  className={`hover:text-white ${
                    sort === "price-desc" ? "text-white" : "text-neutral-400"
                  }`}
                >
                  Price ↓
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group flex flex-col gap-3"
              >
                <div className="relative overflow-hidden bg-neutral-900">
                  {"images" in product && product.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0] as string}
                      alt={product.name}
                      className="h-80 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-80 w-full bg-[radial-gradient(circle_at_top,_#27272a,_#000)]" />
                  )}
                  {product.isNew && (
                    <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-black">
                      New
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium tracking-tight">
                    {product.name}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                    {product.category}
                  </p>
                  <p className="text-sm text-neutral-100">
                    ${product.price.toFixed(0)}
                  </p>
                </div>
              </Link>
            ))}

            {products.length === 0 && (
              <p className="col-span-full text-center text-sm text-neutral-500">
                No products found. Try adjusting your filters.
              </p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between text-xs text-neutral-300">
              <Link
                href={queryWithout("page", String(Math.max(page - 1, 1)))}
                className={`uppercase tracking-[0.18em] hover:text-white ${
                  page === 1 ? "pointer-events-none opacity-40" : ""
                }`}
              >
                ← Previous
              </Link>
              <div className="space-x-2">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <Link
                      key={pageNumber}
                      href={queryWithout("page", String(pageNumber))}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[0.7rem] ${
                        pageNumber === page
                          ? "bg-white text-black"
                          : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  );
                })}
              </div>
              <Link
                href={queryWithout("page", String(Math.min(page + 1, totalPages)))}
                className={`uppercase tracking-[0.18em] hover:text-white ${
                  page === totalPages ? "pointer-events-none opacity-40" : ""
                }`}
              >
                Next →
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}


