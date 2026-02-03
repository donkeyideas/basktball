"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/content", label: "Content", icon: "📝" },
  { href: "/admin/ads", label: "Ads", icon: "📢" },
  { href: "/admin/seo", label: "SEO", icon: "🔍" },
  { href: "/admin/jobs", label: "Jobs", icon: "⚙️" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/settings", label: "Settings", icon: "🔧" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--black)] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--dark-gray)] border-r border-[var(--border)] flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-[var(--border)]">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/logo-icon.png"
              alt="Basktball"
              width={40}
              height={40}
            />
            <div>
              <span className="font-[family-name:var(--font-anton)] text-lg tracking-wider text-white block">
                BASKTBALL
              </span>
              <span className="text-xs text-[var(--orange)]">ADMIN</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded transition-colors",
                      isActive
                        ? "bg-[var(--orange)] text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span>{item.icon}</span>
                    <span className="font-semibold text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-3"
          >
            ← Back to Site
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm w-full"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
