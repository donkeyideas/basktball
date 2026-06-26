import type { Metadata } from "next";
import { getStandings } from "@/lib/standings/standings";
import StandingsClient from "./StandingsClient";

export const revalidate = 900;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export const metadata: Metadata = {
  title: "Basketball Standings — NBA, WNBA & College",
  description:
    "Up-to-date NBA, WNBA and NCAA basketball standings. Conference and division records, win percentage, games behind, streaks and last-10 form for every team.",
  alternates: { canonical: "/standings" },
  openGraph: {
    title: "Basketball Standings — NBA, WNBA & College",
    description:
      "Up-to-date NBA, WNBA and NCAA standings with records, win percentage, games behind and streaks.",
    url: `${BASE_URL}/standings`,
    type: "website",
  },
};

export default async function StandingsPage() {
  let initialData: { success: boolean; league: string; conferences: NonNullable<Awaited<ReturnType<typeof getStandings>>> } | null = null;
  try {
    const conferences = await getStandings("nba");
    if (conferences) {
      initialData = { success: true, league: "nba", conferences };
    }
  } catch (error) {
    console.error("Standings page: failed to load standings:", error);
  }

  return <StandingsClient initialData={initialData} />;
}
