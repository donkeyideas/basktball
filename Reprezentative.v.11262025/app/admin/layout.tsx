import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 w-64 border-r border-neutral-800 bg-zinc-900">
          <div className="border-b border-neutral-800 px-4 py-5">
            <h1 className="text-sm font-semibold tracking-[0.18em]">
              REPREZENTATIVE
            </h1>
            <p className="mt-1 text-xs text-neutral-400">Admin Dashboard</p>
          </div>

          <nav className="flex h-[calc(100vh-4.5rem)] flex-col justify-between overflow-y-auto px-3 py-4 text-sm">
            <div className="space-y-6">
              {/* Dashboard */}
              <div>
                <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Overview
                </div>
                <Link
                  href="/admin"
                  className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm hover:bg-neutral-800"
                >
                  <span>Dashboard</span>
                </Link>
              </div>

              {/* Products Hub */}
              <div>
                <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Products Hub
                </div>
                <div className="space-y-1">
                  <Link
                    href="/admin/content"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    Content Manager
                  </Link>
                  <Link
                    href="/admin/products"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    Products
                  </Link>
                  <Link
                    href="/admin/inventory"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    Inventory Manager
                  </Link>
                </div>
              </div>

              {/* Sales Hub */}
              <div>
                <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Sales Hub
                </div>
                <div className="space-y-1">
                  <Link
                    href="/admin/orders"
                    className="flex items-center justify-between rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    <span>Orders</span>
                    <span className="rounded bg-red-500 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em]">
                      12
                    </span>
                  </Link>
                  <Link
                    href="/admin/customers"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    Customers
                  </Link>
                  <Link
                    href="/admin/analytics"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/admin/marketing"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    Marketing
                  </Link>
                </div>
              </div>

              {/* Finance Hub */}
              <div>
                <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Finance Hub
                </div>
                <div className="space-y-1">
                  <Link
                    href="/admin/finance/cogs"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    COGS Manager
                  </Link>
                  <Link
                    href="/admin/finance/pricing"
                    className="flex items-center justify-between rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    <span>AI Pricing Engine</span>
                    <span className="rounded bg-blue-500 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em]">
                      AI
                    </span>
                  </Link>
                  <Link
                    href="/admin/finance/expenses"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    Expense Tracking
                  </Link>
                  <Link
                    href="/admin/finance/profit-analysis"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    Profit Analysis
                  </Link>
                </div>
              </div>

              {/* Operations Hub */}
              <div>
                <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Operations Hub
                </div>
                <div className="space-y-1">
                  <Link
                    href="/admin/operations/suppliers"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    Suppliers
                  </Link>
                  <Link
                    href="/admin/operations/purchase-orders"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    Purchase Orders
                  </Link>
                  <Link
                    href="/admin/operations/logistics"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    Logistics
                  </Link>
                </div>
              </div>

              {/* AI Hub */}
              <div>
                <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  AI Intelligence Hub
                </div>
                <Link
                  href="/admin/ai-assistant"
                  className="flex items-center justify-between rounded-md px-2.5 py-2 hover:bg-neutral-800"
                >
                  <span>AI Assistant</span>
                  <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em]">
                    Beta
                  </span>
                </Link>
              </div>

              {/* Settings */}
              <div>
                <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Settings
                </div>
                <div className="space-y-1">
                  <Link
                    href="/admin/settings/api-keys"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    API Keys
                  </Link>
                  <Link
                    href="/admin/seo"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    SEO Tools
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="block rounded-md px-2.5 py-2 hover:bg-neutral-800"
                  >
                    System Settings
                  </Link>
                </div>
              </div>
            </div>

            {/* Admin user footer */}
            <div className="mt-8 border-t border-neutral-800 px-2.5 pt-4">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-[0.7rem] font-semibold">
                  AD
                </div>
                <div>
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-[0.7rem] text-neutral-400">
                    admin@reprezentative.com
                  </p>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main content area */}
        <div className="min-h-screen flex-1 bg-black pl-64">
          {children}
        </div>
      </div>
    </div>
  );
}


