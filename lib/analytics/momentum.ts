// Momentum Calculator
// Derives momentum from quarter scoring trends, shooting efficiency,
// and turnover differential. Returns a -10 to +10 score (home perspective).

export interface MomentumInput {
  homeLinescores: number[];
  awayLinescores: number[];
  homeTeamStats: Record<string, string>;
  awayTeamStats: Record<string, string>;
  period: number;
  gameStatus: "scheduled" | "live" | "final";
}

export interface MomentumResult {
  score: number;
  label: string;
  factors: string[];
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function parsePct(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace("%", "").replace(".", "");
  const num = parseFloat(val.replace("%", ""));
  if (isNaN(num)) return 0;
  // ESPN returns ".500" or "50.0" — normalize to 0-100
  if (val.startsWith(".")) return num * 100;
  return num;
}

function getLabel(score: number): string {
  if (score > 6) return "Strong Home Momentum";
  if (score > 3) return "Home Momentum";
  if (score > 1) return "Slight Home Edge";
  if (score >= -1) return "Even";
  if (score >= -3) return "Slight Away Edge";
  if (score >= -6) return "Away Momentum";
  return "Strong Away Momentum";
}

export function calculateMomentum(input: MomentumInput): MomentumResult {
  const { homeLinescores, awayLinescores, homeTeamStats, awayTeamStats, period, gameStatus } = input;

  if (gameStatus === "scheduled" || homeLinescores.length === 0) {
    return { score: 0, label: "Even", factors: [] };
  }

  let totalScore = 0;
  const factors: string[] = [];

  // 1. Quarter trend (40% weight) — last quarter diff vs prior average diff
  if (homeLinescores.length >= 2) {
    const lastIdx = homeLinescores.length - 1;
    const lastQDiff = (homeLinescores[lastIdx] || 0) - (awayLinescores[lastIdx] || 0);

    let priorDiffSum = 0;
    for (let i = 0; i < lastIdx; i++) {
      priorDiffSum += (homeLinescores[i] || 0) - (awayLinescores[i] || 0);
    }
    const priorAvgDiff = priorDiffSum / lastIdx;
    const trendSwing = (lastQDiff - priorAvgDiff) * 0.5;
    const trendScore = clamp(trendSwing, -4, 4);
    totalScore += trendScore;

    if (trendScore > 1) {
      factors.push(`Outscoring opponent ${homeLinescores[lastIdx]}-${awayLinescores[lastIdx]} in Q${lastIdx + 1}`);
    } else if (trendScore < -1) {
      factors.push(`Being outscored ${awayLinescores[lastIdx]}-${homeLinescores[lastIdx]} in Q${lastIdx + 1}`);
    }
  } else if (homeLinescores.length === 1) {
    const diff = (homeLinescores[0] || 0) - (awayLinescores[0] || 0);
    const trendScore = clamp(diff * 0.3, -4, 4);
    totalScore += trendScore;
    if (Math.abs(diff) >= 5) {
      const leader = diff > 0 ? "Home" : "Away";
      factors.push(`${leader} team won Q1 by ${Math.abs(diff)}`);
    }
  }

  // 2. Shooting efficiency (30% weight) — FG% and 3PT% vs league averages
  const NBA_AVG_FG = 47;
  const NBA_AVG_3PT = 36;

  const homeFg = parsePct(homeTeamStats["fieldGoalPct"]);
  const awayFg = parsePct(awayTeamStats["fieldGoalPct"]);
  const home3pt = parsePct(homeTeamStats["threePointFieldGoalPct"]);
  const away3pt = parsePct(awayTeamStats["threePointFieldGoalPct"]);

  const homeFgEdge = (homeFg - NBA_AVG_FG) - (awayFg - NBA_AVG_FG);
  const home3ptEdge = (home3pt - NBA_AVG_3PT) - (away3pt - NBA_AVG_3PT);

  const shootingScore = clamp((homeFgEdge * 0.15 + home3ptEdge * 0.1), -3, 3);
  totalScore += shootingScore;

  if (homeFg > 50 && homeFg > awayFg + 5) {
    factors.push(`Shooting ${homeFg.toFixed(1)}% FG vs opponent's ${awayFg.toFixed(1)}%`);
  } else if (awayFg > 50 && awayFg > homeFg + 5) {
    factors.push(`Opponent shooting ${awayFg.toFixed(1)}% FG vs ${homeFg.toFixed(1)}%`);
  }

  if (home3pt > 40) {
    factors.push(`Hot from three: ${home3pt.toFixed(1)}%`);
  } else if (away3pt > 40) {
    factors.push(`Opponent hot from three: ${away3pt.toFixed(1)}%`);
  }

  // 3. Turnover differential (20% weight)
  const homeTo = parseInt(homeTeamStats["turnovers"] || "0");
  const awayTo = parseInt(awayTeamStats["turnovers"] || "0");
  const toDiff = awayTo - homeTo; // positive = home has fewer TOs
  const toScore = clamp(toDiff * 0.5, -2, 2);
  totalScore += toScore;

  if (Math.abs(toDiff) >= 4) {
    if (toDiff > 0) {
      factors.push(`Forcing ${awayTo} turnovers vs committing ${homeTo}`);
    } else {
      factors.push(`Committing ${homeTo} turnovers vs opponent's ${awayTo}`);
    }
  }

  // 4. Scoring pace (10% weight) — current quarter vs average pace
  if (homeLinescores.length >= 2) {
    const lastIdx = homeLinescores.length - 1;
    const currentQTotal = (homeLinescores[lastIdx] || 0) + (awayLinescores[lastIdx] || 0);
    let priorAvg = 0;
    for (let i = 0; i < lastIdx; i++) {
      priorAvg += (homeLinescores[i] || 0) + (awayLinescores[i] || 0);
    }
    priorAvg /= lastIdx;
    const paceScore = clamp((currentQTotal - priorAvg) * 0.1, -1, 1);
    totalScore += paceScore;
  }

  // Clamp total and round
  totalScore = clamp(Math.round(totalScore * 10) / 10, -10, 10);

  // Limit to 3 most relevant factors
  const topFactors = factors.slice(0, 3);

  return {
    score: totalScore,
    label: getLabel(totalScore),
    factors: topFactors,
  };
}
