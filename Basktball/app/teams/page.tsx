"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  city: string;
  abbreviation: string;
  conference: string;
  division: string;
  logoUrl: string;
  record: string;
  winPct: number;
  league: string;
}

const mockTeams: Team[] = [
  // NBA - Eastern Conference
  { id: "nba-1", name: "Celtics", city: "Boston", abbreviation: "BOS", conference: "East", division: "Atlantic", logoUrl: "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg", record: "44-12", winPct: 0.786, league: "NBA" },
  { id: "nba-2", name: "Cavaliers", city: "Cleveland", abbreviation: "CLE", conference: "East", division: "Central", logoUrl: "https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg", record: "37-18", winPct: 0.673, league: "NBA" },
  { id: "nba-3", name: "Bucks", city: "Milwaukee", abbreviation: "MIL", conference: "East", division: "Central", logoUrl: "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg", record: "35-21", winPct: 0.625, league: "NBA" },
  { id: "nba-4", name: "Knicks", city: "New York", abbreviation: "NYK", conference: "East", division: "Atlantic", logoUrl: "https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg", record: "33-24", winPct: 0.579, league: "NBA" },
  { id: "nba-5", name: "Heat", city: "Miami", abbreviation: "MIA", conference: "East", division: "Southeast", logoUrl: "https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg", record: "31-25", winPct: 0.554, league: "NBA" },
  { id: "nba-6", name: "76ers", city: "Philadelphia", abbreviation: "PHI", conference: "East", division: "Atlantic", logoUrl: "https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg", record: "30-26", winPct: 0.536, league: "NBA" },
  { id: "nba-7", name: "Magic", city: "Orlando", abbreviation: "ORL", conference: "East", division: "Southeast", logoUrl: "https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg", record: "30-27", winPct: 0.526, league: "NBA" },
  { id: "nba-8", name: "Pacers", city: "Indiana", abbreviation: "IND", conference: "East", division: "Central", logoUrl: "https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg", record: "29-27", winPct: 0.518, league: "NBA" },
  { id: "nba-9", name: "Bulls", city: "Chicago", abbreviation: "CHI", conference: "East", division: "Central", logoUrl: "https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg", record: "27-29", winPct: 0.482, league: "NBA" },
  { id: "nba-10", name: "Hawks", city: "Atlanta", abbreviation: "ATL", conference: "East", division: "Southeast", logoUrl: "https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg", record: "26-30", winPct: 0.464, league: "NBA" },
  { id: "nba-11", name: "Nets", city: "Brooklyn", abbreviation: "BKN", conference: "East", division: "Atlantic", logoUrl: "https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg", record: "23-33", winPct: 0.411, league: "NBA" },
  { id: "nba-12", name: "Raptors", city: "Toronto", abbreviation: "TOR", conference: "East", division: "Atlantic", logoUrl: "https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg", record: "22-34", winPct: 0.393, league: "NBA" },
  { id: "nba-13", name: "Hornets", city: "Charlotte", abbreviation: "CHA", conference: "East", division: "Southeast", logoUrl: "https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg", record: "14-42", winPct: 0.250, league: "NBA" },
  { id: "nba-14", name: "Pistons", city: "Detroit", abbreviation: "DET", conference: "East", division: "Central", logoUrl: "https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg", record: "10-46", winPct: 0.179, league: "NBA" },
  { id: "nba-15", name: "Wizards", city: "Washington", abbreviation: "WAS", conference: "East", division: "Southeast", logoUrl: "https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg", record: "9-47", winPct: 0.161, league: "NBA" },
  // NBA - Western Conference
  { id: "nba-16", name: "Thunder", city: "Oklahoma City", abbreviation: "OKC", conference: "West", division: "Northwest", logoUrl: "https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg", record: "41-15", winPct: 0.732, league: "NBA" },
  { id: "nba-17", name: "Nuggets", city: "Denver", abbreviation: "DEN", conference: "West", division: "Northwest", logoUrl: "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg", record: "39-18", winPct: 0.684, league: "NBA" },
  { id: "nba-18", name: "Timberwolves", city: "Minnesota", abbreviation: "MIN", conference: "West", division: "Northwest", logoUrl: "https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg", record: "38-18", winPct: 0.679, league: "NBA" },
  { id: "nba-19", name: "Clippers", city: "Los Angeles", abbreviation: "LAC", conference: "West", division: "Pacific", logoUrl: "https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg", record: "36-18", winPct: 0.667, league: "NBA" },
  { id: "nba-20", name: "Mavericks", city: "Dallas", abbreviation: "DAL", conference: "West", division: "Southwest", logoUrl: "https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg", record: "34-22", winPct: 0.607, league: "NBA" },
  { id: "nba-21", name: "Suns", city: "Phoenix", abbreviation: "PHX", conference: "West", division: "Pacific", logoUrl: "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg", record: "33-24", winPct: 0.579, league: "NBA" },
  { id: "nba-22", name: "Lakers", city: "Los Angeles", abbreviation: "LAL", conference: "West", division: "Pacific", logoUrl: "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg", record: "32-25", winPct: 0.561, league: "NBA" },
  { id: "nba-23", name: "Kings", city: "Sacramento", abbreviation: "SAC", conference: "West", division: "Pacific", logoUrl: "https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg", record: "31-25", winPct: 0.554, league: "NBA" },
  { id: "nba-24", name: "Pelicans", city: "New Orleans", abbreviation: "NOP", conference: "West", division: "Southwest", logoUrl: "https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg", record: "30-26", winPct: 0.536, league: "NBA" },
  { id: "nba-25", name: "Warriors", city: "Golden State", abbreviation: "GSW", conference: "West", division: "Pacific", logoUrl: "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg", record: "28-28", winPct: 0.500, league: "NBA" },
  { id: "nba-26", name: "Rockets", city: "Houston", abbreviation: "HOU", conference: "West", division: "Southwest", logoUrl: "https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg", record: "27-29", winPct: 0.482, league: "NBA" },
  { id: "nba-27", name: "Jazz", city: "Utah", abbreviation: "UTA", conference: "West", division: "Northwest", logoUrl: "https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg", record: "26-30", winPct: 0.464, league: "NBA" },
  { id: "nba-28", name: "Grizzlies", city: "Memphis", abbreviation: "MEM", conference: "West", division: "Southwest", logoUrl: "https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg", record: "20-36", winPct: 0.357, league: "NBA" },
  { id: "nba-29", name: "Trail Blazers", city: "Portland", abbreviation: "POR", conference: "West", division: "Northwest", logoUrl: "https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg", record: "17-39", winPct: 0.304, league: "NBA" },
  { id: "nba-30", name: "Spurs", city: "San Antonio", abbreviation: "SAS", conference: "West", division: "Southwest", logoUrl: "https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg", record: "13-43", winPct: 0.232, league: "NBA" },
  // WNBA
  { id: "wnba-1", name: "Aces", city: "Las Vegas", abbreviation: "LVA", conference: "West", division: "Western", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661329/primary/L/logo.svg", record: "27-13", winPct: 0.675, league: "WNBA" },
  { id: "wnba-2", name: "Liberty", city: "New York", abbreviation: "NYL", conference: "East", division: "Eastern", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661313/primary/L/logo.svg", record: "26-14", winPct: 0.650, league: "WNBA" },
  { id: "wnba-3", name: "Sun", city: "Connecticut", abbreviation: "CON", conference: "East", division: "Eastern", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661320/primary/L/logo.svg", record: "25-15", winPct: 0.625, league: "WNBA" },
  { id: "wnba-4", name: "Lynx", city: "Minnesota", abbreviation: "MIN", conference: "West", division: "Western", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661324/primary/L/logo.svg", record: "24-16", winPct: 0.600, league: "WNBA" },
  { id: "wnba-5", name: "Storm", city: "Seattle", abbreviation: "SEA", conference: "West", division: "Western", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661328/primary/L/logo.svg", record: "22-18", winPct: 0.550, league: "WNBA" },
  { id: "wnba-6", name: "Mercury", city: "Phoenix", abbreviation: "PHO", conference: "West", division: "Western", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661317/primary/L/logo.svg", record: "21-19", winPct: 0.525, league: "WNBA" },
  { id: "wnba-7", name: "Fever", city: "Indiana", abbreviation: "IND", conference: "East", division: "Eastern", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661325/primary/L/logo.svg", record: "20-20", winPct: 0.500, league: "WNBA" },
  { id: "wnba-8", name: "Wings", city: "Dallas", abbreviation: "DAL", conference: "West", division: "Western", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661321/primary/L/logo.svg", record: "18-22", winPct: 0.450, league: "WNBA" },
  { id: "wnba-9", name: "Mystics", city: "Washington", abbreviation: "WAS", conference: "East", division: "Eastern", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661322/primary/L/logo.svg", record: "17-23", winPct: 0.425, league: "WNBA" },
  { id: "wnba-10", name: "Dream", city: "Atlanta", abbreviation: "ATL", conference: "East", division: "Eastern", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661319/primary/L/logo.svg", record: "16-24", winPct: 0.400, league: "WNBA" },
  { id: "wnba-11", name: "Sky", city: "Chicago", abbreviation: "CHI", conference: "East", division: "Eastern", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661323/primary/L/logo.svg", record: "15-25", winPct: 0.375, league: "WNBA" },
  { id: "wnba-12", name: "Sparks", city: "Los Angeles", abbreviation: "LAS", conference: "West", division: "Western", logoUrl: "https://cdn.wnba.com/logos/wnba/1611661314/primary/L/logo.svg", record: "12-28", winPct: 0.300, league: "WNBA" },
  // NCAA Men's (Top 16)
  { id: "ncaam-1", name: "Huskies", city: "UConn", abbreviation: "CONN", conference: "Big East", division: "Big East", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/41.png", record: "28-3", winPct: 0.903, league: "NCAA" },
  { id: "ncaam-2", name: "Boilermakers", city: "Purdue", abbreviation: "PUR", conference: "Big Ten", division: "Big Ten", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/2509.png", record: "27-4", winPct: 0.871, league: "NCAA" },
  { id: "ncaam-3", name: "Cougars", city: "Houston", abbreviation: "HOU", conference: "Big 12", division: "Big 12", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/248.png", record: "26-4", winPct: 0.867, league: "NCAA" },
  { id: "ncaam-4", name: "Volunteers", city: "Tennessee", abbreviation: "TENN", conference: "SEC", division: "SEC", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png", record: "24-6", winPct: 0.800, league: "NCAA" },
  { id: "ncaam-5", name: "Wildcats", city: "Arizona", abbreviation: "ARIZ", conference: "Pac-12", division: "Pac-12", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/12.png", record: "23-6", winPct: 0.793, league: "NCAA" },
  { id: "ncaam-6", name: "Tar Heels", city: "North Carolina", abbreviation: "UNC", conference: "ACC", division: "ACC", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/153.png", record: "23-7", winPct: 0.767, league: "NCAA" },
  { id: "ncaam-7", name: "Jayhawks", city: "Kansas", abbreviation: "KU", conference: "Big 12", division: "Big 12", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/2305.png", record: "22-7", winPct: 0.759, league: "NCAA" },
  { id: "ncaam-8", name: "Blue Devils", city: "Duke", abbreviation: "DUKE", conference: "ACC", division: "ACC", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/150.png", record: "22-8", winPct: 0.733, league: "NCAA" },
  { id: "ncaam-9", name: "Wildcats", city: "Kentucky", abbreviation: "UK", conference: "SEC", division: "SEC", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/96.png", record: "21-8", winPct: 0.724, league: "NCAA" },
  { id: "ncaam-10", name: "Tigers", city: "Auburn", abbreviation: "AUB", conference: "SEC", division: "SEC", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/2.png", record: "21-9", winPct: 0.700, league: "NCAA" },
  { id: "ncaam-11", name: "Marquette", city: "Marquette", abbreviation: "MARQ", conference: "Big East", division: "Big East", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/269.png", record: "20-9", winPct: 0.690, league: "NCAA" },
  { id: "ncaam-12", name: "Spartans", city: "Michigan State", abbreviation: "MSU", conference: "Big Ten", division: "Big Ten", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/127.png", record: "20-10", winPct: 0.667, league: "NCAA" },
  { id: "ncaam-13", name: "Cyclones", city: "Iowa State", abbreviation: "ISU", conference: "Big 12", division: "Big 12", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/66.png", record: "19-10", winPct: 0.655, league: "NCAA" },
  { id: "ncaam-14", name: "Bruins", city: "UCLA", abbreviation: "UCLA", conference: "Pac-12", division: "Pac-12", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/26.png", record: "19-11", winPct: 0.633, league: "NCAA" },
  { id: "ncaam-15", name: "Zags", city: "Gonzaga", abbreviation: "GONZ", conference: "WCC", division: "WCC", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/2250.png", record: "18-11", winPct: 0.621, league: "NCAA" },
  { id: "ncaam-16", name: "Illini", city: "Illinois", abbreviation: "ILL", conference: "Big Ten", division: "Big Ten", logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/356.png", record: "18-12", winPct: 0.600, league: "NCAA" },
  // EuroLeague (Top 12)
  { id: "euro-1", name: "Real Madrid", city: "Madrid", abbreviation: "RMA", conference: "Spain", division: "Liga ACB", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/MAD.png", record: "22-8", winPct: 0.733, league: "EuroLeague" },
  { id: "euro-2", name: "Olympiacos", city: "Piraeus", abbreviation: "OLY", conference: "Greece", division: "GBL", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/OLY.png", record: "21-9", winPct: 0.700, league: "EuroLeague" },
  { id: "euro-3", name: "Panathinaikos", city: "Athens", abbreviation: "PAN", conference: "Greece", division: "GBL", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/PAN.png", record: "20-10", winPct: 0.667, league: "EuroLeague" },
  { id: "euro-4", name: "FC Barcelona", city: "Barcelona", abbreviation: "BAR", conference: "Spain", division: "Liga ACB", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/BAR.png", record: "19-11", winPct: 0.633, league: "EuroLeague" },
  { id: "euro-5", name: "Fenerbahce", city: "Istanbul", abbreviation: "FEN", conference: "Turkey", division: "BSL", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/ULK.png", record: "18-12", winPct: 0.600, league: "EuroLeague" },
  { id: "euro-6", name: "Monaco", city: "Monaco", abbreviation: "MON", conference: "France", division: "LNB", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/MON.png", record: "17-13", winPct: 0.567, league: "EuroLeague" },
  { id: "euro-7", name: "Maccabi Tel Aviv", city: "Tel Aviv", abbreviation: "MTA", conference: "Israel", division: "ISL", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/MTA.png", record: "16-14", winPct: 0.533, league: "EuroLeague" },
  { id: "euro-8", name: "Bayern Munich", city: "Munich", abbreviation: "BAY", conference: "Germany", division: "BBL", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/MUN.png", record: "15-15", winPct: 0.500, league: "EuroLeague" },
  { id: "euro-9", name: "Partizan", city: "Belgrade", abbreviation: "PAR", conference: "Serbia", division: "ABA", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/PAR.png", record: "14-16", winPct: 0.467, league: "EuroLeague" },
  { id: "euro-10", name: "Virtus Bologna", city: "Bologna", abbreviation: "VIR", conference: "Italy", division: "LBA", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/VIR.png", record: "13-17", winPct: 0.433, league: "EuroLeague" },
  { id: "euro-11", name: "ALBA Berlin", city: "Berlin", abbreviation: "ALB", conference: "Germany", division: "BBL", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/ALB.png", record: "12-18", winPct: 0.400, league: "EuroLeague" },
  { id: "euro-12", name: "Crvena Zvezda", city: "Belgrade", abbreviation: "CZV", conference: "Serbia", division: "ABA", logoUrl: "https://www.euroleaguebasketball.net/wp-content/uploads/2020/08/RED.png", record: "11-19", winPct: 0.367, league: "EuroLeague" },
];

const leagues = ["NBA", "WNBA", "NCAA", "EuroLeague"];

export default function TeamsPage() {
  const [leagueFilter, setLeagueFilter] = useState("NBA");
  const [conferenceFilter, setConferenceFilter] = useState("ALL");

  const filteredTeams = mockTeams
    .filter((team) => leagueFilter === "ALL" || team.league === leagueFilter)
    .filter((team) => conferenceFilter === "ALL" || team.conference === conferenceFilter)
    .sort((a, b) => b.winPct - a.winPct);

  // Get conference options based on selected league
  const getConferenceOptions = () => {
    if (leagueFilter === "NBA") return ["ALL", "East", "West"];
    if (leagueFilter === "WNBA") return ["ALL", "East", "West"];
    return ["ALL"];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[var(--black)] flex flex-col">
        {/* Page Header */}
        <section className="bg-[var(--dark-gray)] py-6 md:py-8 border-b border-[var(--orange)]/30 mb-6 md:mb-8">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white mb-2">
              TEAMS
            </h1>
            <p className="text-white/70">
              Team standings across NBA, WNBA, NCAA & EuroLeague
            </p>
          </div>
        </section>

        {/* League & Conference Filters */}
        <section className="py-4 md:py-6 border-b border-[var(--border)] mb-8 md:mb-12">
          <div className="container-main">
            {/* League Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {leagues.map((league) => (
                <button
                  key={league}
                  onClick={() => {
                    setLeagueFilter(league);
                    setConferenceFilter("ALL");
                  }}
                  className={cn(
                    "px-6 py-2 font-semibold uppercase tracking-wider transition-colors",
                    leagueFilter === league
                      ? "bg-[var(--orange)] text-white"
                      : "bg-[var(--dark-gray)] text-white/60 hover:text-white"
                  )}
                >
                  {league}
                </button>
              ))}
            </div>
            {/* Conference Filter (only for NBA/WNBA) */}
            {(leagueFilter === "NBA" || leagueFilter === "WNBA") && (
              <div className="flex gap-2">
                {getConferenceOptions().map((conf) => (
                  <button
                    key={conf}
                    onClick={() => setConferenceFilter(conf)}
                    className={cn(
                      "px-4 py-1.5 text-sm font-semibold uppercase tracking-wider transition-colors",
                      conferenceFilter === conf
                        ? "bg-white/20 text-white"
                        : "bg-transparent text-white/50 hover:text-white"
                    )}
                  >
                    {conf === "ALL" ? "All" : `${conf}ern`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Teams Grid */}
        <section className="flex-1 py-8 md:py-12">
          <div className="container-main h-full">
            <div className={cn(
              "grid gap-4 md:gap-6",
              filteredTeams.length <= 12
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            )}>
              {filteredTeams.map((team, index) => (
                <Card key={team.id} variant="default" hover className="p-5 md:p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <span className="absolute -top-2 -left-2 w-7 h-7 bg-[var(--orange)] text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-20 h-20 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://via.placeholder.com/80/1a1a1a/F47B20?text=${team.abbreviation}`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-base truncate">{team.city} {team.name}</h3>
                      <p className="text-white/50 text-xs mt-0.5">
                        {team.league === "NBA" || team.league === "WNBA"
                          ? `${team.conference}ern • ${team.division}`
                          : `${team.conference}`}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="font-[family-name:var(--font-roboto-mono)] text-xl font-bold text-white">
                          {team.record}
                        </span>
                        <span className="text-white/50 text-sm">
                          ({(team.winPct * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
