"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: "/live", label: "LIVE" },
  { href: "/stats", label: "STATS" },
  { href: "/tools", label: "TOOLS" },
  { href: "/players", label: "PLAYERS" },
  { href: "/teams", label: "TEAMS" },
];

interface HeaderProps {
  liveGamesCount?: number;
}

export function Header({ liveGamesCount = 0 }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-50 bg-gradient-to-b from-[var(--black)] to-[var(--dark-gray)] border-b-4 border-[var(--orange)]">
      {/* Top Bar */}
      <div className="bg-[var(--orange)] py-2 px-4 md:px-8 text-sm font-bold tracking-wider uppercase">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            {liveGamesCount > 0 ? (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>{liveGamesCount} GAMES LIVE NOW</span>
              </>
            ) : (
              <span>NO LIVE GAMES</span>
            )}
          </div>
          <div className="hidden md:block">UPDATED EVERY 30 SECONDS</div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="relative">
          <span className="font-[family-name:var(--font-anton)] text-3xl md:text-5xl tracking-[3px] text-white text-shadow-[3px_3px_0_var(--orange)]">
            BASKTBALL
          </span>
          <span className="absolute -bottom-2 left-0 text-[0.8rem] tracking-[8px] text-[var(--orange)] font-semibold">
            STATS
          </span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex gap-10 items-center">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "text-white font-bold text-lg tracking-wider",
                  "py-2 border-b-[3px] border-transparent",
                  "transition-all duration-200",
                  "hover:text-[var(--orange)] hover:border-[var(--orange)]"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[var(--dark-gray)] border-t border-white/10">
          <ul className="flex flex-col py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block px-6 py-4 text-white font-bold text-lg tracking-wider uppercase",
                    "border-l-4 border-transparent",
                    "transition-all duration-200",
                    "hover:bg-[var(--black)] hover:border-[var(--orange)] hover:text-[var(--orange)]"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
