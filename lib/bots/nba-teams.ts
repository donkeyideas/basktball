// All NBA + WNBA teams - used for bot team assignment
// Hardcoded to avoid depending on incomplete DB data

export interface TeamInfo {
  abbreviation: string;
  name: string;
  city: string;
  conference: string;
  league: "NBA" | "WNBA";
}

export const ALL_TEAMS: TeamInfo[] = [
  // NBA (30 teams)
  { abbreviation: "ATL", name: "Hawks", city: "Atlanta", conference: "East", league: "NBA" },
  { abbreviation: "BOS", name: "Celtics", city: "Boston", conference: "East", league: "NBA" },
  { abbreviation: "BKN", name: "Nets", city: "Brooklyn", conference: "East", league: "NBA" },
  { abbreviation: "CHA", name: "Hornets", city: "Charlotte", conference: "East", league: "NBA" },
  { abbreviation: "CHI", name: "Bulls", city: "Chicago", conference: "East", league: "NBA" },
  { abbreviation: "CLE", name: "Cavaliers", city: "Cleveland", conference: "East", league: "NBA" },
  { abbreviation: "DAL", name: "Mavericks", city: "Dallas", conference: "West", league: "NBA" },
  { abbreviation: "DEN", name: "Nuggets", city: "Denver", conference: "West", league: "NBA" },
  { abbreviation: "DET", name: "Pistons", city: "Detroit", conference: "East", league: "NBA" },
  { abbreviation: "GSW", name: "Warriors", city: "Golden State", conference: "West", league: "NBA" },
  { abbreviation: "HOU", name: "Rockets", city: "Houston", conference: "West", league: "NBA" },
  { abbreviation: "IND", name: "Pacers", city: "Indiana", conference: "East", league: "NBA" },
  { abbreviation: "LAC", name: "Clippers", city: "Los Angeles", conference: "West", league: "NBA" },
  { abbreviation: "LAL", name: "Lakers", city: "Los Angeles", conference: "West", league: "NBA" },
  { abbreviation: "MEM", name: "Grizzlies", city: "Memphis", conference: "West", league: "NBA" },
  { abbreviation: "MIA", name: "Heat", city: "Miami", conference: "East", league: "NBA" },
  { abbreviation: "MIL", name: "Bucks", city: "Milwaukee", conference: "East", league: "NBA" },
  { abbreviation: "MIN", name: "Timberwolves", city: "Minnesota", conference: "West", league: "NBA" },
  { abbreviation: "NOP", name: "Pelicans", city: "New Orleans", conference: "West", league: "NBA" },
  { abbreviation: "NYK", name: "Knicks", city: "New York", conference: "East", league: "NBA" },
  { abbreviation: "OKC", name: "Thunder", city: "Oklahoma City", conference: "West", league: "NBA" },
  { abbreviation: "ORL", name: "Magic", city: "Orlando", conference: "East", league: "NBA" },
  { abbreviation: "PHI", name: "76ers", city: "Philadelphia", conference: "East", league: "NBA" },
  { abbreviation: "PHX", name: "Suns", city: "Phoenix", conference: "West", league: "NBA" },
  { abbreviation: "POR", name: "Trail Blazers", city: "Portland", conference: "West", league: "NBA" },
  { abbreviation: "SAC", name: "Kings", city: "Sacramento", conference: "West", league: "NBA" },
  { abbreviation: "SAS", name: "Spurs", city: "San Antonio", conference: "West", league: "NBA" },
  { abbreviation: "TOR", name: "Raptors", city: "Toronto", conference: "East", league: "NBA" },
  { abbreviation: "UTA", name: "Jazz", city: "Utah", conference: "West", league: "NBA" },
  { abbreviation: "WAS", name: "Wizards", city: "Washington", conference: "East", league: "NBA" },

  // WNBA (13 teams)
  { abbreviation: "W-ATL", name: "Dream", city: "Atlanta", conference: "East", league: "WNBA" },
  { abbreviation: "W-CHI", name: "Sky", city: "Chicago", conference: "East", league: "WNBA" },
  { abbreviation: "W-CON", name: "Sun", city: "Connecticut", conference: "East", league: "WNBA" },
  { abbreviation: "W-DAL", name: "Wings", city: "Dallas", conference: "West", league: "WNBA" },
  { abbreviation: "W-GSV", name: "Valkyries", city: "Golden State", conference: "West", league: "WNBA" },
  { abbreviation: "W-IND", name: "Fever", city: "Indiana", conference: "East", league: "WNBA" },
  { abbreviation: "W-LVA", name: "Aces", city: "Las Vegas", conference: "West", league: "WNBA" },
  { abbreviation: "W-LAL", name: "Sparks", city: "Los Angeles", conference: "West", league: "WNBA" },
  { abbreviation: "W-MIN", name: "Lynx", city: "Minnesota", conference: "West", league: "WNBA" },
  { abbreviation: "W-NYL", name: "Liberty", city: "New York", conference: "East", league: "WNBA" },
  { abbreviation: "W-PHX", name: "Mercury", city: "Phoenix", conference: "West", league: "WNBA" },
  { abbreviation: "W-POR", name: "Phantom", city: "Portland", conference: "West", league: "WNBA" },
  { abbreviation: "W-SEA", name: "Storm", city: "Seattle", conference: "West", league: "WNBA" },
  { abbreviation: "W-TOR", name: "Tempo", city: "Toronto", conference: "East", league: "WNBA" },
  { abbreviation: "W-WAS", name: "Mystics", city: "Washington", conference: "East", league: "WNBA" },
];

// Convenience subsets
export const NBA_TEAMS = ALL_TEAMS.filter((t) => t.league === "NBA");
export const WNBA_TEAMS = ALL_TEAMS.filter((t) => t.league === "WNBA");

// Lookup by abbreviation
export function getTeam(abbreviation: string): TeamInfo | undefined {
  return ALL_TEAMS.find((t) => t.abbreviation === abbreviation);
}

// Backwards-compatible alias
export const getNbaTeam = getTeam;

// Full display name (e.g. "Los Angeles Lakers")
export function getTeamFullName(team: TeamInfo): string {
  return `${team.city} ${team.name}`;
}

// Re-export type under old name for compatibility
export type NbaTeamInfo = TeamInfo;
