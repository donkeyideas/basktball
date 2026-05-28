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

const ORANGE = "#FF6B35";

const VARIANT_STYLES: Record<Variant, { style: React.CSSProperties; iconSize: number; labelSize: number }> = {
  default: {
    style: {
      background: ORANGE,
      color: "#fff",
      padding: "7px 12px",
      borderRadius: "6px",
      fontWeight: 700,
    },
    iconSize: 14,
    labelSize: 12,
  },
  ghost: {
    style: {
      background: "rgba(255,107,53,0.1)",
      color: ORANGE,
      border: `1px solid ${ORANGE}`,
      padding: "10px 18px",
      borderRadius: "6px",
      fontWeight: 700,
      letterSpacing: "2px",
    },
    iconSize: 16,
    labelSize: 13,
  },
  compact: {
    style: {
      background: "rgba(255,107,53,0.15)",
      color: ORANGE,
      padding: "4px 8px",
      borderRadius: "4px",
    },
    iconSize: 11,
    labelSize: 10,
  },
  block: {
    style: {
      background: ORANGE,
      color: "#fff",
      padding: "14px 18px",
      borderRadius: "8px",
      width: "100%",
      justifyContent: "center",
      boxShadow: "0 6px 16px rgba(255,107,53,0.3)",
      letterSpacing: "2px",
    },
    iconSize: 18,
    labelSize: 14,
  },
};

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
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <Link
      href={href}
      className={`tcb tcb-${variant} ${className || ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "var(--font-anton), var(--font-bebas), sans-serif",
        letterSpacing: "1.5px",
        textDecoration: "none",
        cursor: "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        lineHeight: 1,
        ...variantStyle.style,
      }}
    >
      <svg
        className="tcb-ico"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ width: variantStyle.iconSize, height: variantStyle.iconSize, flexShrink: 0 }}
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span className="tcb-lbl" style={{ fontSize: variantStyle.labelSize }}>{label}</span>
    </Link>
  );
}
