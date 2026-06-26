import type { Metadata } from "next";
import { getTransformedGames } from "@/lib/games/transform";
import LiveClient from "./LiveClient";

// SSR snapshot of live games; refreshed every 30s
export const revalidate = 30;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export const metadata: Metadata = {
  title: "Live Basketball Scores — NBA & WNBA Real-Time",
  description:
    "Live NBA and WNBA basketball scores updated in real-time. Follow in-progress games, quarter-by-quarter updates, and final results as they happen.",
  alternates: { canonical: "/live" },
  openGraph: {
    title: "Live Basketball Scores — NBA & WNBA Real-Time",
    description:
      "Live NBA and WNBA scores updated in real-time with quarter-by-quarter updates and final results.",
    url: `${BASE_URL}/live`,
    type: "website",
  },
};

export default async function LivePage() {
  const initialGames = await getTransformedGames("nba");
  return <LiveClient initialGames={initialGames} />;
}
