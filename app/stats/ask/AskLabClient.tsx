"use client";

import { useState } from "react";
import TakeCardButton from "@/components/TakeCardButton";

type ParsedQuery = {
  playerName: string | null;
  metric: string | null;
  comparator: string | null;
  value: number | null;
  opponentTeam: string | null;
  opponentFilter: string | null;
  opponentRank: number | null;
  season: string | null;
  isHome: boolean | null;
  isClutch: boolean | null;
};

type ResultRow = {
  date: string;
  gameId: string;
  home: { id: string; abbreviation: string; name: string };
  away: { id: string; abbreviation: string; name: string };
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  player: { id: string; name: string };
  stats: {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    tpm: number;
    fgm: number;
    fga: number;
    min: number;
    pm: number;
  };
};

type AskResponse = {
  parsed: ParsedQuery;
  resolvedPlayer: { id: string; name: string } | null;
  results: ResultRow[];
  count: number;
  limitations: string[];
  error?: string;
};

const METRIC_LABEL: Record<string, string> = {
  points: "Points",
  rebounds: "Rebounds",
  assists: "Assists",
  steals: "Steals",
  blocks: "Blocks",
  threes: "3-Pointers Made",
  turnovers: "Turnovers",
  minutes: "Minutes",
  fgPct: "FG%",
};

const COMPARATOR_LABEL: Record<string, string> = {
  gte: "≥",
  lte: "≤",
  eq: "=",
};

