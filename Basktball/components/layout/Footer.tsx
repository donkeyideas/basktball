"use client";

import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-[var(--black)] border-t-4 border-[var(--orange)]">
      <div className="container-main py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo-icon.png"
                alt="Basktball"
                width={40}
                height={40}
              />
              <span className="font-[family-name:var(--font-anton)] text-2xl tracking-wider text-white">
                BASKTBALL
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Advanced basketball analytics across NBA, WNBA, NCAA, EuroLeague &
              International Basketball.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-[var(--orange)] uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/live"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Live Scores
                </Link>
              </li>
              <li>
                <Link
                  href="/stats"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Stats
                </Link>
              </li>
              <li>
                <Link
                  href="/players"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Players
                </Link>
              </li>
              <li>
                <Link
                  href="/teams"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Teams
                </Link>
              </li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-bold text-[var(--orange)] uppercase tracking-wider mb-4">
              Analytics Tools
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/tools/shot-chart"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Shot Chart Analyzer
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/compare"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Player Comparison
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/advanced-metrics"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Advanced Metrics
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/predictor"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Game Predictor
                </Link>
              </li>
            </ul>
          </div>

          {/* Leagues */}
          <div>
            <h4 className="font-bold text-[var(--orange)] uppercase tracking-wider mb-4">
              Leagues
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/stats?league=nba"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  NBA
                </Link>
              </li>
              <li>
                <Link
                  href="/stats?league=wnba"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  WNBA
                </Link>
              </li>
              <li>
                <Link
                  href="/stats?league=ncaam"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  NCAA Men&apos;s
                </Link>
              </li>
              <li>
                <Link
                  href="/stats?league=ncaaw"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  NCAA Women&apos;s
                </Link>
              </li>
              <li>
                <Link
                  href="/stats?league=euro"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  EuroLeague
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--border)] text-center">
          <p className="text-sm text-gray-500 tracking-wider">
            &copy; {currentYear} BASKTBALL.COM - ADVANCED BASKETBALL ANALYTICS
            PLATFORM
          </p>
          <p className="mt-2 text-xs text-gray-600">
            ALL STATS UPDATED IN REAL-TIME FROM OFFICIAL SOURCES
          </p>
        </div>
      </div>
    </footer>
  );
}
