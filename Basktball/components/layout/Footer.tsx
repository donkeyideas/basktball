"use client";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-[var(--black)] border-t-4 border-[var(--orange)] py-12 px-8 mt-16 text-center">
      <p className="text-base tracking-wider text-white/60">
        &copy; {currentYear} BASKTBALL.COM - ADVANCED BASKETBALL ANALYTICS PLATFORM
      </p>
      <p className="mt-4 text-sm text-white/40">
        ALL STATS UPDATED IN REAL-TIME FROM OFFICIAL SOURCES
      </p>
    </footer>
  );
}
