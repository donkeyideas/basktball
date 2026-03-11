export { cn } from "./cn";

/**
 * Format a number with commas (e.g., 1000 -> 1,000)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format a percentage (e.g., 0.456 -> 45.6%)
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a stat value (e.g., 25.4)
 */
export function formatStat(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * Format game time (e.g., "Q4 3:42")
 */
export function formatGameTime(quarter: string | null, clock: string | null): string {
  if (!quarter) return "";
  if (!clock) return quarter;
  return `${quarter} ${clock}`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Calculate field goal percentage
 */
export function calcFgPct(made: number, attempted: number): number {
  if (attempted === 0) return 0;
  return made / attempted;
}

/**
 * Calculate true shooting percentage
 */
export function calcTsPct(points: number, fga: number, fta: number): number {
  const tsa = fga + 0.44 * fta;
  if (tsa === 0) return 0;
  return points / (2 * tsa);
}

/**
 * Calculate effective field goal percentage
 */
export function calcEfgPct(fgm: number, tpm: number, fga: number): number {
  if (fga === 0) return 0;
  return (fgm + 0.5 * tpm) / fga;
}

/**
 * Delay utility for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}