export default function AskLabClient({ examples }: { examples: string[] }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string>("");
  const [data, setData] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const onRun = async (q?: string) => {
    const text = (q ?? query).trim();
    if (!text) return;
    setQuery(text);
    setSubmitted(text);
    setError(null);
    setData(null);
    setLoading(true);
    setSavedMsg(null);
    try {
      const res = await fetch("/api/lab/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const d: AskResponse = await res.json();
      if (d.error) setError(d.error);
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!data || !submitted) return;
    setSaving(true);
    setSavedMsg(null);
    try {
      const res = await fetch("/api/lab/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawQuery: submitted, parsed: data.parsed }),
      });
      if (res.status === 401) {
        setSavedMsg("Sign in to save queries.");
      } else if (res.ok) {
        setSavedMsg("Saved. You'll get a push when this triggers again.");
      } else {
        const d = await res.json().catch(() => ({}));
        setSavedMsg(d.error || "Could not save");
      }
    } catch {
      setSavedMsg("Could not save");
    } finally {
      setSaving(false);
    }
  };

  const renderEntities = () => {
    if (!query) return null;
    const parts: { text: string; type: "player" | "stat" | "filter" | "plain" }[] = [];
    let working = query;

    // Highlight numbers + metric
    working = working.replace(
      /(\d+\s*\+)\s*(points|pts|rebounds|reb|boards|assists|ast|dimes|steals|stl|blocks|blk|threes|3pt|3-pointers|turnovers|tov)/gi,
      "<<STAT::$1 $2>>",
    );
    // Highlight "vs X defense"
    working = working.replace(
      /(vs\.?\s+(?:a\s+)?top[-\s]?\d+\s+(?:defense|defenses|def))/gi,
      "<<FILTER::$1>>",
    );
    // Highlight "vs <Team>"
    working = working.replace(/(vs\.?\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/g, "<<FILTER::$1>>");
    // Highlight "clutch" / "4th quarter"
    working = working.replace(/\b(clutch|4th\s*quarter|fourth\s*quarter|home|away)\b/gi, "<<FILTER::$1>>");
    // Heuristic player name (proper noun)
    if (data?.parsed?.playerName) {
      const safe = data.parsed.playerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      working = working.replace(new RegExp(`(${safe})`, "i"), "<<PLAYER::$1>>");
    }

    const tokens = working.split(/(<<(?:PLAYER|STAT|FILTER)::[^>]+>>)/);
    for (const tk of tokens) {
      const m = tk.match(/^<<(PLAYER|STAT|FILTER)::([^>]+)>>$/);
      if (m) {
        parts.push({
          text: m[2],
          type: m[1].toLowerCase() as "player" | "stat" | "filter",
        });
      } else if (tk) {
        parts.push({ text: tk, type: "plain" });
      }
    }

    return (
      <div className="ent-view">
        {parts.map((p, i) =>
          p.type === "plain" ? (
            <span key={i}>{p.text}</span>
          ) : (
            <span key={i} className={`ent ent-${p.type}`}>
              {p.text.trim()}
            </span>
          ),
        )}
      </div>
    );
  };

  return (
    <main className="lab-page">
      <div className="lab-strip">
        <span><span className="dot" />ASK THE LAB</span>
        <span>POWERED BY AI</span>
      </div>

      <header className="lab-hero">
        <div className="kicker">STAT LAB</div>
        <h1>ASK ANYTHING</h1>
        <p>
          Type a basketball question in plain English. The Lab parses it, runs it against
          the database, and shows what it found.
        </p>
      </header>

      <section className="lab-input-wrap">
        <textarea
          className="lab-input"
          placeholder="e.g. Show me every game where Jokic had 10+ assists"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onRun();
            }
          }}
        />
        <button type="button" className="lab-run" onClick={() => onRun()} disabled={loading || !query.trim()}>
          {loading ? "PARSING…" : "RUN QUERY"}
        </button>
      </section>

      <div className="ent-legend">
        <span className="lg lg-p">PLAYER</span>
        <span className="lg lg-s">STAT</span>
        <span className="lg lg-f">FILTER</span>
      </div>

      {submitted && renderEntities()}

      {data?.parsed && (
        <section className="parsed-card">
          <div className="pc-head">I FOUND</div>
          <ParsedLine label="Player" value={data.resolvedPlayer?.name || data.parsed.playerName || "—"} type="player" />
          {data.parsed.metric && data.parsed.comparator && data.parsed.value != null && (
            <ParsedLine
              label="Condition"
              value={`${METRIC_LABEL[data.parsed.metric] || data.parsed.metric} ${COMPARATOR_LABEL[data.parsed.comparator] || data.parsed.comparator} ${data.parsed.value}`}
              type="stat"
            />
          )}
          {data.parsed.opponentTeam && (
            <ParsedLine label="Opponent" value={data.parsed.opponentTeam} type="filter" />
          )}
          {data.parsed.opponentFilter && (
            <ParsedLine
              label="Opponent"
              value={`${data.parsed.opponentFilter === "top_def" ? "Top" : "Bottom"}-${data.parsed.opponentRank || 10} ${data.parsed.opponentFilter.includes("def") ? "Defense" : "Offense"}`}
              type="filter"
            />
          )}
          {data.parsed.isClutch && <ParsedLine label="Filter" value="Clutch / 4th quarter" type="filter" />}
          {data.parsed.isHome != null && (
            <ParsedLine label="Location" value={data.parsed.isHome ? "Home" : "Away"} type="filter" />
          )}
          {!data.parsed.metric && !data.parsed.playerName && (
            <div className="pc-warn">Could not parse this query — try mentioning a player and a stat.</div>
          )}
        </section>
      )}

      {data?.limitations && data.limitations.length > 0 && (
        <section className="limits">
          <div className="lim-head">HEADS UP</div>
          {data.limitations.map((l, i) => (
            <div key={i} className="lim-row">{l}</div>
          ))}
        </section>
      )}

      {data && (
        <section className="res-section">
          <div className="res-head">
            <span className="res-title">RESULTS</span>
            <span className="res-count">{data.count} GAME{data.count === 1 ? "" : "S"}</span>
          </div>

          {data.count === 0 && !loading && (
            <div className="res-empty">No games matched. Try a wider threshold or a different player.</div>
          )}

          {data.results.map((r) => {
            const dt = new Date(r.date);
            const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <article key={r.gameId} className="res-row">
                <span className="r-date">{dateStr.toUpperCase()}</span>
                <span className="r-match">
                  {r.away.abbreviation} <span className="r-at">@</span> {r.home.abbreviation}
                </span>
                <span className="r-stats">
                  <strong>{r.stats.pts}</strong>P · <strong>{r.stats.reb}</strong>R · <strong>{r.stats.ast}</strong>A
                  {r.stats.blk > 0 && <> · <strong>{r.stats.blk}</strong>B</>}
                </span>
                <span className="r-score">
                  {r.homeScore != null && r.awayScore != null
                    ? `${r.awayScore}-${r.homeScore}`
                    : "—"}
                </span>
              </article>
            );
          })}

          {data.count > 0 && (
            <div className="res-actions">
              <button type="button" className="btn-save" onClick={onSave} disabled={saving}>
                {saving ? "SAVING…" : "SAVE QUERY"}
              </button>
              <TakeCardButton
                variant="ghost"
                label="SHARE AS CARD"
                seed={{
                  template: "stat-line",
                  theme: "dark",
                  tag: "ASK THE LAB",
                  num: String(data.count),
                  unit: "GAMES",
                  context: submitted,
                  meta: data.resolvedPlayer?.name ? `${data.resolvedPlayer.name.toUpperCase()}` : "",
                  source: `/stats/ask`,
                }}
              />
            </div>
          )}
          {savedMsg && <div className="saved-msg">{savedMsg}</div>}
        </section>
      )}

      {!data && !loading && (
        <section className="examples">
          <div className="ex-head">TRY ONE OF THESE</div>
          {examples.map((ex) => (
            <button key={ex} type="button" className="ex-row" onClick={() => onRun(ex)}>
              <span>{ex}</span>
              <span className="ex-arrow">›</span>
            </button>
          ))}
        </section>
      )}

      {error && <div className="err">{error}</div>}

      <style jsx>{`
        .lab-page {
          background: #0d0d0d;
          color: #fff;
          font-family: var(--font-inter), system-ui, sans-serif;
          padding-bottom: 80px;
        }
        .lab-strip {
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
        .lab-strip .dot {
          width: 7px; height: 7px;
          background: #fff;
          border-radius: 50%;
          display: inline-block;
          margin-right: 6px;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .lab-hero {
          padding: 24px 18px 12px;
          max-width: 720px;
          margin: 0 auto;
        }
        .lab-hero .kicker {
          font-family: var(--font-barlow);
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 2.5px;
          color: #FF6B35;
          text-transform: uppercase;
        }
        .lab-hero h1 {
          font-family: var(--font-anton);
          font-size: 40px;
          letter-spacing: 3px;
          margin: 6px 0 8px;
          text-shadow: 2px 2px 0 rgba(255,107,53,0.2);
        }
        .lab-hero p {
          font-size: 14px;
          color: rgba(255,255,255,0.65);
          line-height: 1.5;
          max-width: 540px;
        }

        .lab-input-wrap {
          padding: 0 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 720px;
          margin: 0 auto;
        }
        .lab-input {
          background: #1A1A1A;
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          font-family: var(--font-inter);
          font-size: 15px;
          padding: 14px 16px;
          border-radius: 8px;
          outline: none;
          resize: vertical;
          line-height: 1.4;
        }
        .lab-input:focus { border-color: #FF6B35; }
        .lab-run {
          align-self: flex-start;
          background: #FF6B35;
          color: #fff;
          border: none;
          padding: 12px 18px;
          border-radius: 6px;
          font-family: var(--font-anton);
          font-size: 14px;
          letter-spacing: 2.5px;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(255,107,53,0.25);
        }
        .lab-run:disabled { opacity: 0.5; cursor: not-allowed; }
        .lab-run:hover:not(:disabled) { background: #ff8c5a; }

        .ent-legend {
          display: flex;
          gap: 14px;
          padding: 14px 18px 4px;
          max-width: 720px;
          margin: 0 auto;
        }
        .ent-legend .lg {
          font-family: var(--font-barlow);
          font-size: 10px;
          letter-spacing: 1.5px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .lg-p { color: #10B981; }
        .lg-s { color: #3B82F6; }
        .lg-f { color: #FF6B35; }
        .lg::before {
          content: '●';
          margin-right: 4px;
        }

        :global(.ent-view) {
          padding: 0 18px 8px;
          max-width: 720px;
          margin: 0 auto;
          font-family: var(--font-barlow);
          font-size: 17px;
          line-height: 1.5;
          letter-spacing: 0.3px;
          color: rgba(255,255,255,0.85);
        }
        :global(.ent) {
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 700;
          margin: 0 2px;
          display: inline-block;
        }
        :global(.ent-player) { color: #10B981; background: rgba(16,185,129,0.13); }
        :global(.ent-stat) { color: #3B82F6; background: rgba(59,130,246,0.13); }
        :global(.ent-filter) { color: #FF6B35; background: rgba(255,107,53,0.13); }

        .parsed-card {
          margin: 14px 18px;
          background: rgba(255,107,53,0.04);
          border: 1px solid rgba(255,107,53,0.25);
          border-radius: 8px;
          padding: 14px 16px;
          max-width: 720px;
        }
        @media (min-width: 760px) {
          .parsed-card { margin-left: auto; margin-right: auto; }
        }
        .pc-head {
          font-family: var(--font-barlow);
          font-size: 10px;
          color: #FF6B35;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }
        .pc-head::before {
          content: '';
          width: 6px; height: 6px;
          background: #FF6B35;
          border-radius: 50%;
          box-shadow: 0 0 8px #FF6B35;
          margin-right: 8px;
        }
        .pc-warn {
          margin-top: 8px;
          padding: 8px;
          background: rgba(245,158,11,0.08);
          border-left: 2px solid #F59E0B;
          font-family: var(--font-barlow);
          font-size: 13px;
          color: #F59E0B;
        }

        .limits {
          margin: 0 18px 14px;
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.3);
          border-radius: 8px;
          padding: 12px 14px;
          max-width: 720px;
        }
        @media (min-width: 760px) {
          .limits { margin-left: auto; margin-right: auto; }
        }
        .lim-head {
          font-family: var(--font-barlow);
          font-size: 10px;
          color: #F59E0B;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .lim-row {
          font-size: 12px;
          color: rgba(255,255,255,0.75);
          line-height: 1.45;
          padding: 3px 0;
        }

        .res-section {
          padding: 0 18px;
          max-width: 720px;
          margin: 14px auto 0;
        }
        .res-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .res-title {
          font-family: var(--font-anton);
          font-size: 18px;
          letter-spacing: 2.5px;
        }
        .res-count {
          font-family: var(--font-roboto-mono);
          font-size: 12px;
          color: #FF6B35;
          font-weight: 700;
        }
        .res-empty {
          padding: 18px;
          text-align: center;
          color: rgba(255,255,255,0.55);
          font-family: var(--font-inter);
          font-size: 14px;
        }
        .res-row {
          display: grid;
          grid-template-columns: 90px 130px 1fr 80px;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-family: var(--font-barlow);
          font-size: 13px;
        }
        .r-date {
          font-family: var(--font-roboto-mono);
          font-size: 11px;
          color: rgba(255,255,255,0.55);
        }
        .r-match {
          font-family: var(--font-anton);
          font-size: 16px;
          letter-spacing: 1.5px;
        }
        .r-at { color: rgba(255,255,255,0.4); margin: 0 4px; }
        .r-stats {
          font-family: var(--font-roboto-mono);
          font-size: 12px;
          color: rgba(255,255,255,0.7);
        }
        .r-stats strong { color: #FF6B35; }
        .r-score {
          font-family: var(--font-roboto-mono);
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          text-align: right;
        }
        .res-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .btn-save {
          background: rgba(255,107,53,0.1);
          border: 1px solid #FF6B35;
          color: #FF6B35;
          padding: 10px 18px;
          border-radius: 6px;
          font-family: var(--font-anton);
          font-size: 13px;
          letter-spacing: 2px;
          cursor: pointer;
        }
        .btn-save:hover:not(:disabled) { background: rgba(255,107,53,0.2); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .saved-msg {
          margin-top: 10px;
          font-size: 12px;
          color: #10B981;
          font-family: var(--font-roboto-mono);
        }

        .examples {
          padding: 24px 18px 0;
          max-width: 720px;
          margin: 0 auto;
        }
        .ex-head {
          font-family: var(--font-barlow);
          font-size: 11px;
          letter-spacing: 2.5px;
          color: rgba(255,255,255,0.45);
          margin-bottom: 10px;
          text-transform: uppercase;
          font-weight: 700;
        }
        .ex-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          background: #1A1A1A;
          border: 1px solid rgba(255,255,255,0.08);
          color: #fff;
          padding: 12px 14px;
          border-radius: 6px;
          font-family: var(--font-barlow);
          font-size: 14px;
          text-align: left;
          margin-bottom: 6px;
          cursor: pointer;
        }
        .ex-row:hover { border-color: #FF6B35; }
        .ex-arrow { color: rgba(255,255,255,0.4); font-size: 18px; }

        .err {
          margin: 12px 18px;
          padding: 12px;
          background: rgba(239,68,68,0.1);
          border: 1px solid #EF4444;
          color: #EF4444;
          border-radius: 6px;
          font-size: 13px;
          max-width: 720px;
        }
      `}</style>
    </main>
  );
}

function ParsedLine({
  label,
  value,
  type,
}: {
  label: string;
  value: string;
  type: "player" | "stat" | "filter";
}) {
  return (
    <div className="pl">
      <span className="pl-k">{label}</span>
      <span className={`pl-v pl-${type}`}>{value}</span>
      <style jsx>{`
        .pl {
          display: flex;
          font-family: var(--font-barlow);
          font-size: 13px;
          padding: 4px 0;
          align-items: baseline;
          gap: 10px;
        }
        .pl-k {
          font-family: var(--font-roboto-mono);
          font-size: 10px;
          color: rgba(255,255,255,0.55);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          min-width: 80px;
          font-weight: 700;
        }
        .pl-v { font-weight: 700; }
        .pl-player { color: #10B981; }
        .pl-stat { color: #3B82F6; }
        .pl-filter { color: #FF6B35; }
      `}</style>
    </div>
  );
}
