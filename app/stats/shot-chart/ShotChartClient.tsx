"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TakeCardButton from "@/components/TakeCardButton";

type Player = {
  id: string;
  name: string;
  position?: string | null;
  jerseyNum?: number | null;
  headshotUrl?: string | null;
  team?: { id: string; name: string; abbreviation: string } | null;
};

type Shot = {
  id: string;
  x: number;
  y: number;
  made: boolean;
  zone: "paint" | "mid" | "3pt" | "rim";
  distance: number;
  quarter: number;
};

type Zones = Record<
  "paint" | "mid" | "3pt" | "rim",
  { made: number; total: number; pct: number }
>;

type Filter = "all" | "clutch" | "home" | "away" | "made" | "missed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All Shots" },
  { id: "made", label: "Made" },
  { id: "missed", label: "Missed" },
  { id: "clutch", label: "Clutch" },
  { id: "home", label: "Home" },
  { id: "away", label: "Away" },
];

const ZONE_LABELS: Record<keyof Zones, string> = {
  rim: "Restricted Area",
  paint: "In the Paint",
  mid: "Mid-Range",
  "3pt": "3-Point",
};

const LEAGUE_AVG: Record<keyof Zones, number> = {
  rim: 64,
  paint: 42,
  mid: 41,
  "3pt": 36,
};

