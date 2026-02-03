"use client";

import { Header, Footer } from "@/components/layout";
import { InsightsFeed } from "@/components/ai";

export default function InsightsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[var(--black)]">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[var(--dark-gray)] to-[var(--black)] py-12 md:py-16 border-b-4 border-[var(--orange)]">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-4xl md:text-5xl tracking-wider text-white mb-4">
              AI INSIGHTS
            </h1>
            <p className="text-lg text-white/70 max-w-2xl">
              AI-powered basketball analysis, game recaps, betting insights, and
              fantasy tips - all generated using advanced language models.
            </p>
          </div>
        </section>

        {/* Insights Feed */}
        <section className="py-12 md:py-16">
          <div className="container-main">
            <InsightsFeed limit={20} showFilters={true} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
