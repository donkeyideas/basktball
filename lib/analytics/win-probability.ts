// Win Probability Engine
// Calculates home team win probability using score differential,
// time remaining, and team strength (W-L records).

export interface WinProbabilityInput {
  homeScore: number;
  awayScore: number;
  period: number;
  clock: string;
  gameStatus: "scheduled" | "live" | "final";
  homeRecord?: string;
  awayRecord?: string;
  homeWinner?: boolean;
}

export interface WinProbabilityResult {
  home: number; // 0-100
  away: number; // 0-100
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function parseRecord(record: string): { wins: number; losses: number } {
  const parts = record.split("-");
  return {
    wins: parseInt(parts[0]) || 0,
    losses: parseInt(parts[1]) || 0,
  };
}

function parseClockToSeconds(clock: string): number {
  if (!clock || clock === "0.0" || clock === "0:00") return 0;
  // Handle "5:32" format
  if (clock.includes(":")) {
    const [min, sec] = clock.split(":");
    return (parseInt(min) || 0) * 60 + (parseInt(sec) || 0);
  }
  // Handle "45.2" format (seconds only)
  return Math.ceil(parseFloat(clock) || 0);
}

function getTotalSecondsRemaining(period: number, clockSeconds: number): number {
  // NBA: 4 quarters x 12 min (720s each), OT = 5 min (300s)
  if (period <= 4) {
    const quartersRemaining = 4 - period;
    return quartersRemaining * 720 + clockSeconds;
  }
  // Overtime — just the current OT period clock
  return clockSeconds;
}

function getWinPctFromRecord(record?: string): number {
  if (!record) return 0.5;
  const { wins, losses } = parseRecord(record);
  const total = wins + losses;
  if (total === 0) return 0.5;
  return wins / total;
}

export function calculateWinProbability(
  input: WinProbabilityInput
): WinProbabilityResult {
  const { homeScore, awayScore, period, clock, gameStatus, homeRecord, awayRecord, homeWinner } = input;

  // Final — deterministic
  if (gameStatus === "final") {
    if (homeWinner === true || homeScore > awayScore) {
      return { home: 100, away: 0 };
    }
    return { home: 0, away: 100 };
  }

  const homeWinPct = getWinPctFromRecord(homeRecord);
  const awayWinPct = getWinPctFromRecord(awayRecord);
  const teamStrengthDiff = homeWinPct - awayWinPct; // -1 to +1

  // Pre-game — based on team strength + home court
  if (gameStatus === "scheduled") {
    const homeAdvantage = 3.5;
    const raw = sigmoid(0.15 * (teamStrengthDiff * 10 + homeAdvantage));
    const homeProb = Math.round(Math.min(75, Math.max(25, raw * 100)));
    return { home: homeProb, away: 100 - homeProb };
  }

  // Live game
  const scoreDiff = homeScore - awayScore;
  const clockSeconds = parseClockToSeconds(clock);
  const totalSecondsRemaining = getTotalSecondsRemaining(period, clockSeconds);

  // Game essentially over (buzzer)
  if (totalSecondsRemaining <= 0 && scoreDiff !== 0) {
    return scoreDiff > 0
      ? { home: 99, away: 1 }
      : { home: 1, away: 99 };
  }

  // Tied with no time — coin flip
  if (totalSecondsRemaining <= 0 && scoreDiff === 0) {
    return { home: 55, away: 45 }; // slight home edge for OT
  }

  const totalGameSeconds = 2880; // 48 minutes
  const timeRemainingFactor = Math.sqrt(
    Math.max(totalSecondsRemaining, 1) / totalGameSeconds
  );

  // Team strength matters less as game progresses
  const teamStrengthAdj = teamStrengthDiff * 5 * timeRemainingFactor;

  // Reduced home court for in-game (crowd already factored into play)
  const homeCourt = 1.5;

  const effectiveLead = scoreDiff + homeCourt + teamStrengthAdj;
  const k = 0.18;

  const raw = sigmoid(k * effectiveLead / Math.max(timeRemainingFactor, 0.01));
  const homeProb = Math.round(Math.min(99, Math.max(1, raw * 100)));

  return { home: homeProb, away: 100 - homeProb };
}
