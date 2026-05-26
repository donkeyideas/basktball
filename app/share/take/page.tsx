import type { Metadata } from "next";
import TakeCardEditor, { type CardState } from "./Editor";

// X / Twitter card scraping does NOT follow 308 redirects from basktball.com
// to www.basktball.com — the OG image URL must point at the live host directly.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.basktball.com";

function parseState(searchParams: Record<string, string | string[] | undefined>): CardState {
  const get = (k: string, def = "") => {
    const v = searchParams[k];
    return (Array.isArray(v) ? v[0] : v) ?? def;
  };

  return {
    theme: (get("theme", "light") as CardState["theme"]) || "light",
    template: (get("template", "stat-line") as CardState["template"]) || "stat-line",
    tag: get("tag", "STAT LINE"),
    num: get("num", "19"),
    unit: get("unit", "REBOUNDS"),
    headline: get("headline", ""),
    context: get(
      "context",
      "Nikola Jokić grabbed 19 boards in Denver's win over the Lakers — his 15th career triple-double vs LAL, the most by any player against a single franchise.",
    ),
    meta: get("meta", "DEN 121  LAL 108  JAN 14, 2026"),
    handle: get("handle", "basktball"),
    avatar: get("avatar", "BB"),
    brand: get("brand", "BASKTBALL.COM"),
    sourceUrl: get("source", ""),
  };
}

function toOgUrl(s: CardState): string {
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
  return `${BASE_URL}/api/og/card?${qs.toString()}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const state = parseState(params);
  const ogUrl = toOgUrl(state);

  const title = state.headline || `${state.num} ${state.unit}` || "Basktball Take";
  const description = state.context.slice(0, 200);

  return {
    title: `${title} | BASKTBALL`,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1024, height: 1280, alt: title }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initial = parseState(params);
  return <TakeCardEditor initial={initial} baseUrl={BASE_URL} />;
}
