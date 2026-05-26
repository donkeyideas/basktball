"use client";

import Link from "next/link";
import { useMemo } from "react";

export type TakeCardSeed = {
  template?: "stat-line" | "comparison" | "hot-take" | "quote" | "ranking";
  theme?: "light" | "dark" | "orange";
  tag?: string;
  num?: string | number;
  unit?: string;
  headline?: string;
  context?: string;
  meta?: string;
  handle?: string;
  avatar?: string;
  brand?: string;
  source?: string;
};

type Variant = "default" | "ghost" | "compact" | "block";

function buildHref(seed: TakeCardSeed) {
  const qs = new URLSearchParams();
  if (seed.template) qs.set("template", seed.template);
  if (seed.theme) qs.set("theme", seed.theme);
  if (seed.tag) qs.set("tag", seed.tag);
  if (seed.num !== undefined && seed.num !== "") qs.set("num", String(seed.num));
  if (seed.unit) qs.set("unit", seed.unit);
  if (seed.headline) qs.set("headline", seed.headline);
  if (seed.context) qs.set("context", seed.context);
  if (seed.meta) qs.set("meta", seed.meta);
  if (seed.handle) qs.set("handle", seed.handle);
  if (seed.avatar) qs.set("avatar", seed.avatar);
  if (seed.brand) qs.set("brand", seed.brand);
  if (seed.source) qs.set("source", seed.source);
  return `/share/take?${qs.toString()}`;
}

export default function TakeCardButton({
  seed,
  variant = "default",
  label = "CARD",
  className,
}: {
  seed: TakeCardSeed;
  variant?: Variant;
  label?: string;
  className?: string;
}) {
  const href = useMemo(() => buildHref(seed), [seed]);

  return (
    <Link href={href} className={`tcb tcb-${variant} ${className || ""}`}>
      <svg
        className="tcb-ico"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span className="tcb-lbl">{label}</span>
      <style jsx>{`
        .tcb {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-anton), var(--font-bebas), sans-serif;
          letter-spacing: 1.5px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          line-height: 1;
        }
        .tcb-ico { width: 14px; height: 14px; flex-shrink: 0; }
        .tcb-lbl { font-size: 12px; }

        .tcb-default {
          background: var(--orange, #FF6B35);
          color: #fff;
          padding: 7px 12px;
          border-radius: 6px;
          font-weight: 700;
        }
        .tcb-default:hover { background: #ff8c5a; }

        .tcb-ghost {
          background: transparent;
          color: var(--orange, #FF6B35);
          border: 1px solid var(--orange, #FF6B35);
          padding: 6px 10px;
          border-radius: 4px;
        }
        .tcb-ghost:hover { background: rgba(255,107,53,0.1); }

        .tcb-compact {
          background: rgba(255,107,53,0.15);
          color: var(--orange, #FF6B35);
          padding: 4px 8px;
          border-radius: 4px;
        }
        .tcb-compact .tcb-lbl { font-size: 10px; }
        .tcb-compact .tcb-ico { width: 11px; height: 11px; }
        .tcb-compact:hover { background: rgba(255,107,53,0.25); }

        .tcb-block {
          background: var(--orange, #FF6B35);
          color: #fff;
          padding: 14px 18px;
          border-radius: 8px;
          font-size: 14px;
          letter-spacing: 2px;
          width: 100%;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(255,107,53,0.3);
        }
        .tcb-block .tcb-ico { width: 18px; height: 18px; }
        .tcb-block .tcb-lbl { font-size: 14px; }
        .tcb-block:hover { background: #ff8c5a; }
      `}</style>
    </Link>
  );
}
