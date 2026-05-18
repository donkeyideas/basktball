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
 * rating, crash rate. Color-coded against 2026 industry benchmarks.
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
  }
  if (value <= b.excellent) return "excellent";
  if (value <= b.good) return "good";
  if (value <= b.ok) return "ok";
  return "bad";
}

const STATUS_COLOR = {
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

function EntryForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
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
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560, margin: "0 16px",
          background: "var(--card-bg)",
          border: "2px solid var(--border-color)",
          maxHeight: "90vh", overflowY: "auto",
          clipPath: "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)",
        }}
      >
        <div style={{ padding: "24px 30px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 24, color: "var(--text-primary)" }}>
            LOG WEEKLY KPIS
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Enter metrics for this week from Google Analytics
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px 30px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
              Week of (Monday)
            </label>
            <input
              type="date"
              value={form.weekOf}
              onChange={(e) => setForm({ ...form, weekOf: e.target.value })}
              style={{
                marginTop: 4, width: "100%",
                background: "var(--input-bg)",
                border: "2px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "10px 12px", fontSize: 14, borderRadius: 0,
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fields.map((f) => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
                  {f.label}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  style={{
                    marginTop: 4, width: "100%",
                    background: "var(--input-bg)",
                    border: "2px solid var(--border-color)",
                    color: "var(--text-primary)",
                    padding: "10px 12px", fontSize: 14, borderRadius: 0,
                  }}
                />
              </div>
            ))}
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any context for this week..."
              rows={2}
              style={{
                marginTop: 4, width: "100%",
                background: "var(--input-bg)",
                border: "2px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "10px 12px", fontSize: 14, resize: "none", borderRadius: 0,
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "var(--red)", textAlign: "center" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
              {saving ? "SAVING..." : "SAVE ENTRY"}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              CANCEL
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

  // Status label is rendered inline next to the metric value in KpiCard,
  // so the bar itself is just the colored segments.
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
      {segments.map((seg) => (
        <div
          key={seg}
          style={{
            height: 6, flex: 1, borderRadius: 3,
            background: STATUS_COLOR[seg],
            opacity: seg === status ? 1 : 0.25,
          }}
        />
      ))}
    </div>
  );
}

/* ─── KPI card ────────────────────────────────────────────────────── */

function KpiCard({ metricKey, entries }: { metricKey: MetricKey; entries: KpiEntry[] }) {
  const b = BENCHMARKS[metricKey];
  const hasBenchmarks = !("noBenchmark" in b && b.noBenchmark);
  const latest = entries[0];
  if (!latest) return null;
  const value = latest[metricKey] as number;
  const status = getBenchmarkStatus(metricKey, value);
  const change = getChange(entries, metricKey);

  return (
    <div className="stat-card" style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute", top: 16, right: 16,
          width: 10, height: 10, borderRadius: "50%",
          background: STATUS_COLOR[status],
        }}
      />
      <div className="label" style={{ marginBottom: 8 }}>{b.label}</div>
      <div className="value" style={{ marginBottom: 8, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span>{formatValue(metricKey, value)}</span>
        {hasBenchmarks && (
          <span style={{
            fontSize: 32, fontWeight: 700, textTransform: "uppercase",
            color: STATUS_COLOR[status],
            fontFamily: "'Roboto Mono', monospace",
            lineHeight: 1,
          }}>
            {status}
          </span>
        )}
      </div>
      {change && (
        <div className={`change ${change.isUp ? "positive" : "negative"}`}>
          {change.isUp ? "▲" : "▼"} {change.value.toFixed(1)}% vs last week
        </div>
      )}
      {!change && (
        <div style={{ fontSize: 12, color: "var(--text-faint)" }}>No prior week</div>
      )}
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
    <div className="stat-card" style={{ padding: 20 }}>
      <div style={{
        fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase",
        letterSpacing: 1, fontWeight: 700, marginBottom: 12,
      }}>
        {b.label}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData}>
          <XAxis dataKey="week" tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} width={35} />
          <Tooltip
            contentStyle={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-color)",
              borderRadius: 0,
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
      // empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

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

  const metricsWithBenchmarks = METRIC_KEYS.filter(
    (k) => !("noBenchmark" in BENCHMARKS[k] && (BENCHMARKS[k] as any).noBenchmark),
  );

  return (
    <>
      {/* Page header — matches the .admin-header pattern used across the dashboard */}
      <div className="admin-header">
        <div>
          <h1>WEEKLY KPIS</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {entries.length > 0
              ? `${entries.length} week${entries.length > 1 ? "s" : ""} tracked · Last entry: ${new Date(entries[0].weekOf).toLocaleDateString()}`
              : "No data yet — fetch from GA4 or log manually"}
          </p>
          {fetchError && (
            <p style={{ fontSize: 12, color: "var(--red)", marginTop: 4 }}>{fetchError}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleAutoFetch}
            disabled={fetching}
            className="btn btn-secondary"
            style={{ opacity: fetching ? 0.5 : 1 }}
          >
            {fetching ? "FETCHING..." : "FETCH FROM GA4"}
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + MANUAL ENTRY
          </button>
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: "30px 40px" }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "3px solid var(--border-color)",
              borderTopColor: "var(--orange)",
              animation: "spin 1s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="section" style={{ textAlign: "center", padding: 60 }}>
            <div style={{
              fontFamily: "'Anton', sans-serif", fontSize: 28,
              color: "var(--text-secondary)", marginBottom: 12,
            }}>
              NO KPI DATA YET
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 480, margin: "0 auto 24px" }}>
              Every Monday morning, grab your metrics from GA4 and log them here. Track DAU,
              retention, sessions, ARPDAU, rating, and crash rate.
            </p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              LOG FIRST WEEK
            </button>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <>
            {/* KPI cards section */}
            <div className="section">
              <div className="section-title">CURRENT WEEK SNAPSHOT</div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 20,
              }}>
                {METRIC_KEYS.map((key) => (
                  <KpiCard key={key} metricKey={key} entries={entries} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Benchmark reference */}
        <div className="section">
          <div className="section-title">2026 INDUSTRY BENCHMARKS</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Metric</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: 1 }}>Bad</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--yellow)", textTransform: "uppercase", letterSpacing: 1 }}>OK</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: 1 }}>Good</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1 }}>Excellent</th>
                </tr>
              </thead>
              <tbody>
                {metricsWithBenchmarks.map((key) => {
                  const b = BENCHMARKS[key];
                  return (
                    <tr key={key} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{b.label}</td>
                      <td style={{ textAlign: "center", padding: "12px 16px", fontSize: 13, color: "var(--red)", opacity: 0.85 }}>{b.higher ? `<${b.bad}` : `>${b.bad}`}{b.unit}</td>
                      <td style={{ textAlign: "center", padding: "12px 16px", fontSize: 13, color: "var(--yellow)", opacity: 0.85 }}>{b.ok}{b.unit}</td>
                      <td style={{ textAlign: "center", padding: "12px 16px", fontSize: 13, color: "var(--green)", opacity: 0.85 }}>{b.good}{b.unit}</td>
                      <td style={{ textAlign: "center", padding: "12px 16px", fontSize: 13, color: "var(--blue)", opacity: 0.85 }}>{b.excellent}+{b.unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trend charts */}
        {!loading && entries.length >= 2 && (
          <div className="section">
            <div className="section-title">TRENDS — LAST {entries.length} WEEKS</div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 20,
            }}>
              {METRIC_KEYS.map((key) => (
                <TrendChart key={key} metricKey={key} entries={entries} />
              ))}
            </div>
          </div>
        )}

        {/* Weekly log */}
        {!loading && entries.length > 0 && (
          <div className="section">
            <div className="section-title">WEEKLY LOG</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {["Week", "DAU", "D1", "D7", "D30", "Sess", "ARPDAU", "Rating", "Crash", "Notes"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 14px", fontSize: 11, fontWeight: 700,
                          color: "var(--text-muted)", textTransform: "uppercase",
                          letterSpacing: 1, textAlign: i === 0 || i === 9 ? "left" : "right",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                        {new Date(e.weekOf).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{e.dau.toLocaleString()}</td>
                      <td style={{ textAlign: "right", padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{e.d1Retention}%</td>
                      <td style={{ textAlign: "right", padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{e.d7Retention}%</td>
                      <td style={{ textAlign: "right", padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{e.d30Retention}%</td>
                      <td style={{ textAlign: "right", padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{e.sessionsPerDau}</td>
                      <td style={{ textAlign: "right", padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>${e.arpdau.toFixed(2)}</td>
                      <td style={{ textAlign: "right", padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{e.rating.toFixed(1)}</td>
                      <td style={{ textAlign: "right", padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{e.crashRate}%</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-faint)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {e.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <EntryForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadEntries(); }}
        />
      )}
    </>
  );
}
