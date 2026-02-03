"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: "/live", label: "Live" },
  { href: "/stats", label: "Stats" },
  { href: "/tools", label: "Tools" },
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
];

interface HeaderProps {
  liveGamesCount?: number;
}

export function Header({ liveGamesCount = 0 }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-50 bg-gradient-to-b from-[var(--black)] to-[var(--dark-gray)] border-b-4 border-[var(--orange)]">
      {/* Top Bar */}
      <div className="bg-[var(--orange)] py-2 text-sm font-bold tracking-wider uppercase">
        <div className="container-main flex justify-between items-center">
          <div className="flex items-center gap-2">
            {liveGamesCount > 0 && (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse-live" />
                <span>{liveGamesCount} GAMES LIVE NOW</span>
              </>
            )}
            {liveGamesCount === 0 && <span>NO LIVE GAMES</span>}
          </div>
          <div className="hidden md:block">UPDATED EVERY 30 SECONDS</div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container-main py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-icon.png"
            alt="Basktball"
            width={50}
            height={50}
            className="w-10 h-10 md:w-12 md:h-12"
          />
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-anton)] text-2xl md:text-4xl tracking-wider text-white text-shadow-[3px_3px_0_var(--orange)]">
              BASKTBALL
            </span>
            <span className="hidden sm:block text-[10px] md:text-xs font-bold tracking-[0.2em] text-[var(--orange)] uppercase">
              Dominate The Data
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "text-white font-bold text-lg tracking-wider uppercase",
                  "py-2 border-b-3 border-transparent",
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
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[var(--dark-gray)] border-t border-[var(--border)]">
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
