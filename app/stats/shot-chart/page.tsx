import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { Header, Footer } from "@/components";
import ShotChartClient from "./ShotChartClient";

export const metadata: Metadata = {
  title: "Shot Chart — Deep Stats",
  description:
    "Hex shot charts, zone breakdowns, and shooting efficiency for every NBA and WNBA player.",
  alternates: { canonical: "/stats/shot-chart" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function getInitialPlayer(playerId: string | undefined) {
  if (!playerId) {
    // Pick a popular active player as default
    const player = await prisma.player.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        position: true,
        jerseyNum: true,
        headshotUrl: true,
        team: { select: { id: true, name: true, abbreviation: true } },
      },
      orderBy: { name: "asc" },
    });
    return player;
  }
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      name: true,
      position: true,
      jerseyNum: true,
      headshotUrl: true,
      team: { select: { id: true, name: true, abbreviation: true } },
    },
  });
  return player;
}

export default async function ShotChartPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const playerId = typeof params.playerId === "string" ? params.playerId : undefined;
  const player = await getInitialPlayer(playerId);

  return (
    <>
      <Header />
      <ShotChartClient initialPlayer={player} />
      <Footer />
    </>
  );
}
