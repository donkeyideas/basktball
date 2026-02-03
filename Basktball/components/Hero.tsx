"use client";

import Link from "next/link";

export function Hero() {
  return (
    <section className="relative z-10 bg-gradient-to-br from-[var(--dark-gray)] to-[var(--black)] min-h-[600px] flex items-center justify-center overflow-hidden border-b-2 border-[var(--orange)]">
      {/* Background Image with parallax zoom */}
      <div
        className="absolute inset-0 opacity-15 bg-cover bg-center grayscale-[50%] animate-parallax-zoom"
        style={{
          backgroundImage: `url('https://cdn.nba.com/manage/2021/08/GettyImages-1198641214.jpg')`,
        }}
      />

      {/* Decorative Circles Pattern */}
      <div
        className="absolute inset-0 opacity-30 z-[1] animate-rotate-slow"
        style={{
          backgroundImage: `url("data:image/svg+xml,<svg width='100' height='100' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='40' fill='none' stroke='rgba(255,107,53,0.05)' stroke-width='2'/><circle cx='50' cy='50' r='30' fill='none' stroke='rgba(255,107,53,0.03)' stroke-width='1.5'/></svg>")`,
        }}
      />

      {/* Content */}
      <div className="relative z-[2] text-center px-4 max-w-5xl mx-auto">
        <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] tracking-[5px] uppercase bg-gradient-to-r from-white to-[var(--orange)] bg-clip-text text-transparent mb-4 animate-slide-up">
          DOMINATE THE DATA
        </h1>

        <p className="text-base sm:text-lg md:text-xl lg:text-[1.4rem] font-semibold tracking-wider text-[var(--off-white)] max-w-[900px] mx-auto mb-8 animate-slide-up animation-delay-200">
          Advanced basketball analytics across NBA, WNBA, NCAA, EuroLeague & International Basketball
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mt-10 animate-slide-up animation-delay-400">
          <Link
            href="/stats"
            className="btn btn-primary text-lg"
          >
            EXPLORE STATS
          </Link>
          <Link
            href="/tools"
            className="btn btn-secondary text-lg"
          >
            VIEW TOOLS
          </Link>
        </div>
      </div>
    </section>
  );
}
