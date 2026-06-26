import type { Metadata } from "next";
import { basketballApi } from "@/lib/api";
import ScheduleClient from "./ScheduleClient";

// SSR the current NBA week; refresh hourly
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export const metadata: Metadata = {
  title: "Basketball Schedule — NBA, WNBA & College Weekly Games",
  description:
    "Weekly basketball schedule for the NBA, WNBA and NCAA. Browse upcoming games, tip-off times, results and full week-by-week matchups.",
  alternates: { canonical: "/schedule" },
  openGraph: {
    title: "Basketball Schedule — NBA, WNBA & College Weekly Games",
    description:
      "Weekly NBA, WNBA and NCAA basketball schedule with tip-off times, results and matchups.",
    url: `${BASE_URL}/schedule`,
    type: "website",
  },
};

interface ScheduleGame {
  id: string;
  homeTeam: { id: string; name: string; abbreviation: string; logoUrl: string };
  awayTeam: { id: string; name: string; abbreviation: string; logoUrl: string };
  homeScore: number | null;
  awayScore: number | null;
  status: "final" | "live" | "scheduled";
  quarter?: string;
  clock?: string;
  gameDate: string;
  broadcast?: string;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default async function SchedulePage() {
  const monday = getMonday(new Date());
  const dates = Array.from({ length: 7 }, (_, i) => formatDate(addDays(monday, i)));

  const initialWeekData = await Promise.all(
    dates.map(async (date) => {
      try {
        const games = await basketballApi.getGames("nba", date);
        const mapped: ScheduleGame[] = games.map((g) => ({
          id: g.id,
          homeTeam: {
            id: g.homeTeam.id,
            name: g.homeTeam.name,
            abbreviation: g.homeTeam.abbreviation,
            logoUrl: g.homeTeam.logoUrl || "",
          },
          awayTeam: {
            id: g.awayTeam.id,
            name: g.awayTeam.name,
            abbreviation: g.awayTeam.abbreviation,
            logoUrl: g.awayTeam.logoUrl || "",
          },
          homeScore: g.homeScore,
          awayScore: g.awayScore,
          status: g.status,
          quarter: g.quarter,
          clock: g.clock,
          gameDate: g.gameDate instanceof Date ? g.gameDate.toISOString() : String(g.gameDate),
          broadcast: g.broadcast,
        }));
        return { date, games: mapped };
      } catch {
        return { date, games: [] as ScheduleGame[] };
      }
    })
  );

  return <ScheduleClient initialWeekData={initialWeekData} />;
}
