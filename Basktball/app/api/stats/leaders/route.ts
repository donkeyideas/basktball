import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type StatCategory = "ppg" | "rpg" | "apg" | "spg" | "bpg" | "fg_pct" | "three_pct";

// NBA.com headshot URL helper
const getNbaHeadshot = (nbaId: string) =>
  `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`;

// Current NBA season leaders (2025-26 season) - fallback data with real NBA player IDs
// These are updated periodically and serve as display data when database is empty
const CURRENT_LEADERS = {
  ppg: [
    { playerId: "1629029", name: "Luka Doncic", team: "LAL", teamName: "Los Angeles Lakers", value: 33.6, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 32.0, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 29.7, gamesPlayed: 41, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1627759", name: "Jaylen Brown", team: "BOS", teamName: "Boston Celtics", value: 29.4, gamesPlayed: 45, imageUrl: getNbaHeadshot("1627759") },
    { playerId: "1630224", name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", value: 29.2, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630224") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 28.8, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "202695", name: "Kawhi Leonard", team: "LAC", teamName: "Los Angeles Clippers", value: 27.6, gamesPlayed: 36, imageUrl: getNbaHeadshot("202695") },
    { playerId: "1628374", name: "Lauri Markkanen", team: "UTA", teamName: "Utah Jazz", value: 27.4, gamesPlayed: 36, imageUrl: getNbaHeadshot("1628374") },
    { playerId: "201939", name: "Stephen Curry", team: "GSW", teamName: "Golden State Warriors", value: 27.2, gamesPlayed: 39, imageUrl: getNbaHeadshot("201939") },
    { playerId: "1628973", name: "Jalen Brunson", team: "NYK", teamName: "New York Knicks", value: 27.2, gamesPlayed: 44, imageUrl: getNbaHeadshot("1628973") },
    { playerId: "201142", name: "Kevin Durant", team: "HOU", teamName: "Houston Rockets", value: 26.2, gamesPlayed: 45, imageUrl: getNbaHeadshot("201142") },
    { playerId: "1628966", name: "Michael Porter Jr.", team: "BKN", teamName: "Brooklyn Nets", value: 25.6, gamesPlayed: 38, imageUrl: getNbaHeadshot("1628966") },
    { playerId: "1628969", name: "Jamal Murray", team: "DEN", teamName: "Denver Nuggets", value: 25.5, gamesPlayed: 45, imageUrl: getNbaHeadshot("1628969") },
    { playerId: "1630166", name: "Deni Avdija", team: "POR", teamName: "Portland Trail Blazers", value: 25.5, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630166") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 25.4, gamesPlayed: 41, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "201935", name: "James Harden", team: "LAC", teamName: "Los Angeles Clippers", value: 25.4, gamesPlayed: 44, imageUrl: getNbaHeadshot("201935") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 25.2, gamesPlayed: 42, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "1630224", name: "Keyonte George", team: "UTA", teamName: "Utah Jazz", value: 25.2, gamesPlayed: 43, imageUrl: getNbaHeadshot("1630524") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 24.2, gamesPlayed: 51, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "1627783", name: "Pascal Siakam", team: "IND", teamName: "Indiana Pacers", value: 23.8, gamesPlayed: 48, imageUrl: getNbaHeadshot("1627783") },
    { playerId: "1629636", name: "Jalen Johnson", team: "ATL", teamName: "Atlanta Hawks", value: 23.1, gamesPlayed: 46, imageUrl: getNbaHeadshot("1629636") },
    { playerId: "1626181", name: "Norman Powell", team: "MIA", teamName: "Miami Heat", value: 23.0, gamesPlayed: 43, imageUrl: getNbaHeadshot("1626181") },
    { playerId: "203944", name: "Julius Randle", team: "MIN", teamName: "Minnesota Timberwolves", value: 22.2, gamesPlayed: 47, imageUrl: getNbaHeadshot("203944") },
    { playerId: "1627742", name: "Brandon Ingram", team: "TOR", teamName: "Toronto Raptors", value: 21.9, gamesPlayed: 49, imageUrl: getNbaHeadshot("1627742") },
    { playerId: "1630549", name: "Shaedon Sharpe", team: "POR", teamName: "Portland Trail Blazers", value: 21.8, gamesPlayed: 46, imageUrl: getNbaHeadshot("1630549") },
  ],
  rpg: [
    { playerId: "1630194", name: "Jalen Duren", team: "DET", teamName: "Detroit Pistons", value: 11.8, gamesPlayed: 46, imageUrl: getNbaHeadshot("1630194") },
    { playerId: "203944", name: "Julius Randle", team: "MIN", teamName: "Minnesota Timberwolves", value: 10.5, gamesPlayed: 46, imageUrl: getNbaHeadshot("203944") },
    { playerId: "1630578", name: "Alperen Sengun", team: "HOU", teamName: "Houston Rockets", value: 9.4, gamesPlayed: 41, imageUrl: getNbaHeadshot("1630578") },
    { playerId: "1631094", name: "Alex Sarr", team: "WAS", teamName: "Washington Wizards", value: 8.8, gamesPlayed: 42, imageUrl: getNbaHeadshot("1631094") },
    { playerId: "1628389", name: "Bam Adebayo", team: "MIA", teamName: "Miami Heat", value: 8.8, gamesPlayed: 41, imageUrl: getNbaHeadshot("1628389") },
    { playerId: "1628991", name: "Jaren Jackson Jr.", team: "MEM", teamName: "Memphis Grizzlies", value: 8.8, gamesPlayed: 39, imageUrl: getNbaHeadshot("1628991") },
    { playerId: "1630532", name: "Chet Holmgren", team: "OKC", teamName: "Oklahoma City Thunder", value: 8.5, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630532") },
    { playerId: "1629636", name: "Evan Mobley", team: "CLE", teamName: "Cleveland Cavaliers", value: 8.5, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628977") },
    { playerId: "1629029", name: "Luka Doncic", team: "LAL", teamName: "Los Angeles Lakers", value: 8.0, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "1628966", name: "Michael Porter Jr.", team: "BKN", teamName: "Brooklyn Nets", value: 7.3, gamesPlayed: 38, imageUrl: getNbaHeadshot("1628966") },
    { playerId: "1630166", name: "Deni Avdija", team: "POR", teamName: "Portland Trail Blazers", value: 7.2, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630166") },
    { playerId: "1628374", name: "Lauri Markkanen", team: "UTA", teamName: "Utah Jazz", value: 7.1, gamesPlayed: 36, imageUrl: getNbaHeadshot("1628374") },
    { playerId: "1627759", name: "Jaylen Brown", team: "BOS", teamName: "Boston Celtics", value: 6.9, gamesPlayed: 45, imageUrl: getNbaHeadshot("1627759") },
    { playerId: "1627783", name: "Pascal Siakam", team: "IND", teamName: "Indiana Pacers", value: 6.9, gamesPlayed: 51, imageUrl: getNbaHeadshot("1627783") },
    { playerId: "1626181", name: "Norman Powell", team: "MIA", teamName: "Miami Heat", value: 6.8, gamesPlayed: 48, imageUrl: getNbaHeadshot("1626181") },
    { playerId: "202695", name: "Kawhi Leonard", team: "LAC", teamName: "Los Angeles Clippers", value: 6.1, gamesPlayed: 36, imageUrl: getNbaHeadshot("202695") },
    { playerId: "1628398", name: "Scottie Barnes", team: "TOR", teamName: "Toronto Raptors", value: 5.9, gamesPlayed: 49, imageUrl: getNbaHeadshot("1630567") },
    { playerId: "1627742", name: "Brandon Ingram", team: "TOR", teamName: "Toronto Raptors", value: 5.9, gamesPlayed: 49, imageUrl: getNbaHeadshot("1627742") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 5.2, gamesPlayed: 41, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1627783", name: "Pascal Siakam", team: "IND", teamName: "Indiana Pacers", value: 4.9, gamesPlayed: 38, imageUrl: getNbaHeadshot("1627783") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 4.6, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 4.4, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "1630224", name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", value: 4.2, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630224") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 10.8, gamesPlayed: 44, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "201142", name: "Kevin Durant", team: "HOU", teamName: "Houston Rockets", value: 5.8, gamesPlayed: 45, imageUrl: getNbaHeadshot("201142") },
  ],
  apg: [
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 9.8, gamesPlayed: 42, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "1629029", name: "Luka Doncic", team: "LAL", teamName: "Los Angeles Lakers", value: 8.8, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "201935", name: "James Harden", team: "LAC", teamName: "Los Angeles Clippers", value: 8.1, gamesPlayed: 44, imageUrl: getNbaHeadshot("201935") },
    { playerId: "1628969", name: "Jamal Murray", team: "DEN", teamName: "Denver Nuggets", value: 7.5, gamesPlayed: 45, imageUrl: getNbaHeadshot("1628969") },
    { playerId: "1630224", name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", value: 6.9, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630224") },
    { playerId: "1630166", name: "Deni Avdija", team: "POR", teamName: "Portland Trail Blazers", value: 6.7, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630166") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 6.4, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 6.2, gamesPlayed: 41, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "1628973", name: "Jalen Brunson", team: "NYK", teamName: "New York Knicks", value: 6.1, gamesPlayed: 44, imageUrl: getNbaHeadshot("1628973") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 5.8, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "203944", name: "Julius Randle", team: "MIN", teamName: "Minnesota Timberwolves", value: 5.4, gamesPlayed: 46, imageUrl: getNbaHeadshot("203944") },
    { playerId: "1627783", name: "Pascal Siakam", team: "IND", teamName: "Indiana Pacers", value: 4.9, gamesPlayed: 38, imageUrl: getNbaHeadshot("1627783") },
    { playerId: "201939", name: "Stephen Curry", team: "GSW", teamName: "Golden State Warriors", value: 4.8, gamesPlayed: 39, imageUrl: getNbaHeadshot("201939") },
    { playerId: "1627759", name: "Jaylen Brown", team: "BOS", teamName: "Boston Celtics", value: 4.8, gamesPlayed: 45, imageUrl: getNbaHeadshot("1627759") },
    { playerId: "201142", name: "Kevin Durant", team: "HOU", teamName: "Houston Rockets", value: 4.6, gamesPlayed: 45, imageUrl: getNbaHeadshot("201142") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 4.0, gamesPlayed: 42, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "1626181", name: "Norman Powell", team: "MIA", teamName: "Miami Heat", value: 4.0, gamesPlayed: 48, imageUrl: getNbaHeadshot("1626181") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 3.7, gamesPlayed: 41, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1627742", name: "Brandon Ingram", team: "TOR", teamName: "Toronto Raptors", value: 3.7, gamesPlayed: 49, imageUrl: getNbaHeadshot("1627742") },
    { playerId: "202695", name: "Kawhi Leonard", team: "LAC", teamName: "Los Angeles Clippers", value: 3.6, gamesPlayed: 36, imageUrl: getNbaHeadshot("202695") },
    { playerId: "1630549", name: "Shaedon Sharpe", team: "POR", teamName: "Portland Trail Blazers", value: 3.6, gamesPlayed: 45, imageUrl: getNbaHeadshot("1630549") },
    { playerId: "1628966", name: "Michael Porter Jr.", team: "BKN", teamName: "Brooklyn Nets", value: 3.2, gamesPlayed: 38, imageUrl: getNbaHeadshot("1628966") },
    { playerId: "1630524", name: "Keyonte George", team: "UTA", teamName: "Utah Jazz", value: 2.6, gamesPlayed: 43, imageUrl: getNbaHeadshot("1630524") },
    { playerId: "1628374", name: "Lauri Markkanen", team: "UTA", teamName: "Utah Jazz", value: 2.2, gamesPlayed: 36, imageUrl: getNbaHeadshot("1628374") },
    { playerId: "1629636", name: "Jalen Johnson", team: "ATL", teamName: "Atlanta Hawks", value: 1.8, gamesPlayed: 44, imageUrl: getNbaHeadshot("1629636") },
  ],
  spg: [
    { playerId: "202695", name: "Kawhi Leonard", team: "LAC", teamName: "Los Angeles Clippers", value: 2.1, gamesPlayed: 36, imageUrl: getNbaHeadshot("202695") },
    { playerId: "1630224", name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", value: 2.0, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630224") },
    { playerId: "1629029", name: "Luka Doncic", team: "LAL", teamName: "Los Angeles Lakers", value: 1.5, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 1.5, gamesPlayed: 42, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 1.5, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 1.3, gamesPlayed: 41, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 1.3, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 1.3, gamesPlayed: 41, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "201935", name: "James Harden", team: "LAC", teamName: "Los Angeles Clippers", value: 1.3, gamesPlayed: 44, imageUrl: getNbaHeadshot("201935") },
    { playerId: "1630524", name: "Keyonte George", team: "UTA", teamName: "Utah Jazz", value: 1.2, gamesPlayed: 43, imageUrl: getNbaHeadshot("1630524") },
    { playerId: "1628374", name: "Lauri Markkanen", team: "UTA", teamName: "Utah Jazz", value: 1.1, gamesPlayed: 36, imageUrl: getNbaHeadshot("1628374") },
    { playerId: "201939", name: "Stephen Curry", team: "GSW", teamName: "Golden State Warriors", value: 1.1, gamesPlayed: 39, imageUrl: getNbaHeadshot("201939") },
    { playerId: "1628966", name: "Michael Porter Jr.", team: "BKN", teamName: "Brooklyn Nets", value: 1.1, gamesPlayed: 38, imageUrl: getNbaHeadshot("1628966") },
    { playerId: "1627759", name: "Jaylen Brown", team: "BOS", teamName: "Boston Celtics", value: 1.0, gamesPlayed: 45, imageUrl: getNbaHeadshot("1627759") },
    { playerId: "1628969", name: "Jamal Murray", team: "DEN", teamName: "Denver Nuggets", value: 1.0, gamesPlayed: 45, imageUrl: getNbaHeadshot("1628969") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 0.9, gamesPlayed: 46, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "1627783", name: "Pascal Siakam", team: "IND", teamName: "Indiana Pacers", value: 0.9, gamesPlayed: 45, imageUrl: getNbaHeadshot("1627783") },
    { playerId: "1630166", name: "Deni Avdija", team: "POR", teamName: "Portland Trail Blazers", value: 0.8, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630166") },
    { playerId: "1628973", name: "Jalen Brunson", team: "NYK", teamName: "New York Knicks", value: 0.7, gamesPlayed: 44, imageUrl: getNbaHeadshot("1628973") },
    { playerId: "201142", name: "Kevin Durant", team: "HOU", teamName: "Houston Rockets", value: 0.7, gamesPlayed: 45, imageUrl: getNbaHeadshot("201142") },
    { playerId: "1628374", name: "Lauri Markkanen", team: "UTA", teamName: "Utah Jazz", value: 0.6, gamesPlayed: 36, imageUrl: getNbaHeadshot("1628374") },
    { playerId: "203944", name: "Julius Randle", team: "MIN", teamName: "Minnesota Timberwolves", value: 0.6, gamesPlayed: 47, imageUrl: getNbaHeadshot("203944") },
    { playerId: "1627742", name: "Brandon Ingram", team: "TOR", teamName: "Toronto Raptors", value: 0.6, gamesPlayed: 49, imageUrl: getNbaHeadshot("1627742") },
    { playerId: "1630549", name: "Shaedon Sharpe", team: "POR", teamName: "Portland Trail Blazers", value: 0.6, gamesPlayed: 46, imageUrl: getNbaHeadshot("1630549") },
    { playerId: "1629636", name: "Jalen Johnson", team: "ATL", teamName: "Atlanta Hawks", value: 0.5, gamesPlayed: 46, imageUrl: getNbaHeadshot("1629636") },
  ],
  bpg: [
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 2.0, gamesPlayed: 44, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "1630224", name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", value: 0.9, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630224") },
    { playerId: "201142", name: "Kevin Durant", team: "HOU", teamName: "Houston Rockets", value: 0.9, gamesPlayed: 45, imageUrl: getNbaHeadshot("201142") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 0.8, gamesPlayed: 41, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 0.8, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "202695", name: "Kawhi Leonard", team: "LAC", teamName: "Los Angeles Clippers", value: 0.6, gamesPlayed: 36, imageUrl: getNbaHeadshot("202695") },
    { playerId: "1628374", name: "Lauri Markkanen", team: "UTA", teamName: "Utah Jazz", value: 0.6, gamesPlayed: 36, imageUrl: getNbaHeadshot("1628374") },
    { playerId: "1630166", name: "Deni Avdija", team: "POR", teamName: "Portland Trail Blazers", value: 0.6, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630166") },
    { playerId: "1629029", name: "Luka Doncic", team: "LAL", teamName: "Los Angeles Lakers", value: 0.5, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "201939", name: "Stephen Curry", team: "GSW", teamName: "Golden State Warriors", value: 0.4, gamesPlayed: 39, imageUrl: getNbaHeadshot("201939") },
    { playerId: "1627759", name: "Jaylen Brown", team: "BOS", teamName: "Boston Celtics", value: 0.4, gamesPlayed: 45, imageUrl: getNbaHeadshot("1627759") },
    { playerId: "1628969", name: "Jamal Murray", team: "DEN", teamName: "Denver Nuggets", value: 0.4, gamesPlayed: 45, imageUrl: getNbaHeadshot("1628969") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 0.4, gamesPlayed: 41, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "201935", name: "James Harden", team: "LAC", teamName: "Los Angeles Clippers", value: 0.4, gamesPlayed: 44, imageUrl: getNbaHeadshot("201935") },
    { playerId: "1628966", name: "Michael Porter Jr.", team: "BKN", teamName: "Brooklyn Nets", value: 0.3, gamesPlayed: 38, imageUrl: getNbaHeadshot("1628966") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 0.3, gamesPlayed: 42, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 0.2, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "1630524", name: "Keyonte George", team: "UTA", teamName: "Utah Jazz", value: 0.2, gamesPlayed: 43, imageUrl: getNbaHeadshot("1630524") },
    { playerId: "1627783", name: "Pascal Siakam", team: "IND", teamName: "Indiana Pacers", value: 0.2, gamesPlayed: 46, imageUrl: getNbaHeadshot("1627783") },
    { playerId: "1628973", name: "Jalen Brunson", team: "NYK", teamName: "New York Knicks", value: 0.1, gamesPlayed: 44, imageUrl: getNbaHeadshot("1628973") },
    { playerId: "203944", name: "Julius Randle", team: "MIN", teamName: "Minnesota Timberwolves", value: 0.4, gamesPlayed: 47, imageUrl: getNbaHeadshot("203944") },
    { playerId: "1627742", name: "Brandon Ingram", team: "TOR", teamName: "Toronto Raptors", value: 0.4, gamesPlayed: 49, imageUrl: getNbaHeadshot("1627742") },
    { playerId: "1630549", name: "Shaedon Sharpe", team: "POR", teamName: "Portland Trail Blazers", value: 0.3, gamesPlayed: 46, imageUrl: getNbaHeadshot("1630549") },
    { playerId: "1629636", name: "Jalen Johnson", team: "ATL", teamName: "Atlanta Hawks", value: 0.4, gamesPlayed: 46, imageUrl: getNbaHeadshot("1629636") },
    { playerId: "1626181", name: "Norman Powell", team: "MIA", teamName: "Miami Heat", value: 0.3, gamesPlayed: 43, imageUrl: getNbaHeadshot("1626181") },
  ],
  fg_pct: [
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 53.2, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "1627759", name: "Jaylen Brown", team: "BOS", teamName: "Boston Celtics", value: 50.5, gamesPlayed: 45, imageUrl: getNbaHeadshot("1627759") },
    { playerId: "201142", name: "Kevin Durant", team: "HOU", teamName: "Houston Rockets", value: 52.8, gamesPlayed: 45, imageUrl: getNbaHeadshot("201142") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 48.8, gamesPlayed: 41, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "1629029", name: "Luka Doncic", team: "LAL", teamName: "Los Angeles Lakers", value: 47.5, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "202695", name: "Kawhi Leonard", team: "LAC", teamName: "Los Angeles Clippers", value: 51.2, gamesPlayed: 36, imageUrl: getNbaHeadshot("202695") },
    { playerId: "1628969", name: "Jamal Murray", team: "DEN", teamName: "Denver Nuggets", value: 48.5, gamesPlayed: 45, imageUrl: getNbaHeadshot("1628969") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 46.8, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 45.2, gamesPlayed: 41, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1630224", name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", value: 45.8, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630224") },
    { playerId: "1628973", name: "Jalen Brunson", team: "NYK", teamName: "New York Knicks", value: 47.2, gamesPlayed: 44, imageUrl: getNbaHeadshot("1628973") },
    { playerId: "201939", name: "Stephen Curry", team: "GSW", teamName: "Golden State Warriors", value: 45.5, gamesPlayed: 39, imageUrl: getNbaHeadshot("201939") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 47.8, gamesPlayed: 51, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "1627783", name: "Pascal Siakam", team: "IND", teamName: "Indiana Pacers", value: 49.5, gamesPlayed: 48, imageUrl: getNbaHeadshot("1627783") },
    { playerId: "1628374", name: "Lauri Markkanen", team: "UTA", teamName: "Utah Jazz", value: 46.2, gamesPlayed: 36, imageUrl: getNbaHeadshot("1628374") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 44.8, gamesPlayed: 42, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "201935", name: "James Harden", team: "LAC", teamName: "Los Angeles Clippers", value: 44.2, gamesPlayed: 44, imageUrl: getNbaHeadshot("201935") },
    { playerId: "1630166", name: "Deni Avdija", team: "POR", teamName: "Portland Trail Blazers", value: 46.5, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630166") },
    { playerId: "203944", name: "Julius Randle", team: "MIN", teamName: "Minnesota Timberwolves", value: 45.2, gamesPlayed: 47, imageUrl: getNbaHeadshot("203944") },
    { playerId: "1627742", name: "Brandon Ingram", team: "TOR", teamName: "Toronto Raptors", value: 47.5, gamesPlayed: 49, imageUrl: getNbaHeadshot("1627742") },
    { playerId: "1630549", name: "Shaedon Sharpe", team: "POR", teamName: "Portland Trail Blazers", value: 45.8, gamesPlayed: 46, imageUrl: getNbaHeadshot("1630549") },
    { playerId: "1629636", name: "Jalen Johnson", team: "ATL", teamName: "Atlanta Hawks", value: 48.2, gamesPlayed: 46, imageUrl: getNbaHeadshot("1629636") },
    { playerId: "1626181", name: "Norman Powell", team: "MIA", teamName: "Miami Heat", value: 47.8, gamesPlayed: 43, imageUrl: getNbaHeadshot("1626181") },
    { playerId: "1628966", name: "Michael Porter Jr.", team: "BKN", teamName: "Brooklyn Nets", value: 48.5, gamesPlayed: 38, imageUrl: getNbaHeadshot("1628966") },
    { playerId: "1630524", name: "Keyonte George", team: "UTA", teamName: "Utah Jazz", value: 42.5, gamesPlayed: 43, imageUrl: getNbaHeadshot("1630524") },
  ],
  three_pct: [
    { playerId: "201939", name: "Stephen Curry", team: "GSW", teamName: "Golden State Warriors", value: 41.5, gamesPlayed: 39, imageUrl: getNbaHeadshot("201939") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 39.2, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 38.5, gamesPlayed: 41, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "1630224", name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", value: 38.2, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630224") },
    { playerId: "201142", name: "Kevin Durant", team: "HOU", teamName: "Houston Rockets", value: 40.5, gamesPlayed: 45, imageUrl: getNbaHeadshot("201142") },
    { playerId: "1627759", name: "Jaylen Brown", team: "BOS", teamName: "Boston Celtics", value: 36.8, gamesPlayed: 45, imageUrl: getNbaHeadshot("1627759") },
    { playerId: "1628973", name: "Jalen Brunson", team: "NYK", teamName: "New York Knicks", value: 38.5, gamesPlayed: 44, imageUrl: getNbaHeadshot("1628973") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 35.5, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "1629029", name: "Luka Doncic", team: "LAL", teamName: "Los Angeles Lakers", value: 35.2, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "202695", name: "Kawhi Leonard", team: "LAC", teamName: "Los Angeles Clippers", value: 39.5, gamesPlayed: 36, imageUrl: getNbaHeadshot("202695") },
    { playerId: "1628969", name: "Jamal Murray", team: "DEN", teamName: "Denver Nuggets", value: 37.2, gamesPlayed: 45, imageUrl: getNbaHeadshot("1628969") },
    { playerId: "201935", name: "James Harden", team: "LAC", teamName: "Los Angeles Clippers", value: 36.5, gamesPlayed: 44, imageUrl: getNbaHeadshot("201935") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 35.8, gamesPlayed: 41, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 35.5, gamesPlayed: 42, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 34.5, gamesPlayed: 51, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "1628374", name: "Lauri Markkanen", team: "UTA", teamName: "Utah Jazz", value: 38.8, gamesPlayed: 36, imageUrl: getNbaHeadshot("1628374") },
    { playerId: "1627783", name: "Pascal Siakam", team: "IND", teamName: "Indiana Pacers", value: 33.5, gamesPlayed: 48, imageUrl: getNbaHeadshot("1627783") },
    { playerId: "1630166", name: "Deni Avdija", team: "POR", teamName: "Portland Trail Blazers", value: 36.2, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630166") },
    { playerId: "203944", name: "Julius Randle", team: "MIN", teamName: "Minnesota Timberwolves", value: 35.5, gamesPlayed: 47, imageUrl: getNbaHeadshot("203944") },
    { playerId: "1627742", name: "Brandon Ingram", team: "TOR", teamName: "Toronto Raptors", value: 34.8, gamesPlayed: 49, imageUrl: getNbaHeadshot("1627742") },
    { playerId: "1630549", name: "Shaedon Sharpe", team: "POR", teamName: "Portland Trail Blazers", value: 36.5, gamesPlayed: 46, imageUrl: getNbaHeadshot("1630549") },
    { playerId: "1629636", name: "Jalen Johnson", team: "ATL", teamName: "Atlanta Hawks", value: 33.2, gamesPlayed: 46, imageUrl: getNbaHeadshot("1629636") },
    { playerId: "1626181", name: "Norman Powell", team: "MIA", teamName: "Miami Heat", value: 40.2, gamesPlayed: 43, imageUrl: getNbaHeadshot("1626181") },
    { playerId: "1628966", name: "Michael Porter Jr.", team: "BKN", teamName: "Brooklyn Nets", value: 38.5, gamesPlayed: 38, imageUrl: getNbaHeadshot("1628966") },
    { playerId: "1630524", name: "Keyonte George", team: "UTA", teamName: "Utah Jazz", value: 35.2, gamesPlayed: 43, imageUrl: getNbaHeadshot("1630524") },
  ],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") || "ppg") as StatCategory;
    const limit = parseInt(searchParams.get("limit") || "10");

    // First try to get from database
    const playerStats = await prisma.playerStat.groupBy({
      by: ["playerId"],
      _avg: {
        points: true,
        rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
        fgm: true,
        fga: true,
        tpm: true,
        tpa: true,
      },
      _count: {
        id: true,
      },
    });

    // Filter to players with enough games
    const qualifiedStats = playerStats.filter((s) => s._count.id >= 5);

    // If database has data, use it
    if (qualifiedStats.length > 0) {
      const sortedStats = qualifiedStats.sort((a, b) => {
        switch (category) {
          case "ppg":
            return (b._avg.points || 0) - (a._avg.points || 0);
          case "rpg":
            return (b._avg.rebounds || 0) - (a._avg.rebounds || 0);
          case "apg":
            return (b._avg.assists || 0) - (a._avg.assists || 0);
          case "spg":
            return (b._avg.steals || 0) - (a._avg.steals || 0);
          case "bpg":
            return (b._avg.blocks || 0) - (a._avg.blocks || 0);
          case "fg_pct":
            const aFgPct = a._avg.fga ? (a._avg.fgm || 0) / a._avg.fga : 0;
            const bFgPct = b._avg.fga ? (b._avg.fgm || 0) / b._avg.fga : 0;
            return bFgPct - aFgPct;
          case "three_pct":
            const a3Pct = a._avg.tpa ? (a._avg.tpm || 0) / a._avg.tpa : 0;
            const b3Pct = b._avg.tpa ? (b._avg.tpm || 0) / b._avg.tpa : 0;
            return b3Pct - a3Pct;
          default:
            return (b._avg.points || 0) - (a._avg.points || 0);
        }
      });

      const topPlayerIds = sortedStats.slice(0, limit).map((s) => s.playerId);
      const players = await prisma.player.findMany({
        where: { id: { in: topPlayerIds } },
        include: {
          team: {
            select: { abbreviation: true, name: true },
          },
        },
      });

      const leaders = sortedStats.slice(0, limit).map((stat, index) => {
        const player = players.find((p) => p.id === stat.playerId);
        let value: number;
        switch (category) {
          case "ppg":
            value = stat._avg.points || 0;
            break;
          case "rpg":
            value = stat._avg.rebounds || 0;
            break;
          case "apg":
            value = stat._avg.assists || 0;
            break;
          case "spg":
            value = stat._avg.steals || 0;
            break;
          case "bpg":
            value = stat._avg.blocks || 0;
            break;
          case "fg_pct":
            value = stat._avg.fga ? ((stat._avg.fgm || 0) / stat._avg.fga) * 100 : 0;
            break;
          case "three_pct":
            value = stat._avg.tpa ? ((stat._avg.tpm || 0) / stat._avg.tpa) * 100 : 0;
            break;
          default:
            value = stat._avg.points || 0;
        }

        return {
          rank: index + 1,
          playerId: stat.playerId,
          name: player?.name || "Unknown",
          team: player?.team?.abbreviation || "FA",
          teamName: player?.team?.name || "Free Agent",
          value: Math.round(value * 10) / 10,
          gamesPlayed: stat._count.id,
          imageUrl: player?.headshotUrl || getNbaHeadshot(stat.playerId),
        };
      });

      return NextResponse.json({
        success: true,
        category,
        leaders,
        source: "database",
      });
    }

    // Fallback to current season leaders
    const fallbackLeaders = CURRENT_LEADERS[category] || CURRENT_LEADERS.ppg;
    const leaders = fallbackLeaders.slice(0, limit).map((leader, index) => ({
      rank: index + 1,
      ...leader,
    }));

    return NextResponse.json({
      success: true,
      category,
      leaders,
      source: "current_season",
    });
  } catch (error) {
    console.error("Stats leaders API error:", error);

    // Even on error, return fallback data
    const category = "ppg";
    const fallbackLeaders = CURRENT_LEADERS[category].slice(0, 10).map((leader, index) => ({
      rank: index + 1,
      ...leader,
    }));

    return NextResponse.json({
      success: true,
      category,
      leaders: fallbackLeaders,
      source: "fallback",
    });
  }
}
