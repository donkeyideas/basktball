"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "orange";
export type Template = "stat-line" | "comparison" | "hot-take" | "quote" | "ranking";
export type Tone = "analytical" | "hot-take" | "short";

export type CardState = {
  theme: Theme;
  template: Template;
  tag: string;
  num: string;
  unit: string;
  headline: string;
  context: string;
  meta: string;
  handle: string;
  avatar: string;
  brand: string;
  sourceUrl: string;
};

const TEMPLATES: { id: Template; label: string; tag: string }[] = [
  { id: "stat-line", label: "Stat Line", tag: "STAT LINE" },
  { id: "comparison", label: "Comparison", tag: "COMPARISON" },
  { id: "hot-take", label: "Hot Take", tag: "HOT TAKE" },
  { id: "quote", label: "Quote", tag: "QUOTE" },
  { id: "ranking", label: "Ranking", tag: "RANKING" },
];

const TONES: { id: Tone; label: string }[] = [
  { id: "analytical", label: "ANALYTICAL" },
  { id: "hot-take", label: "HOT TAKE" },
  { id: "short", label: "SHORT" },
];

function buildOgUrl(s: CardState, baseUrl: string) {
  const qs = new URLSearchParams();
  qs.set("theme", s.theme);
  qs.set("template", s.template);
  qs.set("tag", s.tag);
  if (s.num) qs.set("num", s.num);
  if (s.unit) qs.set("unit", s.unit);
  if (s.headline) qs.set("headline", s.headline);
  if (s.context) qs.set("context", s.context);
  if (s.meta) qs.set("meta", s.meta);
  qs.set("handle", s.handle);
  qs.set("avatar", s.avatar);
  qs.set("brand", s.brand);
  return `${baseUrl}/api/og/card?${qs.toString()}`;
}

function buildShareUrl(s: CardState, baseUrl: string) {
  const qs = new URLSearchParams();
  qs.set("theme", s.theme);
  qs.set("template", s.template);
  qs.set("tag", s.tag);
  if (s.num) qs.set("num", s.num);
  if (s.unit) qs.set("unit", s.unit);
  if (s.headline) qs.set("headline", s.headline);
  if (s.context) qs.set("context", s.context);
  if (s.meta) qs.set("meta", s.meta);
  qs.set("handle", s.handle);
  qs.set("avatar", s.avatar);
  qs.set("brand", s.brand);
  return `${baseUrl}/share/take?${qs.toString()}`;
}

