import type { Metadata } from "next";
import { Header, Footer } from "@/components";
import StudioTabs from "./StudioTabs";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.basktball.com";

export const metadata: Metadata = {
  title: "Studio — The Lab + Take Cards | BASKTBALL",
  description:
    "Two new ways to flex. Ask any basketball question in plain English with The Lab, then turn the answer into a shareable stat card. Five templates, three themes, AI captions.",
  openGraph: {
    title: "BASKTBALL Studio — The Lab + Take Cards",
    description:
      "Plain-English stat queries and one-tap shareable stat cards. Two ways to flex, one place.",
    url: `${BASE_URL}/cards`,
    siteName: "BASKTBALL",
    images: [
      {
        url: `${BASE_URL}/api/og/card?theme=orange&template=stat-line&num=19&unit=REBOUNDS&headline=JOKIC%20DROPS%20A%2019-BOARD%20TRIPLE-DOUBLE&context=Nikola%20Jokic%20grabbed%2019%20boards%20in%20Denver%27s%20win%20%E2%80%94%20his%2015th%20career%20triple-double%20vs%20LAL.&meta=DEN%20121%20%20LAL%20108&brand=BASKTBALL`,
        width: 1024,
        height: 1280,
        alt: "Sample Basktball Take Card",
      },
    ],
  },
};

type SearchParams = Promise<{ tab?: string | string[] }>;

export default async function StudioPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialTab: "cards" | "lab" = raw === "lab" ? "lab" : "cards";

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <StudioTabs initialTab={initialTab} />
      </main>
      <Footer />
    </>
  );
}
