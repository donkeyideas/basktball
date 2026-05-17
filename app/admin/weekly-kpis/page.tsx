"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

/**
 * Weekly KPI tracker — ported from donkeyideas/marble-admin.
 *
 * One row per Monday-of-week. Tracks DAU, retention, sessions, ARPDAU,
 * rating, crash rate. Industry benchmarks color-code each cell from
 * bad → ok → good → excellent. Auto-fetch from GA4 or enter manually.
 */

/* ─── Types & Benchmarks ──────────────────────────────────────────── */

interface KpiEntry {
  id: string;
  weekOf: string;
  dau: number;
  d1Retention: number;
  d7Retention: number;
  d30Retention: number;
  sessionsPerDau: number;
  avgSessionSecs: number;
  arpdau: number;
  rating: number;
  crashRate: number;
  notes: string | null;
}

type MetricKey = keyof typeof BENCHMARKS;

const BENCHMARKS = {
  dau:            { label: "DAU",            bad: 0,    ok: 0,    good: 0,    excellent: 0,    unit: "",   higher: true, noBenchmark: true },
  d1Retention:    { label: "D1 Retention",   bad: 20,   ok: 25,   good: 35,   excellent: 45,   unit: "%",  higher: true },
  d7Retention:    { label: "D7 Retention",   bad: 8,    ok: 10,   good: 15,   excellent: 25,   unit: "%",  higher: true },
  d30Retention:   { label: "D30 Retention",  bad: 3,    ok: 5,    good: 10,   excellent: 15,   unit: "%",  higher: true },
  sessionsPerDau: { label: "Sessions/DAU",   bad: 1.5,  ok: 2,    good: 3,    excellent: 5,    unit: "",   higher: true },
  avgSessionSecs: { label: "Avg Session",    bad: 0,    ok: 0,    good: 0,    excellent: 0,    unit: "s",  higher: true, noBenchmark: true },
  arpdau:         { label: "ARPDAU",         bad: 0.05, ok: 0.10, good: 0.25, excellent: 0.75, unit: "$",  higher: true },
  rating:         { label: "Rating",         bad: 3.5,  ok: 3.5,  good: 4.0,  excellent: 4.5,  unit: "★",  higher: true },
  crashRate:      { label: "Crash Rate",     bad: 2.0,  ok: 1.5,  good: 1.0,  excellent: 0.5,  unit: "%",  higher: false },
} as const;

const METRIC_KEYS: MetricKey[] = [
  "dau", "d1Retention", "d7Retention", "d30Retention",
  "sessionsPerDau", "avgSessionSecs", "arpdau", "rating", "crashRate",
];

/* ─── Helpers ─────────────────────────────────────────────────────── */

function getBenchmarkStatus(key: MetricKey, value: number): "bad" | "ok" | "good" | "excellent" {
  const b = BENCHMARKS[key];
  if ("noBenchmark" in b && b.noBenchmark) return "good";
  if (b.higher) {
    if (value >= b.excellent) return "excellent";
    if (value >= b.good) return "good";
    if (value >= b.ok) return "ok";
    return "bad";
  } else {
    if (value <= b.excellent) return "excellent";
    if (value <= b.good) return "good";
    if (value <= b.ok) return "ok";
    return "bad";
  }
}

// Basktball palette via CSS vars: --red, --yellow, --green, --blue
const STATUS_COLOR_VAR = {
  bad: "var(--red)",
  ok: "var(--yellow)",
  good: "var(--green)",
  excellent: "var(--blue)",
};

