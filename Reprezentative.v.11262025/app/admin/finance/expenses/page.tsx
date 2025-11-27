import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "./ExpenseForm";

function formatMonthKey(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, "0")}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
  });

  // Monthly totals
  const monthlyMap = new Map<
    string,
    { label: string; total: number; date: Date }
  >();

  for (const expense of expenses) {
    const d = expense.date;
    const key = formatMonthKey(d);
    const existing = monthlyMap.get(key);
    if (existing) {
      existing.total += expense.amount;
    } else {
      monthlyMap.set(key, {
        label: formatMonthLabel(d),
        total: expense.amount,
        date: d,
      });
    }
  }

  const monthlyTotals = Array.from(monthlyMap.values()).sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  // Category breakdown
  const categoryMap = new Map<string, number>();
  for (const expense of expenses) {
    const key = expense.category;
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + expense.amount);
  }
  const categoryTotals = Array.from(categoryMap.entries()).map(
    ([category, total]) => ({ category, total }),
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-neutral-800 bg-zinc-900/70 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Expense Tracking
            </h1>
            <p className="mt-1 text-xs text-neutral-400">
              Track operating expenses and understand your burn rate.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-6 px-6 py-6">
        {/* Form */}
        <ExpenseForm />

        {/* Summary + breakdown */}
        <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
          {/* Monthly totals */}
          <div className="space-y-3 rounded-md border border-neutral-800 bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
                Monthly Totals
              </h2>
            </div>
            <div className="space-y-2 text-[0.75rem]">
              {monthlyTotals.length === 0 && (
                <p className="py-4 text-center text-[0.7rem] text-neutral-500">
                  No expenses recorded yet.
                </p>
              )}
              {monthlyTotals.slice(0, 6).map((m) => (
                <div
                  key={m.label}
                  className="flex items-center justify-between border-b border-neutral-900 pb-1 last:border-0 last:pb-0"
                >
                  <span className="text-neutral-300">{m.label}</span>
                  <span className="text-neutral-100">
                    ${m.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category breakdown chart */}
          <div className="space-y-3 rounded-md border border-neutral-800 bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
                Category Breakdown
              </h2>
            </div>
            <div className="space-y-3 pt-1 text-[0.75rem]">
              {categoryTotals.length === 0 && (
                <p className="py-4 text-center text-[0.7rem] text-neutral-500">
                  No category data yet.
                </p>
              )}
              {categoryTotals.map((item) => {
                const pct =
                  totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-[0.75rem]">
                      <span className="text-neutral-300">{item.category}</span>
                      <span className="text-neutral-400">
                        ${item.total.toFixed(2)}{" "}
                        <span className="ml-1 text-[0.7rem] text-neutral-500">
                          ({pct.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-900">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${pct || 2}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expenses table */}
        <div className="overflow-hidden rounded-md border border-neutral-800 bg-zinc-950/60">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-zinc-900/80 text-[0.7rem] uppercase tracking-[0.16em] text-neutral-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Category</th>
                <th className="px-3 py-2 text-left font-medium">Description</th>
                <th className="px-3 py-2 text-left font-medium">Vendor</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 text-center font-medium">
                  Recurring
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-t border-neutral-900 hover:bg-neutral-900/40"
                >
                  <td className="px-3 py-2 align-top text-[0.7rem] text-neutral-300">
                    {expense.date.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-2 align-top text-[0.7rem] text-neutral-200">
                    {expense.category}
                  </td>
                  <td className="px-3 py-2 align-top text-[0.7rem] text-neutral-300">
                    {expense.description}
                  </td>
                  <td className="px-3 py-2 align-top text-[0.7rem] text-neutral-400">
                    {expense.vendor ?? "—"}
                  </td>
                  <td className="px-3 py-2 align-top text-right text-[0.7rem] text-neutral-100">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 align-top text-center text-[0.7rem]">
                    {expense.isRecurring ? (
                      <span className="inline-flex h-5 items-center justify-center rounded-full bg-emerald-500/15 px-2 text-[0.65rem] font-semibold text-emerald-300">
                        {expense.frequency ?? "Yes"}
                      </span>
                    ) : (
                      <span className="inline-flex h-5 items-center justify-center rounded-full bg-neutral-800 px-2 text-[0.65rem] text-neutral-400">
                        No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-xs text-neutral-500"
                  >
                    No expenses recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}