export default function ShotChartClient({
  initialPlayer,
}: {
  initialPlayer: Player | null;
}) {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(initialPlayer);
  const [shots, setShots] = useState<Shot[]>([]);
  const [zones, setZones] = useState<Zones | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!player?.id) return;
    let cancelled = false;
    const ac = new AbortController();

    // Defer setState into a microtask so it doesn't fire synchronously in the effect body
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      fetch(`/api/shots/${player.id}`, { signal: ac.signal })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          if (d.success) {
            setShots(d.shots || []);
            setZones(d.zones || null);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [player?.id]);

  // Search players
  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) {
      // Defer to avoid synchronous setState in effect body
      const id = setTimeout(() => setSearchResults([]), 0);
      return () => clearTimeout(id);
    }
    let cancelled = false;
    const startId = setTimeout(() => setSearching(true), 0);
    const t = setTimeout(() => {
      fetch(`/api/players?q=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d.success) setSearchResults(d.players || []);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
      clearTimeout(startId);
    };
  }, [searchOpen, searchQuery]);

  const filtered = useMemo(() => {
    if (filter === "all") return shots;
    if (filter === "made") return shots.filter((s) => s.made);
    if (filter === "missed") return shots.filter((s) => !s.made);
    if (filter === "clutch") return shots.filter((s) => s.quarter === 4);
    // home/away aren't in the data — return all
    return shots;
  }, [shots, filter]);

  const computedStats = useMemo(() => {
    const fga = filtered.length;
    const fgm = filtered.filter((s) => s.made).length;
    const fga3 = filtered.filter((s) => s.zone === "3pt").length;
    const fgm3 = filtered.filter((s) => s.zone === "3pt" && s.made).length;
    const fgm2 = fgm - fgm3;
    const fgPct = fga > 0 ? (fgm / fga) * 100 : 0;
    const tpPct = fga3 > 0 ? (fgm3 / fga3) * 100 : 0;
    const efg = fga > 0 ? ((fgm + 0.5 * fgm3) / fga) * 100 : 0;
    // TS approximated without FTs:
    const ts = fga > 0 ? ((fgm2 * 2 + fgm3 * 3) / (2 * fga)) * 100 : 0;
    return { fga, fgm, fgPct, tpPct, efg, ts };
  }, [filtered]);

  const selectPlayer = useCallback(
    (p: Player) => {
      setPlayer(p);
      setSearchOpen(false);
      setSearchQuery("");
      router.replace(`/stats/shot-chart?playerId=${p.id}`, { scroll: false });
    },
    [router],
  );

  if (!player) {
    return (
      <main className="sc-empty">
        <h1>No players available yet.</h1>
        <p>Sync the player database and come back.</p>
        <style jsx>{`
          .sc-empty { padding: 80px 24px; text-align: center; color: rgba(255,255,255,0.7); font-family: var(--font-inter); }
          h1 { font-family: var(--font-anton); font-size: 32px; letter-spacing: 2px; color: var(--orange, #FF6B35); }
          p { margin-top: 8px; }
        `}</style>
      </main>
    );
  }

  const teamAbbr = player.team?.abbreviation || "—";

  return (
    <main className="sc-page">
      <div className="sc-strip">
        <span><span className="dot" />SHOT CHART</span>
        <span>BASKTBALL · STAT LAB</span>
      </div>

      <section className="sc-player">
        <div className="sc-headshot">
          {player.headshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={player.headshotUrl} alt={player.name} />
          ) : (
            <span>{player.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</span>
          )}
        </div>
        <div className="sc-pinfo">
          <div className="sc-pname">{player.name}</div>
          <div className="sc-pmeta">
            <span className="accent">{teamAbbr}</span>
            {player.jerseyNum != null && <span>#{player.jerseyNum}</span>}
            {player.position && <span>{player.position}</span>}
            <span>2025-26</span>
          </div>
        </div>
        <button className="sc-switch" type="button" onClick={() => setSearchOpen((v) => !v)}>
          {searchOpen ? "CLOSE" : "CHANGE PLAYER"}
        </button>
      </section>

      {searchOpen && (
        <section className="sc-search">
          <input
            type="search"
            placeholder="Search players…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searching && <div className="sc-search-hint">Searching…</div>}
          {!searching && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
            <div className="sc-search-hint">No matches.</div>
          )}
          <ul className="sc-results">
            {searchResults.slice(0, 8).map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => selectPlayer(p)}>
                  <span className="r-name">{p.name}</span>
                  <span className="r-meta">
                    {p.team?.abbreviation || "—"}
                    {p.position && ` · ${p.position}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="sc-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`sc-filter ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </section>

      <section className="sc-court-wrap">
        {loading && <div className="sc-loading">Loading shots…</div>}
        <CourtSVG shots={filtered} />
      </section>

      <section className="sc-legend">
        <div className="leg-item"><span className="dot made" />MADE</div>
        <div className="leg-item"><span className="dot miss" />MISS</div>
        <div className="leg-count">{filtered.length} ATTEMPTS</div>
      </section>

      <section className="sc-stats">
        <Stat value={computedStats.fgPct.toFixed(1)} label="FG %" />
        <Stat value={computedStats.tpPct.toFixed(1)} label="3P %" />
        <Stat value={computedStats.efg.toFixed(1)} label="eFG %" />
        <Stat value={computedStats.ts.toFixed(1)} label="TS %" />
      </section>

      {zones && (
        <section className="sc-zone-table">
          <div className="sc-row sc-row-head">
            <span>ZONE</span>
            <span>FG%</span>
            <span>VS LG</span>
            <span>ATT</span>
          </div>
          {(Object.keys(zones) as Array<keyof Zones>).map((z) => {
            const v = zones[z];
            const delta = v.pct - LEAGUE_AVG[z];
            return (
              <div key={z} className="sc-row">
                <span className="z-name">{ZONE_LABELS[z]}</span>
                <span className="z-val">{v.pct.toFixed(1)}</span>
                <span className={`z-delta ${delta >= 0 ? "up" : "dn"}`}>
                  {delta >= 0 ? "+" : ""}
                  {delta.toFixed(1)}
                </span>
                <span className="z-val">{v.total}</span>
              </div>
            );
          })}
        </section>
      )}

      <section className="sc-actions">
        <TakeCardButton
          variant="block"
          label="SHARE AS CARD"
          seed={{
            template: "stat-line",
            theme: "orange",
            tag: "SHOT CHART",
            num: `${computedStats.fgPct.toFixed(0)}%`,
            unit: "FG",
            context: `${player.name} — ${computedStats.fgm}/${computedStats.fga} from the field${filter !== "all" ? ` (${FILTERS.find((f) => f.id === filter)?.label})` : ""}. 3P% ${computedStats.tpPct.toFixed(1)} · eFG ${computedStats.efg.toFixed(1)} · TS ${computedStats.ts.toFixed(1)}.`,
            meta: `${teamAbbr} · 2025-26`,
            source: `/stats/shot-chart?playerId=${player.id}`,
          }}
        />
      </section>

      <style jsx>{`
        .sc-page {
          background: #0d0d0d;
          color: #fff;
          font-family: var(--font-inter), system-ui, sans-serif;
          padding-bottom: 60px;
        }
        .sc-strip {
          background: #FF6B35;
          color: #fff;
          padding: 6px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-barlow);
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .sc-strip .dot {
          width: 7px; height: 7px;
          background: #fff;
          border-radius: 50%;
          display: inline-block;
          margin-right: 6px;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
        .sc-player {
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: #1A1A1A;
        }
        .sc-headshot {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1D428A, #FFC72C);
          border: 2px solid #fff;
          overflow: hidden;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-anton);
          font-size: 18px;
          color: #fff;
        }
        .sc-headshot img { width: 100%; height: 100%; object-fit: cover; }
        .sc-pinfo { flex: 1; min-width: 0; }
        .sc-pname {
          font-family: var(--font-anton);
          font-size: 22px;
          letter-spacing: 2px;
          line-height: 1.05;
          text-transform: uppercase;
        }
        .sc-pmeta {
          display: flex;
          gap: 10px;
          font-family: var(--font-roboto-mono);
          font-size: 11px;
          color: rgba(255,255,255,0.55);
          margin-top: 4px;
          letter-spacing: 0.3px;
        }
        .sc-pmeta .accent { color: #FF6B35; font-weight: 700; }
        .sc-switch {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          font-family: var(--font-barlow);
          font-size: 11px;
          letter-spacing: 1.5px;
          font-weight: 700;
          text-transform: uppercase;
          cursor: pointer;
        }
        .sc-switch:hover { border-color: #FF6B35; color: #FF6B35; }

        .sc-search {
          padding: 14px 18px;
          background: #1A1A1A;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .sc-search input {
          width: 100%;
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          padding: 10px 14px;
          border-radius: 6px;
          font-family: var(--font-inter);
          font-size: 14px;
          outline: none;
        }
        .sc-search input:focus { border-color: #FF6B35; }
        .sc-search-hint {
          padding: 10px 0 0;
          color: rgba(255,255,255,0.5);
          font-family: var(--font-roboto-mono);
          font-size: 11px;
        }
        .sc-results { list-style: none; padding: 0; margin: 8px 0 0; }
        .sc-results li button {
          width: 100%;
          background: transparent;
          border: none;
          color: #fff;
          padding: 10px 12px;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          text-align: left;
          font-family: var(--font-barlow);
        }
        .sc-results li button:hover { background: rgba(255,107,53,0.1); }
        .r-name { font-weight: 700; font-size: 14px; }
        .r-meta { font-family: var(--font-roboto-mono); font-size: 11px; color: rgba(255,255,255,0.5); }

        .sc-filters {
          display: flex;
          gap: 6px;
          padding: 14px 18px;
          overflow-x: auto;
        }
        .sc-filters::-webkit-scrollbar { display: none; }
        .sc-filter {
          flex-shrink: 0;
          background: #1A1A1A;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.65);
          padding: 7px 14px;
          border-radius: 4px;
          font-family: var(--font-barlow);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
        }
        .sc-filter.active { background: #FF6B35; border-color: #FF6B35; color: #fff; }

        .sc-court-wrap {
          padding: 0 18px;
          position: relative;
          max-width: 720px;
          margin: 0 auto;
        }
        .sc-loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-roboto-mono);
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          background: rgba(13,13,13,0.6);
          z-index: 2;
        }

        .sc-legend {
          display: flex;
          gap: 14px;
          padding: 10px 18px;
          align-items: center;
          max-width: 720px;
          margin: 0 auto;
        }
        .leg-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-barlow);
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
          font-weight: 700;
        }
        .leg-item .dot {
          width: 10px; height: 10px;
          border-radius: 50%;
        }
        .leg-item .dot.made { background: #FF6B35; }
        .leg-item .dot.miss {
          background: transparent;
          border: 2px solid rgba(255,255,255,0.45);
        }
        .leg-count {
          margin-left: auto;
          font-family: var(--font-roboto-mono);
          font-size: 11px;
          color: #FF6B35;
          font-weight: 700;
        }

        .sc-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          padding: 0 18px 14px;
          max-width: 720px;
          margin: 0 auto;
        }
        .sc-zone-table {
          margin: 0 18px 18px;
          background: #1A1A1A;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          overflow: hidden;
          max-width: 720px;
        }
        @media (min-width: 900px) {
          .sc-zone-table { margin-left: auto; margin-right: auto; }
        }
        .sc-row {
          display: grid;
          grid-template-columns: 1.7fr 0.6fr 0.7fr 0.7fr;
          align-items: center;
          padding: 11px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          font-family: var(--font-barlow);
          font-size: 13px;
        }
        .sc-row:last-child { border-bottom: none; }
        .sc-row-head {
          background: rgba(255,107,53,0.07);
          font-family: var(--font-anton);
          font-size: 11px;
          letter-spacing: 1.5px;
          color: #FF6B35;
          text-transform: uppercase;
        }
        .sc-row .z-name { color: #fff; font-weight: 700; }
        .sc-row .z-val {
          font-family: var(--font-roboto-mono);
          font-weight: 700;
          text-align: right;
        }
        .sc-row .z-delta {
          font-family: var(--font-roboto-mono);
          font-size: 12px;
          text-align: right;
          font-weight: 700;
        }
        .z-delta.up { color: #10B981; }
        .z-delta.dn { color: #EF4444; }

        .sc-actions {
          padding: 0 18px;
          max-width: 720px;
          margin: 0 auto;
        }
      `}</style>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-cell">
      <div className="v">{value}</div>
      <div className="l">{label}</div>
      <style jsx>{`
        .stat-cell {
          background: #1A1A1A;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          padding: 10px 6px;
          text-align: center;
        }
        .v {
          font-family: var(--font-roboto-mono);
          font-weight: 700;
          font-size: 18px;
          color: #FF6B35;
          line-height: 1;
        }
        .l {
          font-family: var(--font-barlow);
          font-size: 10px;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.55);
          margin-top: 5px;
          text-transform: uppercase;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

function CourtSVG({ shots }: { shots: Shot[] }) {
  // Court rendered with basket at top, half-court at bottom.
  // viewBox 100 x 100, baseline at y=0.
  // The /api/shots data uses y=high near the basket; we flip to plot with basket at top.
  return (
    <div className="court-stage">
      <svg viewBox="0 0 100 100" className="court" xmlns="http://www.w3.org/2000/svg">
        {/* Court outline */}
        <rect x="1" y="1" width="98" height="98" className="line" fill="none" />

        {/* Paint */}
        <rect x="34" y="1" width="32" height="38" className="paint" />

        {/* Restricted area arc (basket centered at 50, 6) */}
        <path d="M 41 6 A 9 9 0 0 0 59 6" className="line" fill="none" />

        {/* Free throw line */}
        <line x1="34" y1="39" x2="66" y2="39" className="line" />

        {/* FT circle top half (solid) */}
        <path d="M 38 39 A 12 12 0 0 0 62 39" className="line" fill="none" />
        {/* FT circle bottom half (dashed) */}
        <path d="M 38 39 A 12 12 0 0 1 62 39" className="line" fill="none" strokeDasharray="1.5 1.2" />

        {/* Basket + rim */}
        <line x1="44" y1="3" x2="56" y2="3" className="line" />
        <circle cx="50" cy="6" r="1.6" className="rim" />

        {/* 3-point line: corner sidelines + arc */}
        <line x1="8" y1="1" x2="8" y2="20" className="line" />
        <line x1="92" y1="1" x2="92" y2="20" className="line" />
        <path d="M 8 20 A 42 42 0 0 0 92 20" className="line" fill="none" />

        {/* Half-court line */}
        <line x1="1" y1="99" x2="99" y2="99" className="line" />

        {/* Shots */}
        {shots.map((s) => {
          // Flip y so basket-at-top
          const cy = 100 - s.y;
          const cx = s.x;
          return s.made ? (
            <circle
              key={s.id}
              cx={cx}
              cy={cy}
              r={1.4}
              fill="#FF6B35"
              opacity={0.85}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={0.3}
            />
          ) : (
            <g key={s.id} opacity={0.7}>
              <circle
                cx={cx}
                cy={cy}
                r={1.3}
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={0.6}
              />
            </g>
          );
        })}
      </svg>
      <style jsx>{`
        .court-stage {
          background: #0F0905;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 10px;
          margin-top: 4px;
        }
        .court { width: 100%; height: auto; display: block; }
      `}</style>
      <style jsx>{`
        .court :global(.line) {
          stroke: rgba(255,255,255,0.28);
          stroke-width: 0.4;
          fill: none;
        }
        .court :global(.paint) {
          fill: rgba(255,107,53,0.04);
          stroke: rgba(255,255,255,0.28);
          stroke-width: 0.4;
        }
        .court :global(.rim) {
          fill: none;
          stroke: #FF6B35;
          stroke-width: 0.5;
        }
      `}</style>
    </div>
  );
}
