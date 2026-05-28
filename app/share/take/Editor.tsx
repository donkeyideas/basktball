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
  avatarUrl: string;
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
  if (s.avatarUrl) qs.set("avatarUrl", s.avatarUrl);
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
  if (s.avatarUrl) qs.set("avatarUrl", s.avatarUrl);
  qs.set("brand", s.brand);
  return `${baseUrl}/share/take?${qs.toString()}`;
}

type Suggestion = {
  id: string;
  league: string;
  leagueLabel: string;
  template: Template;
  theme: Theme;
  tag: string;
  seed: {
    template?: string;
    theme?: string;
    tag?: string;
    headline?: string;
    context?: string;
    meta?: string;
    num?: string;
    unit?: string;
  };
};

export default function TakeCardEditor({
  initial,
  baseUrl,
  embedded = false,
}: {
  initial: CardState;
  baseUrl: string;
  embedded?: boolean;
}) {
  const [state, setState] = useState<CardState>(initial);
  const [textOpen, setTextOpen] = useState(false);
  const [tone, setTone] = useState<Tone>("analytical");
  const [caption, setCaption] = useState<string>("");
  const [captionLoading, setCaptionLoading] = useState(false);
  const [includeLink, setIncludeLink] = useState(true);
  const [copied, setCopied] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [postingToCourt, setPostingToCourt] = useState(false);
  const [postedToCourt, setPostedToCourt] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; msg: string } | null>(null);

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

  // Fetch today's suggestion deck (refreshed by server cron 3×/day from ESPN news).
  useEffect(() => {
    let cancelled = false;
    setSuggestionsLoading(true);
    fetch("/api/cards/suggestions")
      .then((r) => r.json())
      .then((d: { suggestions?: Suggestion[] }) => {
        if (cancelled || !d?.suggestions?.length) return;
        const seen = new Set<string>();
        setSuggestions(d.suggestions.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true))));
      })
      .catch(() => { /* suggestions optional */ })
      .finally(() => { if (!cancelled) setSuggestionsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const applySuggestion = (s: Suggestion) => {
    setState((prev) => ({
      ...prev,
      template: (s.seed.template as Template) || s.template || prev.template,
      theme: (s.seed.theme as Theme) || s.theme || prev.theme,
      tag: s.seed.tag || s.tag || prev.tag,
      headline: s.seed.headline ?? prev.headline,
      context: s.seed.context ?? prev.context,
      meta: s.seed.meta ?? prev.meta,
      num: s.seed.num ?? prev.num,
      unit: s.seed.unit ?? prev.unit,
    }));
  };

  // Publish card to Court + user profile feed. Sends just the card image (no
  // caption) so the take shows only the visual card, not duplicated text above.
  const postToCourt = async () => {
    if (postedToCourt || postingToCourt) return;
    setPostingToCourt(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/court/takes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "", tags: [], mediaUrls: [ogUrl] }),
      });
      if (res.status === 401) {
        setFeedback({ tone: "error", msg: "Sign in to post to The Court." });
      } else if (res.ok) {
        setPostedToCourt(true);
        setFeedback({ tone: "success", msg: "Posted to Court + your Profile." });
      } else {
        const d = await res.json().catch(() => ({}));
        setFeedback({ tone: "error", msg: d?.error || "Couldn't post. Try again." });
      }
    } catch {
      setFeedback({ tone: "error", msg: "Couldn't post. Try again." });
    } finally {
      setPostingToCourt(false);
    }
  };

  const onPostFacebook = () => {
    const fbCaption = caption.slice(0, 280);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(fbCaption)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onPostReddit = () => {
    const title = (caption || `${state.num} ${state.unit}`).slice(0, 300);
    const url = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onPostInstagram = () => {
    // Instagram has no public web post-URL API. Copy the caption+link to
    // clipboard and download the card so the user can paste into IG.
    onCopyLink();
    onDownload();
    setFeedback({ tone: "success", msg: "Card downloaded + caption copied. Paste into Instagram." });
  };

  const Wrapper = embedded ? "section" : "main";

  return (
    <div className="tc-page">
      {!embedded && (
        <header className="tc-topbar">
          <Link href="/" className="tc-back" aria-label="Home">‹</Link>
          <div className="tc-title">TAKE CARD</div>
          <button className="tc-save-pill" type="button" onClick={onDownload}>
            DOWNLOAD
          </button>
        </header>
      )}

      <Wrapper className="tc-main">
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

        {(suggestionsLoading || suggestions.length > 0) && (
          <section className="sugg-section">
            <div className="sugg-head">
              <span className="ctrl-label">TODAY&apos;S CARDS</span>
              <span className="sugg-sub">FROM ESPN · TAP TO LOAD</span>
            </div>
            {suggestionsLoading && suggestions.length === 0 ? (
              <div className="sugg-loading">Loading suggestions…</div>
            ) : (
              <div className="sugg-row">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`sugg-card sugg-${s.theme}`}
                    onClick={() => applySuggestion(s)}
                  >
                    <span className="sugg-league">{s.leagueLabel}</span>
                    <span className="sugg-headline">{s.seed.headline || s.tag}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

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
          <button
            type="button"
            className={`btn-post-court ${postedToCourt ? "posted" : ""}`}
            onClick={postToCourt}
            disabled={postedToCourt || postingToCourt}
          >
            {postingToCourt ? "POSTING…" : postedToCourt ? "POSTED TO COURT" : "POST TO COURT"}
          </button>

          <div className="social-row">
            <button type="button" className="social-btn social-x" onClick={onPostX} aria-label="Post on X">
              <span className="x-mark">X</span>
            </button>
            <button type="button" className="social-btn social-ig" onClick={onPostInstagram} aria-label="Share to Instagram">
              <InstagramIcon />
            </button>
            <button type="button" className="social-btn social-fb" onClick={onPostFacebook} aria-label="Share to Facebook">
              <FacebookIcon />
            </button>
            <button type="button" className="social-btn social-rd" onClick={onPostReddit} aria-label="Share to Reddit">
              <RedditIcon />
            </button>
          </div>

          <div className="action-row">
            <button type="button" className="btn-sec" onClick={onNativeShare}>SHARE…</button>
            <button type="button" className="btn-sec" onClick={onCopyLink}>{copied ? "COPIED" : "COPY LINK"}</button>
            <button type="button" className="btn-sec" onClick={onDownload}>SAVE PNG</button>
          </div>

          {feedback && (
            <div className={`fb-msg fb-${feedback.tone}`}>{feedback.msg}</div>
          )}
        </section>
      </Wrapper>

      <style jsx>{`
        .tc-page {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-archivo), system-ui, sans-serif;
          padding-bottom: 32px;
        }
        .tc-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          background: var(--bg-secondary);
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
          z-index: 5;
        }
        .tc-back {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-primary); text-decoration: none;
          font-size: 22px; line-height: 1;
        }
        .tc-title {
          font-family: var(--font-bebas);
          font-size: 22px;
          letter-spacing: 4px;
        }
        .tc-save-pill {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 14px;
          border-radius: 20px;
          font-family: var(--font-jbmono);
          font-size: 11px;
          letter-spacing: 1.5px;
          cursor: pointer;
        }
        .tc-main {
          max-width: 720px;
          margin: 0 auto;
          padding: 16px;
        }
        .tc-preview-wrap {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
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
          color: var(--text-muted);
        }
        .tc-canvas-label .tc-saved { color: #ff5e1a; }
        .tc-canvas {
          aspect-ratio: 4 / 5;
          background: var(--input-bg);
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
          color: var(--text-muted);
          background: var(--input-bg);
        }
        .tc-controls {
          background: var(--input-bg);
          border: 1px solid var(--border-color);
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
          color: var(--text-muted);
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
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          font-family: var(--font-archivo);
          font-weight: 600;
          font-size: 12px;
          color: var(--text-primary);
          cursor: pointer;
          white-space: nowrap;
        }
        .chip.active {
          background: #ff5e1a;
          border-color: #ff5e1a;
          color: #fff;
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
        .swatch.sw-light { background: #f5f1ea; border-color: var(--border-color); }
        .swatch.sw-dark { background: #0a0a0a; border-color: var(--border-color); }
        .swatch.sw-orange { background: #ff5e1a; }
        .swatch.active { border-color: #ff5e1a; box-shadow: 0 0 0 3px rgba(255,94,26,0.25); }
        .sw-lbl {
          position: absolute;
          bottom: -18px;
          left: 0; right: 0;
          text-align: center;
          font-family: var(--font-jbmono);
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 1px;
        }
        .edit-text-btn {
          align-self: flex-start;
          background: transparent;
          border: 1px dashed var(--border-color);
          color: var(--text-primary);
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
          background: var(--input-bg);
          border: 1px solid var(--border-color);
          border-radius: 10px;
        }
        .field-row { display: flex; gap: 8px; }
        .field-row > * { flex: 1; }
        .caption-box {
          background: var(--input-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px;
        }
        .caption-text {
          width: 100%;
          background: transparent;
          color: var(--text-primary);
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
          border: 1px solid var(--border-color);
          color: var(--text-muted);
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
          background: var(--input-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 14px;
          cursor: pointer;
        }
        .lt-l { font-size: 14px; color: var(--text-primary); font-weight: 600; }
        .lt-s { font-size: 11px; color: var(--text-muted); margin-top: 2px; font-family: var(--font-jbmono); letter-spacing: 0.5px; word-break: break-all; }
        .toggle {
          width: 44px; height: 24px;
          background: var(--border-color);
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
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .toggle.on .knob { transform: translateX(20px); }
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
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: 12px;
          font-family: var(--font-archivo);
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 1.5px;
          cursor: pointer;
        }
        /* Today's Cards (auto-populated suggestions) */
        .sugg-section { margin-bottom: 18px; }
        .sugg-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }
        .sugg-sub {
          font-family: var(--font-jbmono);
          font-size: 10px;
          letter-spacing: 1.5px;
          color: var(--text-muted);
        }
        .sugg-loading {
          font-family: var(--font-jbmono);
          font-size: 11px;
          color: var(--text-muted);
          padding: 24px;
          text-align: center;
          background: var(--bg-secondary);
          border-radius: 10px;
        }
        .sugg-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: thin;
          scrollbar-color: var(--border-color) transparent;
        }
        .sugg-row::-webkit-scrollbar { height: 6px; background: transparent; }
        .sugg-row::-webkit-scrollbar-track { background: transparent; border-radius: 3px; }
        .sugg-row::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }
        .sugg-row::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
        .sugg-row::-webkit-scrollbar-corner { background: transparent; }
        .sugg-card {
          flex: 0 0 200px;
          min-height: 120px;
          padding: 12px;
          border-radius: 10px;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: none;
        }
        .sugg-light { background: #F5F1EA; color: #0a0a0a; }
        .sugg-dark { background: #0A0A0A; border: 1px solid rgba(255,255,255,0.1); color: #fff; }
        .sugg-orange { background: #FF5E1A; color: #0a0a0a; }
        .sugg-league {
          font-family: var(--font-jbmono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          opacity: 0.85;
        }
        .sugg-headline {
          font-family: var(--font-bebas, var(--font-anton));
          font-size: 15px;
          letter-spacing: 0.5px;
          line-height: 1.15;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* POST TO COURT — primary publish button */
        .btn-post-court {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: #FF5E1A;
          color: #fff;
          border: none;
          border-radius: 14px;
          font-family: var(--font-archivo);
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 1.5px;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(255,94,26,0.35);
          transition: background 0.15s ease;
        }
        .btn-post-court:hover:not(:disabled) { background: #ff7340; }
        .btn-post-court:disabled { cursor: not-allowed; opacity: 0.85; }
        .btn-post-court.posted {
          background: #1A1A1A;
          color: #10B981;
          box-shadow: none;
        }

        /* Social row — X, Instagram, Facebook, Reddit */
        .social-row { display: flex; gap: 8px; }
        .social-btn {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: filter 0.15s ease;
        }
        .social-btn:hover { filter: brightness(1.15); }
        .social-x { background: #0a0a0a; border: 1px solid #2a2a2a; }
        .social-ig { background: linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4); }
        .social-fb { background: #1877F2; }
        .social-rd { background: #FF4500; }

        /* Feedback message */
        .fb-msg {
          margin-top: 4px;
          padding: 10px 12px;
          border-radius: 8px;
          font-family: var(--font-archivo);
          font-size: 13px;
          text-align: center;
        }
        .fb-success { background: rgba(16,185,129,0.12); color: #10B981; border: 1px solid rgba(16,185,129,0.3); }
        .fb-error { background: rgba(239,68,68,0.1); color: #EF4444; border: 1px solid rgba(239,68,68,0.3); }

        @media (min-width: 900px) {
          .tc-main {
            max-width: 1100px;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            grid-template-areas:
              "preview suggestions"
              "preview controls"
              "preview actions";
            gap: 20px;
            align-items: start;
          }
          .tc-preview-wrap { grid-area: preview; margin-bottom: 0; position: sticky; top: 80px; }
          .sugg-section { grid-area: suggestions; margin-bottom: 0; }
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
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .fld-i {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
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

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function RedditIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}
