import type { Metadata } from "next";
import { Header, Footer } from "@/components";
import AskLabClient from "./AskLabClient";

export const metadata: Metadata = {
  title: "Ask the Lab — Natural Language Stats",
  description:
    "Ask plain-English questions about basketball stats. Powered by AI-parsed queries over the full game log.",
  alternates: { canonical: "/stats/ask" },
};

const EXAMPLES = [
  "Show me every game where Jokic had 10+ assists",
  "LeBron's games with 30+ points and 8+ rebounds",
  "Wemby's games with 5+ blocks",
  "Curry's 3pt heavy games — 7+ threes",
];

export default function AskLabPage() {
  return (
    <>
      <Header />
      <main>
        <AskLabClient examples={EXAMPLES} />
      </main>
      <Footer />
    </>
  );
}
