// Shared types for basketball API data

export interface ApiTeam {
  id: number | string;
  name: string;
  abbreviation: string;
  city?: string;
  conference?: string;
  division?: string;
  full_name?: string;
}

export interface ApiPlayer {
  id: number | string;
  first_name: string;
  last_name: string;
  position: string;
  height?: string;
  weight?: string;
  jersey_number?: string;
  college?: string;
  country?: string;
  draft_year?: number;
  draft_round?: number;
  draft_number?: number;
  team?: ApiTeam;
}

export interface ApiGame {
  id: number | string;
  date: string;
  home_team: ApiTeam;
  visitor_team: ApiTeam;
  home_team_score: number;
  visitor_team_score: number;
  status: string;
  period?: number;
  time?: string;
  postseason?: boolean;
  season?: number;
}

export interface ApiPlayerStats {
  id: number | string;
  player: ApiPlayer;
  team: ApiTeam;
  game: ApiGame;
  min?: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    total_pages?: number;
    current_page?: number;
    next_page?: number;
    per_page?: number;
    total_count?: number;
  };
}

// Normalized types for our application
export interface NormalizedTeam {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  logoUrl: string;
  conference?: string;
  division?: string;
}

export interface NormalizedGame {
  id: string;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "final";
  quarter?: string;
  clock?: string;
  gameDate: Date;
  isPlayoffs: boolean;
  season?: string;
}

export interface NormalizedPlayer {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  position?: string;
  jerseyNumber?: string;
  height?: string;
  weight?: number;
  college?: string;
  country?: string;
  team?: NormalizedTeam;
  headshotUrl?: string;
}

export interface NormalizedPlayerStats {
  playerId: string;
  gameId: string;
  minutes: number;
  points: number;
  rebounds: number;
  offReb: number;
  defReb: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fgm: number;
  fga: number;
  fgPct: number;
  tpm: number;
  tpa: number;
  tpPct: number;
  ftm: number;
  fta: number;
  ftPct: number;
  plusMinus?: number;
}
