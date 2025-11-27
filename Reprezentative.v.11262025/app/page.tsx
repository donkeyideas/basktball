import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewsletterForm } from "@/components/NewsletterForm";

type HeroContent = {
  videoUrl?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
};

type FeaturedSplitContent = {
  imageUrl?: string;
  heading?: string;
  bodyText?: string;
  ctaText?: string;
  ctaLink?: string;
};

type BannerContent = {
  imageUrl?: string;
  heading?: string;
  ctaText?: string;
  ctaLink?: string;
};

type ThreeColumnsContent = {
  columns?: Array<{
    imageUrl?: string;
    title?: string;
    subtitle?: string;
    link?: string;
  }>;
};

type EditorialContent = {
  heading?: string;
  paragraph1?: string;
  paragraph2?: string;
  ctaText?: string;
  ctaLink?: string;
};

type NewsletterContent = {
  heading?: string;
  subheading?: string;
  buttonText?: string;
};

export default async function HomePage() {
  const [
    heroRecord,
    featuredRecord,
    bannerRecord,
    columnsRecord,
    editorialRecord,
    newsletterRecord,
    products,
  ] = await Promise.all([
    prisma.content.findUnique({ where: { key: "hero" } }),
    prisma.content.findUnique({ where: { key: "featured_split" } }),
    prisma.content.findUnique({ where: { key: "full_width_banner" } }),
    prisma.content.findUnique({ where: { key: "three_columns" } }),
    prisma.content.findUnique({ where: { key: "editorial" } }),
    prisma.content.findUnique({ where: { key: "newsletter_section" } }),
    prisma.product.findMany({
      where: { inStock: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const hero = (heroRecord?.data ?? null) as HeroContent | null;
  const featuredSplit = (featuredRecord?.data ?? null) as
    | FeaturedSplitContent
    | null;
  const banner = (bannerRecord?.data ?? null) as BannerContent | null;
  const threeColumns = (columnsRecord?.data ?? null) as
    | ThreeColumnsContent
    | null;
  const editorial = (editorialRecord?.data ?? null) as EditorialContent | null;
  const newsletter = (newsletterRecord?.data ?? null) as
    | NewsletterContent
    | null;

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed inset-x-0 top-0 z-20 border-b border-neutral-900 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <div className="text-xs font-medium tracking-[0.2em] text-white">
            REPREZENTATIVE
          </div>
          <ul className="hidden items-center gap-8 text-[0.7rem] uppercase tracking-[0.18em] text-neutral-300 md:flex">
            <li>
              <Link href="#new" className="hover:text-white hover:opacity-80">
                New Arrivals
              </Link>
            </li>
            <li>
              <Link href="#collection" className="hover:text-white hover:opacity-80">
                Collection
              </Link>
            </li>
            <li>
              <Link href="#story" className="hover:text-white hover:opacity-80">
                Our Story
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-white hover:opacity-80">
                Cart (0)
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="relative h-[80vh] w-full overflow-hidden bg-black pt-16 md:h-screen">
          {hero?.videoUrl ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={hero.videoUrl} type="video/mp4" />
            </video>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#27272a,_#000)]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80" />

          <div className="relative z-10 mx-auto flex h-full max-w-6xl items-end px-4 pb-16 md:px-8 md:pb-24">
            <div className="max-w-xl space-y-6">
              <h1 className="text-4xl font-light leading-[1.05] tracking-tight md:text-6xl">
                {hero?.headline ?? "The Heritage Collection"}
              </h1>
              <p className="text-sm font-light tracking-[0.18em] text-neutral-200 md:text-base">
                {hero?.subheadline ??
                  "Timeless design. Uncompromising quality. Wear what you stand for."}
              </p>
              <div className="pt-2">
                <Link
                  href={hero?.ctaLink ?? "/shop"}
                  className="inline-block border-b border-white text-[0.75rem] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-70"
                >
                  {hero?.ctaText ?? "Explore Collection \u2192"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Products Grid / New Arrivals */}
        <section
          id="new"
          className="border-t border-neutral-900 bg-black px-4 py-16 md:px-8 md:py-20"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-light tracking-tight md:text-3xl">
                New Arrivals
              </h2>
              <p className="mt-3 max-w-md text-sm font-light text-neutral-400">
                {products.length > 0
                  ? "A curated selection from the latest collection."
                  : "No products available yet."}
              </p>
            </div>
            <Link
              href="/shop"
              className="text-[0.75rem] uppercase tracking-[0.18em] text-neutral-300 hover:text-white"
            >
              View All Products
            </Link>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group flex flex-col gap-3"
              >
                <div className="relative overflow-hidden bg-neutral-900">
                  {/* Use first image if available, otherwise a simple gradient placeholder */}
                  {"images" in product && product.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0] as string}
                      alt={product.name}
                      className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-72 w-full bg-[radial-gradient(circle_at_top,_#27272a,_#000)]" />
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
                No products available yet. Add products in the admin dashboard to
                populate this section.
              </p>
            )}
          </div>
        </section>

        {/* Featured Split Section */}
        {featuredSplit && (
          <section className="grid min-h-[70vh] border-t border-neutral-900 bg-black md:grid-cols-2">
            <div className="relative overflow-hidden">
              {featuredSplit.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredSplit.imageUrl}
                  alt={featuredSplit.heading ?? ""}
                  className="h-full w-full object-cover transition-transform duration-[1200ms] hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#27272a,_#000)]" />
              )}
            </div>
            <div className="flex flex-col justify-center bg-black px-4 py-12 md:px-12">
              <h2 className="text-3xl font-light tracking-tight md:text-4xl">
                {featuredSplit.heading}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-300">
                {featuredSplit.bodyText}
              </p>
              {featuredSplit.ctaText && featuredSplit.ctaLink && (
                <div className="mt-6">
                  <Link
                    href={featuredSplit.ctaLink}
                    className="inline-block border-b border-white text-[0.75rem] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-70"
                  >
                    {featuredSplit.ctaText}
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Full Width Banner */}
        {banner && (
          <section className="relative h-[60vh] overflow-hidden border-t border-neutral-900 bg-black">
            {banner.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={banner.imageUrl}
                alt={banner.heading ?? ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#27272a,_#000)]" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="px-4 text-center md:px-8">
                <h2 className="text-3xl font-light tracking-tight md:text-4xl">
                  {banner.heading}
                </h2>
                {banner.ctaText && banner.ctaLink && (
                  <div className="mt-6">
                    <Link
                      href={banner.ctaLink}
                      className="inline-block border-b border-white text-[0.75rem] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-70"
                    >
                      {banner.ctaText}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Three Column Grid */}
        {threeColumns?.columns && threeColumns.columns.length > 0 && (
          <section className="grid border-t border-neutral-900 bg-black md:grid-cols-3">
            {threeColumns.columns.map((column, index) => (
              <Link
                key={column.title ?? `column-${index}`}
                href={column.link ?? "/shop"}
                className="group relative block aspect-[3/4] overflow-hidden border-b border-neutral-900 md:border-b-0 md:border-r last:border-r-0"
              >
                {column.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={column.imageUrl}
                    alt={column.title ?? ""}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#27272a,_#000)]" />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-lg font-light tracking-[0.08em]">
                    {column.title}
                  </h3>
                  <p className="mt-1 text-[0.75rem] uppercase tracking-[0.16em] text-neutral-300">
                    {column.subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </section>
        )}

        {/* Editorial Section */}
        {editorial && (
          <section
            id="story"
            className="border-t border-neutral-900 bg-black px-4 py-16 md:px-8 md:py-20"
          >
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-light tracking-tight md:text-4xl">
                {editorial.heading}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-neutral-300">
                {editorial.paragraph1}
              </p>
              {editorial.paragraph2 && (
                <p className="mt-4 text-lg leading-relaxed text-neutral-300">
                  {editorial.paragraph2}
                </p>
              )}
              {editorial.ctaText && editorial.ctaLink && (
                <div className="mt-6">
                  <Link
                    href={editorial.ctaLink}
                    className="inline-block border-b border-white text-[0.75rem] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-70"
                  >
                    {editorial.ctaText}
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Newsletter Section */}
        {newsletter && (
          <section className="border-t border-neutral-900 bg-neutral-950 px-4 py-16 md:px-8 md:py-20">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-2xl font-light uppercase tracking-[0.18em] text-neutral-100">
                {newsletter.heading}
              </h2>
              <p className="mt-3 text-sm text-neutral-400">
                {newsletter.subheading}
              </p>
              <NewsletterForm buttonText={newsletter.buttonText ?? "Subscribe"} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