function formatValue(key: MetricKey, value: number): string {
  const b = BENCHMARKS[key];
  if (key === "arpdau") return `$${value.toFixed(2)}`;
  if (key === "avgSessionSecs") {
    const m = Math.floor(value / 60);
    const s = value % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
  if (b.unit === "%") return `${value.toFixed(1)}%`;
  if (b.unit === "★") return `${value.toFixed(1)}★`;
  if (key === "dau") return new Intl.NumberFormat("en-US").format(value);
  return value.toFixed(1);
}

function getChange(entries: KpiEntry[], key: MetricKey): { value: number; isUp: boolean } | null {
  if (entries.length < 2) return null;
  const curr = entries[0][key] as number;
  const prev = entries[1][key] as number;
  if (prev === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  const higher = BENCHMARKS[key].higher;
  return { value: Math.abs(pct), isUp: higher ? pct > 0 : pct < 0 };
}

function getCurrentMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

/* ─── Entry Form Modal ────────────────────────────────────────────── */

function EntryForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    weekOf: getCurrentMonday(),
    dau: "", d1Retention: "", d7Retention: "", d30Retention: "",
    sessionsPerDau: "", avgSessionSecs: "", arpdau: "", rating: "", crashRate: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/weekly-kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to save");
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: string; label: string; placeholder: string }[] = [
    { key: "dau",            label: "DAU",                placeholder: "1250" },
    { key: "d1Retention",    label: "D1 Retention (%)",   placeholder: "35.0" },
    { key: "d7Retention",    label: "D7 Retention (%)",   placeholder: "15.0" },
    { key: "d30Retention",   label: "D30 Retention (%)",  placeholder: "8.0" },
    { key: "sessionsPerDau", label: "Sessions/DAU",       placeholder: "3.2" },
    { key: "avgSessionSecs", label: "Avg Session (sec)",  placeholder: "420" },
    { key: "arpdau",         label: "ARPDAU ($)",         placeholder: "0.25" },
    { key: "rating",         label: "Rating",             placeholder: "4.2" },
    { key: "crashRate",      label: "Crash Rate (%)",     placeholder: "1.2" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto border-2"
        style={{ background: "var(--card-bg)", borderColor: "var(--border-color)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Log Weekly KPIs</h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Enter metrics for this week from Google Analytics
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Week of (Monday)
            </label>
            <input
              type="date"
              value={form.weekOf}
              onChange={(e) => setForm({ ...form, weekOf: e.target.value })}
              className="mt-1 w-full rounded-xl px-3 py-2 text-sm border-2 focus:outline-none"
              style={{
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {f.label}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm border-2 focus:outline-none"
                  style={{
                    background: "var(--input-bg)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border-color)",
                  }}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any context for this week..."
              rows={2}
              className="mt-1 w-full rounded-xl px-3 py-2 text-sm border-2 focus:outline-none resize-none"
              style={{
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            />
          </div>

          {error && <p className="text-xs text-center" style={{ color: "var(--red)" }}>{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-opacity disabled:opacity-50"
              style={{
                background: "var(--orange)",
                color: "var(--white)",
                borderColor: "var(--orange)",
              }}
            >
              {saving ? "Saving..." : "Save Entry"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors"
              style={{
                color: "var(--text-muted)",
                borderColor: "var(--border-color)",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Benchmark bar ───────────────────────────────────────────────── */

function BenchmarkBar({ metricKey, value }: { metricKey: MetricKey; value: number }) {
  const b = BENCHMARKS[metricKey];
  if ("noBenchmark" in b && b.noBenchmark) return null;
  const status = getBenchmarkStatus(metricKey, value);
  const segments = ["bad", "ok", "good", "excellent"] as const;

  return (
    <div className="flex items-center gap-1 mt-2">
      {segments.map((seg) => (
        <div
          key={seg}
          className="h-1.5 flex-1 rounded-full"
          style={{
            background: STATUS_COLOR_VAR[seg],
            opacity: seg === status ? 1 : 0.3,
          }}
        />
      ))}
      <span
        className="text-[9px] font-bold uppercase ml-1"
        style={{ color: STATUS_COLOR_VAR[status] }}
      >
        {status}
      </span>
    </div>
  );
}

/* ─── KPI card ────────────────────────────────────────────────────── */

function KpiCard({ metricKey, entries }: { metricKey: MetricKey; entries: KpiEntry[] }) {
  const b = BENCHMARKS[metricKey];
  const latest = entries[0];
  if (!latest) return null;
  const value = latest[metricKey] as number;
  const status = getBenchmarkStatus(metricKey, value);
  const change = getChange(entries, metricKey);

  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden border-2"
      style={{ background: "var(--card-bg)", borderColor: "var(--border-color)" }}
    >
      <div
        className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
        style={{ background: STATUS_COLOR_VAR[status] }}
      />
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
        {b.label}
      </p>
      <p className="text-2xl font-semibold tracking-wide leading-none" style={{ color: "var(--text-primary)" }}>
        {formatValue(metricKey, value)}
      </p>
      {change && (
        <p
          className="text-[11px] font-semibold mt-1.5"
          style={{ color: change.isUp ? "var(--green)" : "var(--red)" }}
        >
          {change.isUp ? "▲" : "▼"} {change.value.toFixed(1)}% vs last week
        </p>
      )}
      {!change && <p className="text-[11px] mt-1.5" style={{ color: "var(--text-faint)" }}>No prior week</p>}
      <BenchmarkBar metricKey={metricKey} value={value} />
    </div>
  );
}

/* ─── Trend chart ─────────────────────────────────────────────────── */

function TrendChart({ metricKey, entries }: { metricKey: MetricKey; entries: KpiEntry[] }) {
  const b = BENCHMARKS[metricKey];
  const chartData = [...entries].reverse().map((e) => ({
    week: new Date(e.weekOf).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: e[metricKey] as number,
  }));
  if (chartData.length < 2) return null;
  const hasBenchmarks = !("noBenchmark" in b && b.noBenchmark);

  return (
    <div
      className="rounded-2xl p-4 border-2"
      style={{ background: "var(--card-bg)", borderColor: "var(--border-color)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
        {b.label}
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData}>
          <XAxis dataKey="week" tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={35} />
          <Tooltip
            contentStyle={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              fontSize: 11,
            }}
            labelStyle={{ color: "var(--text-muted)" }}
            itemStyle={{ color: "var(--orange)" }}
          />
          {hasBenchmarks && (
            <>
              <ReferenceLine y={b.good} stroke="rgba(16,185,129,0.3)" strokeDasharray="4 4" />
              <ReferenceLine y={b.excellent} stroke="rgba(59,130,246,0.3)" strokeDasharray="4 4" />
            </>
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--orange)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--orange)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Benchmark reference table ──────────────────────────────────── */

function BenchmarkTable() {
  const metricsWithBenchmarks = METRIC_KEYS.filter(
    (k) => !("noBenchmark" in BENCHMARKS[k] && (BENCHMARKS[k] as any).noBenchmark),
  );

  return (
    <div
      className="rounded-2xl overflow-hidden border-2"
      style={{ background: "var(--card-bg)", borderColor: "var(--border-color)" }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          2026 Industry Benchmarks (Mobile / Web Apps)
        </p>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Metric</th>
            <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--red)" }}>Bad</th>
            <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--yellow)" }}>OK</th>
            <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--green)" }}>Good</th>
            <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--blue)" }}>Excellent</th>
          </tr>
        </thead>
        <tbody>
          {metricsWithBenchmarks.map((key) => {
            const b = BENCHMARKS[key];
            return (
              <tr key={key} className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{b.label}</td>
                <td className="text-center px-3 py-2.5 text-xs" style={{ color: "var(--red)", opacity: 0.8 }}>
                  {b.higher ? `<${b.bad}` : `>${b.bad}`}{b.unit}
                </td>
                <td className="text-center px-3 py-2.5 text-xs" style={{ color: "var(--yellow)", opacity: 0.8 }}>{b.ok}{b.unit}</td>
                <td className="text-center px-3 py-2.5 text-xs" style={{ color: "var(--green)", opacity: 0.8 }}>{b.good}{b.unit}</td>
                <td className="text-center px-3 py-2.5 text-xs" style={{ color: "var(--blue)", opacity: 0.8 }}>{b.excellent}+{b.unit}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default function WeeklyKpisPage() {
  const [entries, setEntries] = useState<KpiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/weekly-kpis");
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      // ignore — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAutoFetch = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/weekly-kpis/fetch", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to fetch from GA4");
      }
      await loadEntries();
    } catch (err: any) {
      setFetchError(err?.message || "Failed to fetch from GA4");
    } finally {
      setFetching(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div
            className="w-6 h-6 rounded-full animate-spin border-2"
            style={{ borderColor: "var(--border-color)", borderTopColor: "var(--orange)" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Weekly KPIs
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {entries.length > 0
              ? `${entries.length} week${entries.length > 1 ? "s" : ""} tracked · Last entry: ${new Date(entries[0].weekOf).toLocaleDateString()}`
              : "No data yet — fetch from GA4 or log manually"}
          </p>
          {fetchError && <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{fetchError}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoFetch}
            disabled={fetching}
            className="px-4 py-2 rounded-xl text-xs font-bold border-2 transition-opacity disabled:opacity-50"
            style={{
              background: "rgba(59,130,246,0.12)",
              color: "var(--blue)",
              borderColor: "rgba(59,130,246,0.3)",
            }}
          >
            {fetching ? "Fetching..." : "Fetch from GA4"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold border-2 transition-opacity"
            style={{
              background: "var(--orange)",
              color: "var(--white)",
              borderColor: "var(--orange)",
            }}
          >
            + Manual Entry
          </button>
        </div>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div
          className="rounded-2xl p-12 text-center border-2"
          style={{ background: "var(--card-bg)", borderColor: "var(--border-color)" }}
        >
          <p className="text-xl font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            No KPI Data Yet
          </p>
          <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "var(--text-muted)" }}>
            Every Monday morning, grab your metrics from GA4 and log them here. Track DAU,
            retention, sessions, ARPDAU, rating, and crash rate.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold border-2"
            style={{
              background: "var(--orange)",
              color: "var(--white)",
              borderColor: "var(--orange)",
            }}
          >
            Log First Week
          </button>
        </div>
      )}

      {/* KPI cards */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {METRIC_KEYS.map((key) => (
            <KpiCard key={key} metricKey={key} entries={entries} />
          ))}
        </div>
      )}

      {/* Benchmark reference */}
      <BenchmarkTable />

      {/* Trend charts */}
      {entries.length >= 2 && (
        <>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Trends (last {entries.length} weeks)
            </p>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {METRIC_KEYS.map((key) => (
              <TrendChart key={key} metricKey={key} entries={entries} />
            ))}
          </div>
        </>
      )}

      {/* Weekly log */}
      {entries.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden border-2"
          style={{ background: "var(--card-bg)", borderColor: "var(--border-color)" }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Weekly Log
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  {["Week", "DAU", "D1", "D7", "D30", "Sess", "ARPDAU", "Rating", "Crash", "Notes"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
                        i === 0 || i === 9 ? "text-left" : "text-right"
                      }`}
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {new Date(e.weekOf).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="text-right px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>{e.dau.toLocaleString()}</td>
                    <td className="text-right px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>{e.d1Retention}%</td>
                    <td className="text-right px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>{e.d7Retention}%</td>
                    <td className="text-right px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>{e.d30Retention}%</td>
                    <td className="text-right px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>{e.sessionsPerDau}</td>
                    <td className="text-right px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>${e.arpdau.toFixed(2)}</td>
                    <td className="text-right px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>{e.rating.toFixed(1)}</td>
                    <td className="text-right px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>{e.crashRate}%</td>
                    <td className="px-3 py-2.5 text-xs max-w-[150px] truncate" style={{ color: "var(--text-faint)" }}>
                      {e.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <EntryForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadEntries();
          }}
        />
      )}
    </div>
  );
}