export default function TakeCardEditor({
  initial,
  baseUrl,
}: {
  initial: CardState;
  baseUrl: string;
}) {
  const [state, setState] = useState<CardState>(initial);
  const [textOpen, setTextOpen] = useState(false);
  const [tone, setTone] = useState<Tone>("analytical");
  const [caption, setCaption] = useState<string>("");
  const [captionLoading, setCaptionLoading] = useState(false);
  const [includeLink, setIncludeLink] = useState(true);
  const [copied, setCopied] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const ogUrl = useMemo(() => buildOgUrl(state, baseUrl), [state, baseUrl]);
  const shareUrl = useMemo(() => buildShareUrl(state, baseUrl), [state, baseUrl]);

  useEffect(() => {
    setImgLoading(true);
  }, [ogUrl]);

  // Generate caption when tone changes or initial mount
  useEffect(() => {
    let cancelled = false;
    setCaptionLoading(true);

    fetch("/api/card/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tone,
        template: state.template,
        num: state.num,
        unit: state.unit,
        headline: state.headline,
        context: state.context,
        meta: state.meta,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setCaption(d.caption || fallbackCaption(state, tone));
      })
      .catch(() => {
        if (!cancelled) setCaption(fallbackCaption(state, tone));
      })
      .finally(() => {
        if (!cancelled) setCaptionLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // intentionally exclude `state` to avoid refetching on every keystroke; refresh manually via tone change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tone, state.template]);

  const setField = <K extends keyof CardState>(k: K, v: CardState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const onSelectTemplate = (id: Template) => {
    const t = TEMPLATES.find((x) => x.id === id)!;
    setState((s) => ({ ...s, template: id, tag: t.tag }));
  };

  const tweetText = useMemo(() => {
    const parts = [caption];
    if (includeLink) parts.push(shareUrl);
    return parts.filter(Boolean).join(" ");
  }, [caption, includeLink, shareUrl]);

  const onPostX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(includeLink ? shareUrl : caption || shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const onDownload = () => {
    const a = document.createElement("a");
    a.href = ogUrl;
    a.download = `basktball-${state.template}-${Date.now()}.png`;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  };

  const onNativeShare = async () => {
    if (typeof navigator === "undefined" || !("share" in navigator)) {
      onCopyLink();
      return;
    }
    try {
      await navigator.share({
        title: state.headline || `${state.num} ${state.unit}`,
        text: caption,
        url: shareUrl,
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="tc-page">
      <header className="tc-topbar">
        <Link href="/" className="tc-back" aria-label="Home">‹</Link>
        <div className="tc-title">TAKE CARD</div>
        <button className="tc-save-pill" type="button" onClick={onDownload}>
          DOWNLOAD
        </button>
      </header>

      <main className="tc-main">
        <section className="tc-preview-wrap">
          <div className="tc-canvas-label">
            <span>PREVIEW · 4:5 FOR X</span>
            <span className="tc-saved">● AUTO-SAVED</span>
          </div>
          <div className="tc-canvas">
            {imgLoading && <div className="tc-skeleton">Generating card…</div>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogUrl}
              alt="Take card preview"
              className="tc-img"
              onLoad={() => setImgLoading(false)}
              onError={() => setImgLoading(false)}
            />
          </div>
        </section>

        <section className="tc-controls">
          <div className="ctrl-group">
            <div className="ctrl-label">TEMPLATE</div>
            <div className="chips">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`chip ${state.template === t.id ? "active" : ""}`}
                  onClick={() => onSelectTemplate(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ctrl-group">
            <div className="ctrl-label">THEME</div>
            <div className="swatches">
              {(["light", "dark", "orange"] as Theme[]).map((th) => (
                <button
                  key={th}
                  type="button"
                  aria-label={th}
                  className={`swatch sw-${th} ${state.theme === th ? "active" : ""}`}
                  onClick={() => setField("theme", th)}
                >
                  <span className="sw-lbl">{th === "light" ? "LIGHT" : th === "dark" ? "DARK" : "BRAND"}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="edit-text-btn"
            onClick={() => setTextOpen((v) => !v)}
            aria-expanded={textOpen ? "true" : "false"}
          >
            {textOpen ? "HIDE TEXT FIELDS −" : "EDIT TEXT FIELDS +"}
          </button>

          {textOpen && (
            <div className="text-fields">
              {state.template === "stat-line" && (
                <>
                  <Field label="Big Number" value={state.num} onChange={(v) => setField("num", v)} />
                  <Field label="Unit (e.g. REBOUNDS)" value={state.unit} onChange={(v) => setField("unit", v)} />
                </>
              )}
              {(state.template === "hot-take" || state.template === "quote") && (
                <Field label="Headline" value={state.headline} onChange={(v) => setField("headline", v)} multiline />
              )}
              {state.template === "comparison" && (
                <Field
                  label="Left | Right (e.g. JOKIĆ | EMBIID)"
                  value={state.headline}
                  onChange={(v) => setField("headline", v)}
                />
              )}
              {state.template === "ranking" && (
                <Field
                  label="Items separated by | (max 5)"
                  value={state.headline}
                  onChange={(v) => setField("headline", v)}
                  multiline
                />
              )}
              <Field label="Context (small paragraph)" value={state.context} onChange={(v) => setField("context", v)} multiline />
              <Field label="Meta line (date, score, source)" value={state.meta} onChange={(v) => setField("meta", v)} />
              <div className="field-row">
                <Field label="Your handle" value={state.handle} onChange={(v) => setField("handle", v.replace(/^@/, ""))} />
                <Field label="Avatar (2 letters)" value={state.avatar} onChange={(v) => setField("avatar", v.toUpperCase().slice(0, 2))} />
              </div>
            </div>
          )}

          <div className="ctrl-group">
            <div className="ctrl-label">CAPTION · AI-DRAFTED</div>
            <div className="caption-box">
              <textarea
                className="caption-text"
                value={captionLoading ? "Generating…" : caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
              />
              <div className="tone-row">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`tone-chip ${tone === t.id ? "active" : ""}`}
                    onClick={() => setTone(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="link-toggle">
            <div>
              <div className="lt-l">Auto-include link back to app</div>
              <div className="lt-s">{shareUrl.replace(/^https?:\/\//, "")}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={includeLink}
              aria-label="Include link back to app"
              className={`toggle ${includeLink ? "on" : "off"}`}
              onClick={() => setIncludeLink((v) => !v)}
            >
              <span className="knob" />
            </button>
          </label>
        </section>

        <section className="tc-actions">
          <button type="button" className="btn-post-x" onClick={onPostX}>
            <span className="x-mark">X</span>
            <span>POST ON X</span>
          </button>
          <div className="action-row">
            <button type="button" className="btn-sec" onClick={onNativeShare}>SHARE…</button>
            <button type="button" className="btn-sec" onClick={onCopyLink}>{copied ? "COPIED" : "COPY LINK"}</button>
            <button type="button" className="btn-sec" onClick={onDownload}>SAVE PNG</button>
          </div>
        </section>
      </main>

      <style jsx>{`
        :global(body) { background: #161616; }
        .tc-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 20% 10%, rgba(255, 94, 26, 0.08), transparent 50%),
            radial-gradient(circle at 80% 90%, rgba(255, 94, 26, 0.05), transparent 50%),
            #161616;
          color: #fff;
          font-family: var(--font-archivo), system-ui, sans-serif;
          padding-bottom: 32px;
        }
        .tc-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid #1a1a1a;
          position: sticky;
          top: 0;
          background: rgba(10,10,10,0.95);
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
          z-index: 5;
        }
        .tc-back {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: #1a1a1a;
          display: flex; align-items: center; justify-content: center;
          color: #fff; text-decoration: none;
          font-size: 22px; line-height: 1;
        }
        .tc-title {
          font-family: var(--font-bebas);
          font-size: 22px;
          letter-spacing: 4px;
        }
        .tc-save-pill {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          color: #fff;
          padding: 8px 14px;
          border-radius: 20px;
          font-family: var(--font-jbmono);
          font-size: 11px;
          letter-spacing: 1.5px;
          cursor: pointer;
        }
        .tc-main {
          max-width: 480px;
          margin: 0 auto;
          padding: 16px;
        }
        .tc-preview-wrap {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 18px;
        }
        .tc-canvas-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-family: var(--font-jbmono);
          font-size: 11px;
          letter-spacing: 2.5px;
          color: #8a8a8a;
        }
        .tc-canvas-label .tc-saved { color: #ff5e1a; }
        .tc-canvas {
          aspect-ratio: 4 / 5;
          background: #050505;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tc-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .tc-skeleton {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-jbmono);
          font-size: 12px;
          letter-spacing: 2px;
          color: #8a8a8a;
          background: linear-gradient(135deg, #0d0d0d, #161616);
        }
        .tc-controls {
          background: rgba(255,255,255,0.02);
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 14px;
        }
        .ctrl-group { display: flex; flex-direction: column; gap: 8px; }
        .ctrl-label {
          font-family: var(--font-jbmono);
          font-size: 11px;
          letter-spacing: 2.5px;
          color: #8a8a8a;
        }
        .chips {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .chips::-webkit-scrollbar { display: none; }
        .chip {
          flex-shrink: 0;
          padding: 8px 14px;
          border-radius: 20px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          font-family: var(--font-archivo);
          font-weight: 600;
          font-size: 12px;
          color: #c4c4c4;
          cursor: pointer;
          white-space: nowrap;
        }
        .chip.active {
          background: #ff5e1a;
          border-color: #ff5e1a;
          color: #0a0a0a;
        }
        .swatches { display: flex; gap: 14px; }
        .swatch {
          width: 56px; height: 56px;
          border-radius: 12px;
          border: 2px solid transparent;
          cursor: pointer;
          position: relative;
          padding: 0;
        }
        .swatch.sw-light { background: #f5f1ea; }
        .swatch.sw-dark { background: #0a0a0a; border-color: #333; }
        .swatch.sw-orange { background: #ff5e1a; }
        .swatch.active { border-color: #ff5e1a; box-shadow: 0 0 0 3px rgba(255,94,26,0.25); }
        .sw-lbl {
          position: absolute;
          bottom: -18px;
          left: 0; right: 0;
          text-align: center;
          font-family: var(--font-jbmono);
          font-size: 9px;
          color: #8a8a8a;
          letter-spacing: 1px;
        }
        .edit-text-btn {
          align-self: flex-start;
          background: transparent;
          border: 1px dashed #2a2a2a;
          color: #c4c4c4;
          font-family: var(--font-archivo);
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 1.5px;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 6px;
        }
        .text-fields {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px;
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 10px;
        }
        .field-row { display: flex; gap: 8px; }
        .field-row > * { flex: 1; }
        .caption-box {
          background: #111;
          border: 1px solid #252525;
          border-radius: 12px;
          padding: 12px;
        }
        .caption-text {
          width: 100%;
          background: transparent;
          color: #fff;
          font-family: var(--font-archivo);
          font-size: 14px;
          line-height: 1.45;
          border: none;
          outline: none;
          resize: vertical;
          min-height: 64px;
        }
        .tone-row {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .tone-chip {
          background: transparent;
          border: 1px solid #333;
          color: #8a8a8a;
          padding: 6px 11px;
          border-radius: 6px;
          font-family: var(--font-jbmono);
          font-size: 10px;
          letter-spacing: 1px;
          cursor: pointer;
        }
        .tone-chip.active { color: #ff5e1a; border-color: #ff5e1a; }
        .link-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #111;
          border: 1px solid #252525;
          border-radius: 12px;
          padding: 12px 14px;
          cursor: pointer;
        }
        .lt-l { font-size: 14px; color: #fff; font-weight: 600; }
        .lt-s { font-size: 11px; color: #8a8a8a; margin-top: 2px; font-family: var(--font-jbmono); letter-spacing: 0.5px; word-break: break-all; }
        .toggle {
          width: 44px; height: 24px;
          background: #2a2a2a;
          border-radius: 14px;
          position: relative;
          flex-shrink: 0;
          transition: background 0.15s;
          margin-left: 12px;
        }
        .toggle.on { background: #ff5e1a; }
        .toggle .knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px; height: 20px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.15s;
        }
        .toggle.on .knob { transform: translateX(20px); background: #0a0a0a; }
        .tc-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .btn-post-x {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: #fff;
          color: #000;
          border: none;
          border-radius: 14px;
          font-family: var(--font-archivo);
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 2px;
          cursor: pointer;
          text-transform: uppercase;
        }
        .x-mark {
          font-family: var(--font-bebas);
          background: #000;
          color: #fff;
          width: 26px; height: 26px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .action-row { display: flex; gap: 8px; }
        .btn-sec {
          flex: 1;
          padding: 12px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          color: #fff;
          border-radius: 12px;
          font-family: var(--font-archivo);
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 1.5px;
          cursor: pointer;
        }
        @media (min-width: 900px) {
          .tc-main {
            max-width: 1100px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            grid-template-areas:
              "preview controls"
              "preview actions";
            gap: 20px;
            align-items: start;
          }
          .tc-preview-wrap { grid-area: preview; margin-bottom: 0; position: sticky; top: 80px; }
          .tc-controls { grid-area: controls; margin-bottom: 0; }
          .tc-actions { grid-area: actions; }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="fld">
      <span className="fld-lbl">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="fld-i" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="fld-i" />
      )}
      <style jsx>{`
        .fld { display: flex; flex-direction: column; gap: 4px; }
        .fld-lbl {
          font-family: var(--font-jbmono);
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #8a8a8a;
          text-transform: uppercase;
        }
        .fld-i {
          background: #0a0a0a;
          border: 1px solid #2a2a2a;
          color: #fff;
          font-family: var(--font-archivo);
          font-size: 13px;
          padding: 8px 10px;
          border-radius: 6px;
          outline: none;
          resize: vertical;
        }
        .fld-i:focus { border-color: #ff5e1a; }
      `}</style>
    </label>
  );
}

function fallbackCaption(s: CardState, tone: Tone): string {
  const base =
    s.context ||
    `${s.num ? s.num + " " + s.unit + " — " : ""}${s.headline || ""}`.trim() ||
    "A wild stat from basktball.";
  if (tone === "short") return base.split(".")[0].slice(0, 120);
  if (tone === "hot-take") return `Hot take: ${base}`;
  return base;
}
