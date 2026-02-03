"use client";

import { Button } from "@/components/ui";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative z-10 bg-gradient-to-br from-[var(--dark-gray)] to-[var(--black)] min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden border-b-2 border-[var(--orange)]">
      {/* Background Image */}
      <div
        className="absolute inset-0 opacity-15 bg-cover bg-center grayscale-[50%]"
        style={{
          backgroundImage: `url('https://cdn.nba.com/manage/2021/08/GettyImages-1198641214.jpg')`,
          animation: "parallaxZoom 20s ease-in-out infinite",
        }}
      />

      {/* Decorative Circles */}
      <div
        className="absolute inset-0 opacity-30 z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,<svg width='100' height='100' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='40' fill='none' stroke='rgba(255,107,53,0.05)' stroke-width='2'/><circle cx='50' cy='50' r='30' fill='none' stroke='rgba(255,107,53,0.03)' stroke-width='1.5'/></svg>")`,
          animation: "rotateSlow 60s linear infinite",
        }}
      />

      {/* Content */}
      <div className="relative z-[2] text-center px-4 max-w-5xl mx-auto">
        <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-wider uppercase text-gradient mb-4 animate-slide-up">
          DOMINATE THE DATA
        </h1>

        <p
          className="text-base sm:text-lg md:text-xl font-semibold tracking-wider text-[var(--off-white)] max-w-3xl mx-auto mb-8 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          Advanced basketball analytics across NBA, WNBA, NCAA, EuroLeague &
          International Basketball
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <Link href="/stats">
            <Button variant="primary" size="lg">
              EXPLORE STATS
            </Button>
          </Link>
          <Link href="/tools">
            <Button variant="secondary" size="lg">
              VIEW TOOLS
            </Button>
          </Link>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes parallaxZoom {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        @keyframes rotateSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}
