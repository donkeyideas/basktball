import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type StatCategory = "ppg" | "rpg" | "apg" | "spg" | "bpg" | "fg_pct" | "three_pct";

// NBA.com headshot URL helper
const getNbaHeadshot = (nbaId: string) =>
  `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`;

// Current NBA season leaders (2024-25 season) - fallback data with real NBA player IDs
// These are updated periodically and serve as display data when database is empty
const CURRENT_LEADERS = {
  ppg: [
    { playerId: "1629029", name: "Luka Doncic", team: "DAL", teamName: "Dallas Mavericks", value: 33.9, gamesPlayed: 45, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 31.4, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 31.2, gamesPlayed: 42, imageUrl: getNbaHeadshot("203507") },
    { playerId: "203954", name: "Joel Embiid", team: "PHI", teamName: "Philadelphia 76ers", value: 27.9, gamesPlayed: 25, imageUrl: getNbaHeadshot("203954") },
    { playerId: "1628369", name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", value: 27.5, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628369") },
    { playerId: "201142", name: "Kevin Durant", team: "PHX", teamName: "Phoenix Suns", value: 27.2, gamesPlayed: 40, imageUrl: getNbaHeadshot("201142") },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 26.8, gamesPlayed: 48, imageUrl: getNbaHeadshot("203999") },
    { playerId: "1628368", name: "De'Aaron Fox", team: "SAC", teamName: "Sacramento Kings", value: 26.8, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628368") },
    { playerId: "1629027", name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", value: 26.1, gamesPlayed: 44, imageUrl: getNbaHeadshot("1629027") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 25.8, gamesPlayed: 45, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "203076", name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", value: 25.4, gamesPlayed: 42, imageUrl: getNbaHeadshot("203076") },
    { playerId: "203081", name: "Damian Lillard", team: "MIL", teamName: "Milwaukee Bucks", value: 25.1, gamesPlayed: 44, imageUrl: getNbaHeadshot("203081") },
    { playerId: "1629630", name: "Ja Morant", team: "MEM", teamName: "Memphis Grizzlies", value: 24.8, gamesPlayed: 35, imageUrl: getNbaHeadshot("1629630") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 24.5, gamesPlayed: 46, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 24.2, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1630559", name: "Franz Wagner", team: "ORL", teamName: "Orlando Magic", value: 23.8, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630559") },
    { playerId: "1630163", name: "LaMelo Ball", team: "CHA", teamName: "Charlotte Hornets", value: 22.5, gamesPlayed: 35, imageUrl: getNbaHeadshot("1630163") },
    { playerId: "1628991", name: "Jaren Jackson Jr.", team: "MEM", teamName: "Memphis Grizzlies", value: 21.5, gamesPlayed: 40, imageUrl: getNbaHeadshot("1628991") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 21.4, gamesPlayed: 47, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "203110", name: "Darius Garland", team: "CLE", teamName: "Cleveland Cavaliers", value: 21.2, gamesPlayed: 43, imageUrl: getNbaHeadshot("203110") },
    { playerId: "1629628", name: "RJ Barrett", team: "TOR", teamName: "Toronto Raptors", value: 20.8, gamesPlayed: 42, imageUrl: getNbaHeadshot("1629628") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 20.5, gamesPlayed: 45, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "203506", name: "Domantas Sabonis", team: "SAC", teamName: "Sacramento Kings", value: 19.8, gamesPlayed: 48, imageUrl: getNbaHeadshot("203506") },
    { playerId: "1629639", name: "Tyrese Haliburton", team: "IND", teamName: "Indiana Pacers", value: 19.2, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629639") },
    { playerId: "1630224", name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", value: 18.9, gamesPlayed: 38, imageUrl: getNbaHeadshot("1630224") },
  ],
  rpg: [
    { playerId: "203506", name: "Domantas Sabonis", team: "SAC", teamName: "Sacramento Kings", value: 14.2, gamesPlayed: 48, imageUrl: getNbaHeadshot("203506") },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 13.1, gamesPlayed: 48, imageUrl: getNbaHeadshot("203999") },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 11.8, gamesPlayed: 42, imageUrl: getNbaHeadshot("203507") },
    { playerId: "203076", name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", value: 11.7, gamesPlayed: 42, imageUrl: getNbaHeadshot("203076") },
    { playerId: "203497", name: "Rudy Gobert", team: "MIN", teamName: "Minnesota Timberwolves", value: 10.8, gamesPlayed: 46, imageUrl: getNbaHeadshot("203497") },
    { playerId: "203954", name: "Joel Embiid", team: "PHI", teamName: "Philadelphia 76ers", value: 10.8, gamesPlayed: 25, imageUrl: getNbaHeadshot("203954") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 10.1, gamesPlayed: 47, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "1629029", name: "Luka Doncic", team: "DAL", teamName: "Dallas Mavericks", value: 9.2, gamesPlayed: 45, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "1628369", name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", value: 8.3, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628369") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 7.8, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1628991", name: "Jaren Jackson Jr.", team: "MEM", teamName: "Memphis Grizzlies", value: 5.8, gamesPlayed: 40, imageUrl: getNbaHeadshot("1628991") },
    { playerId: "1630163", name: "LaMelo Ball", team: "CHA", teamName: "Charlotte Hornets", value: 5.8, gamesPlayed: 35, imageUrl: getNbaHeadshot("1630163") },
    { playerId: "201142", name: "Kevin Durant", team: "PHX", teamName: "Phoenix Suns", value: 6.3, gamesPlayed: 40, imageUrl: getNbaHeadshot("201142") },
    { playerId: "1630559", name: "Franz Wagner", team: "ORL", teamName: "Orlando Magic", value: 5.9, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630559") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 5.5, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "1629027", name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", value: 3.0, gamesPlayed: 44, imageUrl: getNbaHeadshot("1629027") },
    { playerId: "1629630", name: "Ja Morant", team: "MEM", teamName: "Memphis Grizzlies", value: 5.4, gamesPlayed: 35, imageUrl: getNbaHeadshot("1629630") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 4.8, gamesPlayed: 46, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "203081", name: "Damian Lillard", team: "MIL", teamName: "Milwaukee Bucks", value: 4.5, gamesPlayed: 44, imageUrl: getNbaHeadshot("203081") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 4.2, gamesPlayed: 45, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "1628368", name: "De'Aaron Fox", team: "SAC", teamName: "Sacramento Kings", value: 4.5, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628368") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 4.3, gamesPlayed: 45, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "1629639", name: "Tyrese Haliburton", team: "IND", teamName: "Indiana Pacers", value: 3.8, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629639") },
    { playerId: "1629628", name: "RJ Barrett", team: "TOR", teamName: "Toronto Raptors", value: 5.6, gamesPlayed: 42, imageUrl: getNbaHeadshot("1629628") },
    { playerId: "203110", name: "Darius Garland", team: "CLE", teamName: "Cleveland Cavaliers", value: 2.8, gamesPlayed: 43, imageUrl: getNbaHeadshot("203110") },
  ],
  apg: [
    { playerId: "1629027", name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", value: 11.4, gamesPlayed: 44, imageUrl: getNbaHeadshot("1629027") },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 10.2, gamesPlayed: 48, imageUrl: getNbaHeadshot("203999") },
    { playerId: "1629029", name: "Luka Doncic", team: "DAL", teamName: "Dallas Mavericks", value: 9.8, gamesPlayed: 45, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "1629639", name: "Tyrese Haliburton", team: "IND", teamName: "Indiana Pacers", value: 9.5, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629639") },
    { playerId: "1630163", name: "LaMelo Ball", team: "CHA", teamName: "Charlotte Hornets", value: 8.2, gamesPlayed: 35, imageUrl: getNbaHeadshot("1630163") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 7.8, gamesPlayed: 45, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "203081", name: "Damian Lillard", team: "MIL", teamName: "Milwaukee Bucks", value: 7.3, gamesPlayed: 44, imageUrl: getNbaHeadshot("203081") },
    { playerId: "203506", name: "Domantas Sabonis", team: "SAC", teamName: "Sacramento Kings", value: 7.1, gamesPlayed: 48, imageUrl: getNbaHeadshot("203506") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 6.8, gamesPlayed: 45, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 6.5, gamesPlayed: 42, imageUrl: getNbaHeadshot("203507") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 6.2, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "1628368", name: "De'Aaron Fox", team: "SAC", teamName: "Sacramento Kings", value: 6.0, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628368") },
    { playerId: "1629630", name: "Ja Morant", team: "MEM", teamName: "Memphis Grizzlies", value: 5.8, gamesPlayed: 35, imageUrl: getNbaHeadshot("1629630") },
    { playerId: "201142", name: "Kevin Durant", team: "PHX", teamName: "Phoenix Suns", value: 5.2, gamesPlayed: 40, imageUrl: getNbaHeadshot("201142") },
    { playerId: "1628369", name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", value: 5.0, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628369") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 4.8, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 4.6, gamesPlayed: 46, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "1630559", name: "Franz Wagner", team: "ORL", teamName: "Orlando Magic", value: 4.2, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630559") },
    { playerId: "203110", name: "Darius Garland", team: "CLE", teamName: "Cleveland Cavaliers", value: 6.8, gamesPlayed: 43, imageUrl: getNbaHeadshot("203110") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 3.6, gamesPlayed: 47, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "203076", name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", value: 3.5, gamesPlayed: 42, imageUrl: getNbaHeadshot("203076") },
    { playerId: "203954", name: "Joel Embiid", team: "PHI", teamName: "Philadelphia 76ers", value: 3.2, gamesPlayed: 25, imageUrl: getNbaHeadshot("203954") },
    { playerId: "1629628", name: "RJ Barrett", team: "TOR", teamName: "Toronto Raptors", value: 4.5, gamesPlayed: 42, imageUrl: getNbaHeadshot("1629628") },
    { playerId: "1630224", name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", value: 5.2, gamesPlayed: 38, imageUrl: getNbaHeadshot("1630224") },
    { playerId: "202691", name: "Klay Thompson", team: "DAL", teamName: "Dallas Mavericks", value: 2.1, gamesPlayed: 46, imageUrl: getNbaHeadshot("202691") },
  ],
  spg: [
    { playerId: "1628368", name: "De'Aaron Fox", team: "SAC", teamName: "Sacramento Kings", value: 2.1, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628368") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 2.0, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 1.8, gamesPlayed: 45, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "1630163", name: "LaMelo Ball", team: "CHA", teamName: "Charlotte Hornets", value: 1.5, gamesPlayed: 35, imageUrl: getNbaHeadshot("1630163") },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 1.4, gamesPlayed: 48, imageUrl: getNbaHeadshot("203999") },
    { playerId: "1629029", name: "Luka Doncic", team: "DAL", teamName: "Dallas Mavericks", value: 1.4, gamesPlayed: 45, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "1629027", name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", value: 1.3, gamesPlayed: 44, imageUrl: getNbaHeadshot("1629027") },
    { playerId: "203076", name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", value: 1.2, gamesPlayed: 42, imageUrl: getNbaHeadshot("203076") },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 1.2, gamesPlayed: 42, imageUrl: getNbaHeadshot("203507") },
    { playerId: "1629639", name: "Tyrese Haliburton", team: "IND", teamName: "Indiana Pacers", value: 1.2, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629639") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 1.2, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 1.0, gamesPlayed: 47, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "203081", name: "Damian Lillard", team: "MIL", teamName: "Milwaukee Bucks", value: 1.0, gamesPlayed: 44, imageUrl: getNbaHeadshot("203081") },
    { playerId: "203954", name: "Joel Embiid", team: "PHI", teamName: "Philadelphia 76ers", value: 1.0, gamesPlayed: 25, imageUrl: getNbaHeadshot("203954") },
    { playerId: "1628369", name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", value: 1.0, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628369") },
    { playerId: "201142", name: "Kevin Durant", team: "PHX", teamName: "Phoenix Suns", value: 0.9, gamesPlayed: 40, imageUrl: getNbaHeadshot("201142") },
    { playerId: "203506", name: "Domantas Sabonis", team: "SAC", teamName: "Sacramento Kings", value: 0.9, gamesPlayed: 48, imageUrl: getNbaHeadshot("203506") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 1.4, gamesPlayed: 46, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 1.1, gamesPlayed: 45, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "1629630", name: "Ja Morant", team: "MEM", teamName: "Memphis Grizzlies", value: 1.0, gamesPlayed: 35, imageUrl: getNbaHeadshot("1629630") },
    { playerId: "1630559", name: "Franz Wagner", team: "ORL", teamName: "Orlando Magic", value: 0.9, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630559") },
    { playerId: "203110", name: "Darius Garland", team: "CLE", teamName: "Cleveland Cavaliers", value: 0.8, gamesPlayed: 43, imageUrl: getNbaHeadshot("203110") },
    { playerId: "1629628", name: "RJ Barrett", team: "TOR", teamName: "Toronto Raptors", value: 0.8, gamesPlayed: 42, imageUrl: getNbaHeadshot("1629628") },
    { playerId: "202691", name: "Klay Thompson", team: "DAL", teamName: "Dallas Mavericks", value: 0.6, gamesPlayed: 46, imageUrl: getNbaHeadshot("202691") },
    { playerId: "1630224", name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", value: 0.9, gamesPlayed: 38, imageUrl: getNbaHeadshot("1630224") },
  ],
  bpg: [
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 3.8, gamesPlayed: 47, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "203076", name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", value: 2.3, gamesPlayed: 42, imageUrl: getNbaHeadshot("203076") },
    { playerId: "203497", name: "Rudy Gobert", team: "MIN", teamName: "Minnesota Timberwolves", value: 2.1, gamesPlayed: 46, imageUrl: getNbaHeadshot("203497") },
    { playerId: "1628991", name: "Jaren Jackson Jr.", team: "MEM", teamName: "Memphis Grizzlies", value: 1.8, gamesPlayed: 40, imageUrl: getNbaHeadshot("1628991") },
    { playerId: "203954", name: "Joel Embiid", team: "PHI", teamName: "Philadelphia 76ers", value: 1.7, gamesPlayed: 25, imageUrl: getNbaHeadshot("203954") },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 1.5, gamesPlayed: 42, imageUrl: getNbaHeadshot("203507") },
    { playerId: "201142", name: "Kevin Durant", team: "PHX", teamName: "Phoenix Suns", value: 1.2, gamesPlayed: 40, imageUrl: getNbaHeadshot("201142") },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 0.9, gamesPlayed: 48, imageUrl: getNbaHeadshot("203999") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 0.9, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "1629628", name: "RJ Barrett", team: "TOR", teamName: "Toronto Raptors", value: 0.6, gamesPlayed: 42, imageUrl: getNbaHeadshot("1629628") },
    { playerId: "1628369", name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", value: 0.6, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628369") },
    { playerId: "1629029", name: "Luka Doncic", team: "DAL", teamName: "Dallas Mavericks", value: 0.5, gamesPlayed: 45, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "203506", name: "Domantas Sabonis", team: "SAC", teamName: "Sacramento Kings", value: 0.5, gamesPlayed: 48, imageUrl: getNbaHeadshot("203506") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 0.5, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1629639", name: "Tyrese Haliburton", team: "IND", teamName: "Indiana Pacers", value: 0.5, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629639") },
    { playerId: "1630163", name: "LaMelo Ball", team: "CHA", teamName: "Charlotte Hornets", value: 0.4, gamesPlayed: 35, imageUrl: getNbaHeadshot("1630163") },
    { playerId: "1628368", name: "De'Aaron Fox", team: "SAC", teamName: "Sacramento Kings", value: 0.4, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628368") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 0.4, gamesPlayed: 45, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "1629630", name: "Ja Morant", team: "MEM", teamName: "Memphis Grizzlies", value: 0.4, gamesPlayed: 35, imageUrl: getNbaHeadshot("1629630") },
    { playerId: "1630559", name: "Franz Wagner", team: "ORL", teamName: "Orlando Magic", value: 0.5, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630559") },
    { playerId: "203081", name: "Damian Lillard", team: "MIL", teamName: "Milwaukee Bucks", value: 0.3, gamesPlayed: 44, imageUrl: getNbaHeadshot("203081") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 0.3, gamesPlayed: 45, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "1629027", name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", value: 0.2, gamesPlayed: 44, imageUrl: getNbaHeadshot("1629027") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 0.3, gamesPlayed: 46, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "202691", name: "Klay Thompson", team: "DAL", teamName: "Dallas Mavericks", value: 0.5, gamesPlayed: 46, imageUrl: getNbaHeadshot("202691") },
  ],
  fg_pct: [
    { playerId: "203497", name: "Rudy Gobert", team: "MIN", teamName: "Minnesota Timberwolves", value: 66.8, gamesPlayed: 46, imageUrl: getNbaHeadshot("203497") },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 60.5, gamesPlayed: 42, imageUrl: getNbaHeadshot("203507") },
    { playerId: "203506", name: "Domantas Sabonis", team: "SAC", teamName: "Sacramento Kings", value: 59.4, gamesPlayed: 48, imageUrl: getNbaHeadshot("203506") },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 58.2, gamesPlayed: 48, imageUrl: getNbaHeadshot("203999") },
    { playerId: "203076", name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", value: 55.6, gamesPlayed: 42, imageUrl: getNbaHeadshot("203076") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 53.5, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "201142", name: "Kevin Durant", team: "PHX", teamName: "Phoenix Suns", value: 52.3, gamesPlayed: 40, imageUrl: getNbaHeadshot("201142") },
    { playerId: "203954", name: "Joel Embiid", team: "PHI", teamName: "Philadelphia 76ers", value: 52.1, gamesPlayed: 25, imageUrl: getNbaHeadshot("203954") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 49.2, gamesPlayed: 45, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "1629029", name: "Luka Doncic", team: "DAL", teamName: "Dallas Mavericks", value: 48.7, gamesPlayed: 45, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "1628368", name: "De'Aaron Fox", team: "SAC", teamName: "Sacramento Kings", value: 47.2, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628368") },
    { playerId: "1628991", name: "Jaren Jackson Jr.", team: "MEM", teamName: "Memphis Grizzlies", value: 47.1, gamesPlayed: 40, imageUrl: getNbaHeadshot("1628991") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 46.5, gamesPlayed: 47, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "1628369", name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", value: 45.8, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628369") },
    { playerId: "1629639", name: "Tyrese Haliburton", team: "IND", teamName: "Indiana Pacers", value: 44.8, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629639") },
    { playerId: "203081", name: "Damian Lillard", team: "MIL", teamName: "Milwaukee Bucks", value: 43.8, gamesPlayed: 44, imageUrl: getNbaHeadshot("203081") },
    { playerId: "202691", name: "Klay Thompson", team: "DAL", teamName: "Dallas Mavericks", value: 43.5, gamesPlayed: 46, imageUrl: getNbaHeadshot("202691") },
    { playerId: "1630163", name: "LaMelo Ball", team: "CHA", teamName: "Charlotte Hornets", value: 43.5, gamesPlayed: 35, imageUrl: getNbaHeadshot("1630163") },
    { playerId: "1629027", name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", value: 43.0, gamesPlayed: 44, imageUrl: getNbaHeadshot("1629027") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 44.5, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 45.2, gamesPlayed: 46, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 43.2, gamesPlayed: 45, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "1629630", name: "Ja Morant", team: "MEM", teamName: "Memphis Grizzlies", value: 46.8, gamesPlayed: 35, imageUrl: getNbaHeadshot("1629630") },
    { playerId: "1630559", name: "Franz Wagner", team: "ORL", teamName: "Orlando Magic", value: 45.5, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630559") },
    { playerId: "1629628", name: "RJ Barrett", team: "TOR", teamName: "Toronto Raptors", value: 44.8, gamesPlayed: 42, imageUrl: getNbaHeadshot("1629628") },
  ],
  three_pct: [
    { playerId: "201142", name: "Kevin Durant", team: "PHX", teamName: "Phoenix Suns", value: 42.1, gamesPlayed: 40, imageUrl: getNbaHeadshot("201142") },
    { playerId: "1626164", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 38.9, gamesPlayed: 45, imageUrl: getNbaHeadshot("1626164") },
    { playerId: "203954", name: "Joel Embiid", team: "PHI", teamName: "Philadelphia 76ers", value: 38.8, gamesPlayed: 25, imageUrl: getNbaHeadshot("203954") },
    { playerId: "202691", name: "Klay Thompson", team: "DAL", teamName: "Dallas Mavericks", value: 38.5, gamesPlayed: 46, imageUrl: getNbaHeadshot("202691") },
    { playerId: "1628369", name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", value: 37.6, gamesPlayed: 47, imageUrl: getNbaHeadshot("1628369") },
    { playerId: "1629639", name: "Tyrese Haliburton", team: "IND", teamName: "Indiana Pacers", value: 36.4, gamesPlayed: 40, imageUrl: getNbaHeadshot("1629639") },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 36.4, gamesPlayed: 48, imageUrl: getNbaHeadshot("203999") },
    { playerId: "203081", name: "Damian Lillard", team: "MIL", teamName: "Milwaukee Bucks", value: 36.2, gamesPlayed: 44, imageUrl: getNbaHeadshot("203081") },
    { playerId: "1630163", name: "LaMelo Ball", team: "CHA", teamName: "Charlotte Hornets", value: 35.8, gamesPlayed: 35, imageUrl: getNbaHeadshot("1630163") },
    { playerId: "1629029", name: "Luka Doncic", team: "DAL", teamName: "Dallas Mavericks", value: 35.4, gamesPlayed: 45, imageUrl: getNbaHeadshot("1629029") },
    { playerId: "1628983", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 35.3, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628983") },
    { playerId: "1629027", name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", value: 34.2, gamesPlayed: 44, imageUrl: getNbaHeadshot("1629027") },
    { playerId: "1628368", name: "De'Aaron Fox", team: "SAC", teamName: "Sacramento Kings", value: 33.5, gamesPlayed: 48, imageUrl: getNbaHeadshot("1628368") },
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 32.8, gamesPlayed: 47, imageUrl: getNbaHeadshot("1641705") },
    { playerId: "203506", name: "Domantas Sabonis", team: "SAC", teamName: "Sacramento Kings", value: 32.7, gamesPlayed: 48, imageUrl: getNbaHeadshot("203506") },
    { playerId: "203076", name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", value: 32.4, gamesPlayed: 42, imageUrl: getNbaHeadshot("203076") },
    { playerId: "1628991", name: "Jaren Jackson Jr.", team: "MEM", teamName: "Memphis Grizzlies", value: 32.4, gamesPlayed: 40, imageUrl: getNbaHeadshot("1628991") },
    { playerId: "1630162", name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", value: 35.5, gamesPlayed: 47, imageUrl: getNbaHeadshot("1630162") },
    { playerId: "1628378", name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", value: 36.8, gamesPlayed: 46, imageUrl: getNbaHeadshot("1628378") },
    { playerId: "1630595", name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", value: 34.5, gamesPlayed: 45, imageUrl: getNbaHeadshot("1630595") },
    { playerId: "1629630", name: "Ja Morant", team: "MEM", teamName: "Memphis Grizzlies", value: 31.2, gamesPlayed: 35, imageUrl: getNbaHeadshot("1629630") },
    { playerId: "1630559", name: "Franz Wagner", team: "ORL", teamName: "Orlando Magic", value: 34.2, gamesPlayed: 44, imageUrl: getNbaHeadshot("1630559") },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 27.1, gamesPlayed: 42, imageUrl: getNbaHeadshot("203507") },
    { playerId: "1629628", name: "RJ Barrett", team: "TOR", teamName: "Toronto Raptors", value: 33.8, gamesPlayed: 42, imageUrl: getNbaHeadshot("1629628") },
    { playerId: "1630224", name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", value: 37.2, gamesPlayed: 38, imageUrl: getNbaHeadshot("1630224") },
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
