/**
 * Web URLs used by native screens that consume server-rendered assets
 * (e.g., the OG-image Take Card) or open a web fallback.
 *
 * To point at your local dev server when iterating, set EXPO_PUBLIC_API_BASE
 * in basktball-mobile/.env  (e.g. EXPO_PUBLIC_API_BASE=http://192.168.1.152:3000)
 * and restart Expo. Same env var is used by lib/api/client.ts so REST + OG image
 * stay in sync.
 */
export const WEB_BASE =
  process.env.EXPO_PUBLIC_API_BASE?.replace(/\/$/, '') || 'https://www.basktball.com';

export type TakeCardSeed = {
  template?: string;
  theme?: string;
  tag?: string;
  num?: string | number;
  unit?: string;
  headline?: string;
  context?: string;
  meta?: string;
  handle?: string;
  avatar?: string;
  brand?: string;
};

/** URL to the generated 1024x1280 Take Card PNG for use in `<Image>`. */
export function takeCardImageUrl(seed: TakeCardSeed): string {
  const qs = new URLSearchParams();
  Object.entries(seed).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  return `${WEB_BASE}/api/og/card?${qs.toString()}`;
}

/** Public share URL with proper OG meta so unfurls work on X / IG / etc. */
export function takeCardShareUrl(seed: TakeCardSeed): string {
  const qs = new URLSearchParams();
  Object.entries(seed).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  return `${WEB_BASE}/share/take?${qs.toString()}`;
}
