// Client-side NBA team and player mappings for logos, headshots, and page links
// These are static lookups — no API calls needed

// Team full name → abbreviation
export const NBA_TEAM_NAME_TO_ABBR: Record<string, string> = {
  "Atlanta Hawks": "ATL",
  "Boston Celtics": "BOS",
  "Brooklyn Nets": "BKN",
  "Charlotte Hornets": "CHA",
  "Chicago Bulls": "CHI",
  "Cleveland Cavaliers": "CLE",
  "Dallas Mavericks": "DAL",
  "Denver Nuggets": "DEN",
  "Detroit Pistons": "DET",
  "Golden State Warriors": "GSW",
  "Houston Rockets": "HOU",
  "Indiana Pacers": "IND",
  "Los Angeles Clippers": "LAC",
  "LA Clippers": "LAC",
  "Los Angeles Lakers": "LAL",
  "LA Lakers": "LAL",
  "Memphis Grizzlies": "MEM",
  "Miami Heat": "MIA",
  "Milwaukee Bucks": "MIL",
  "Minnesota Timberwolves": "MIN",
  "New Orleans Pelicans": "NOP",
  "New York Knicks": "NYK",
  "Oklahoma City Thunder": "OKC",
  "Orlando Magic": "ORL",
  "Philadelphia 76ers": "PHI",
  "Phoenix Suns": "PHX",
  "Portland Trail Blazers": "POR",
  "Sacramento Kings": "SAC",
  "San Antonio Spurs": "SAS",
  "Toronto Raptors": "TOR",
  "Utah Jazz": "UTA",
  "Washington Wizards": "WAS",
};

// Team abbreviation → NBA.com team ID (for logo CDN)
const NBA_TEAM_NBA_IDS: Record<string, string> = {
  ATL: "1610612737",
  BOS: "1610612738",
  BKN: "1610612751",
  CHA: "1610612766",
  CHI: "1610612741",
  CLE: "1610612739",
  DAL: "1610612742",
  DEN: "1610612743",
  DET: "1610612765",
  GSW: "1610612744",
  HOU: "1610612745",
  IND: "1610612754",
  LAC: "1610612746",
  LAL: "1610612747",
  MEM: "1610612763",
  MIA: "1610612748",
  MIL: "1610612749",
  MIN: "1610612750",
  NOP: "1610612740",
  NYK: "1610612752",
  OKC: "1610612760",
  ORL: "1610612753",
  PHI: "1610612755",
  PHX: "1610612756",
  POR: "1610612757",
  SAC: "1610612758",
  SAS: "1610612759",
  TOR: "1610612761",
  UTA: "1610612762",
  WAS: "1610612764",
};

// Team abbreviation → BallDontLie team ID (for team page URLs)
const NBA_TEAM_BDL_IDS: Record<string, string> = {
  ATL: "1",
  BOS: "2",
  BKN: "3",
  CHA: "4",
  CHI: "5",
  CLE: "6",
  DAL: "7",
  DEN: "8",
  DET: "9",
  GSW: "10",
  HOU: "11",
  IND: "12",
  LAC: "13",
  LAL: "14",
  MEM: "15",
  MIA: "16",
  MIL: "17",
  MIN: "18",
  NOP: "19",
  NYK: "20",
  OKC: "21",
  ORL: "22",
  PHI: "23",
  PHX: "24",
  POR: "25",
  SAC: "26",
  SAS: "27",
  TOR: "28",
  UTA: "29",
  WAS: "30",
};

// Player name → NBA.com player ID (for headshots)
export const NBA_PLAYER_IDS: Record<string, string> = {
  "LeBron James": "2544",
  "Stephen Curry": "201939",
  "Kevin Durant": "201142",
  "Luka Doncic": "1629029",
  "Shai Gilgeous-Alexander": "1628983",
  "Anthony Edwards": "1630162",
  "Jaylen Brown": "1627759",
  "Tyrese Maxey": "1630224",
  "Donovan Mitchell": "1628378",
  "Kawhi Leonard": "202695",
  "Lauri Markkanen": "1628374",
  "Jalen Brunson": "1628973",
  "Michael Porter Jr.": "1628966",
  "Jamal Murray": "1628969",
  "Deni Avdija": "1630166",
  "Devin Booker": "1626164",
  "James Harden": "201935",
  "Cade Cunningham": "1630595",
  "Victor Wembanyama": "1641705",
  "Pascal Siakam": "1627783",
  "Julius Randle": "203944",
  "Brandon Ingram": "1627742",
  "Alperen Sengun": "1630578",
  "Bam Adebayo": "1628389",
  "Giannis Antetokounmpo": "203507",
  "Nikola Jokic": "203999",
  "Joel Embiid": "203954",
  "Jayson Tatum": "1628369",
  "Jimmy Butler": "202710",
  "Damian Lillard": "203081",
  "Trae Young": "1629027",
  "Ja Morant": "1629630",
  "De'Aaron Fox": "1628368",
  "Tyrese Haliburton": "1630169",
  "Karl-Anthony Towns": "1626157",
  "Paul George": "202331",
  "Zion Williamson": "1629627",
  "DeMar DeRozan": "201565",
  "Russell Westbrook": "201566",
  "Chris Paul": "101108",
  "Kyrie Irving": "202681",
  "Draymond Green": "203110",
  "Klay Thompson": "202691",
  "Rudy Gobert": "203497",
  "Jrue Holiday": "201950",
  "Bradley Beal": "203078",
  "Zach LaVine": "203897",
  "Franz Wagner": "1630532",
  "Paolo Banchero": "1631094",
  "Evan Mobley": "1630596",
  "Scottie Barnes": "1630567",
  "LaMelo Ball": "1630163",
  "Tyler Herro": "1629639",
  "Andrew Wiggins": "203952",
  "Domantas Sabonis": "1627734",
  "Austin Reaves": "1630559",
  "Jalen Williams": "1631114",
  "Cam Thomas": "1630560",
};

// Helper functions

export function getTeamLogoUrl(teamName: string): string | null {
  const abbr = NBA_TEAM_NAME_TO_ABBR[teamName];
  if (!abbr) return null;
  const nbaId = NBA_TEAM_NBA_IDS[abbr];
  if (!nbaId) return null;
  return `https://cdn.nba.com/logos/nba/${nbaId}/primary/L/logo.svg`;
}

export function getTeamPageUrl(teamName: string): string | null {
  const abbr = NBA_TEAM_NAME_TO_ABBR[teamName];
  if (!abbr) return null;
  const bdlId = NBA_TEAM_BDL_IDS[abbr];
  if (!bdlId) return null;
  return `/teams/nba/${bdlId}`;
}

export function getPlayerHeadshotUrl(playerName: string): string | null {
  const nbaId = NBA_PLAYER_IDS[playerName];
  if (!nbaId) return null;
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`;
}

export function getPlayerPageUrl(playerName: string): string | null {
  const nbaId = NBA_PLAYER_IDS[playerName];
  if (!nbaId) return null;
  return `/player/${nbaId}`;
}
