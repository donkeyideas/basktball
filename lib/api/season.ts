// Season Year Utilities
// Automatically determines the current NBA season year for each API.
//
// NBA seasons span two calendar years (e.g. 2025-26 season: Oct 2025 – Jun 2026).
// Different APIs use different conventions:
//   ESPN Core API → end year   (2025-26 = 2026)
//   BallDontLie   → start year (2025-26 = 2025)
//
// The cutoff is October — that's when the new season tips off.

/**
 * ESPN Core API season year (end year of the season).
 * Oct–Dec → year + 1  (new season just started)
 * Jan–Sep → year      (season started previous October)
 */
export function getEspnSeason(date: Date = new Date()): number {
  const month = date.getMonth(); // 0-indexed: 0=Jan, 9=Oct
  const year = date.getFullYear();
  return month >= 9 ? year + 1 : year;
}

/**
 * BallDontLie API season year (start year of the season).
 * Oct–Dec → year      (new season just started)
 * Jan–Sep → year - 1  (season started previous October)
 */
export function getBdlSeason(date: Date = new Date()): number {
  const month = date.getMonth();
  const year = date.getFullYear();
  return month >= 9 ? year : year - 1;
}
