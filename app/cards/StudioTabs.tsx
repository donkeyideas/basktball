"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FAQ } from "@/components";
import AskLabClient from "../stats/ask/AskLabClient";
import TakeCardEditor, { type CardState } from "../share/take/Editor";

const DEFAULT_CARD_STATE: CardState = {
  theme: "orange",
  template: "stat-line",
  tag: "STAT LINE",
  num: "36",
  unit: "POINTS",
  headline: "",
  context:
    "Shai Gilgeous-Alexander dropped 36 in OKC's series-clinching win — his 8th 30-point playoff game this run.",
  meta: "OKC 124  MIN 118  ·  WCF GAME 5",
  handle: "basktball",
  avatar: "BB",
  avatarUrl: "",
  brand: "BASKTBALL.COM",
  sourceUrl: "",
};

const SAMPLE_QUERIES = [
  "Show me every game where Jokic had 10+ assists",
  "LeBron games with 30+ points this season",
  "Curry games with 7+ threes on the road",
  "Wembanyama games with 5+ blocks",
  "Anthony Edwards 40-point games in the playoffs",
  "Tatum games against the Lakers with 25+",
];

const CARDS_FAQ = [
  {
    question: "Do I need an account to make a card?",
    answer:
      "You can preview and design cards anonymously. To save, post to The Court, or share with attribution to your handle, you'll need to sign in.",
  },
  {
    question: "Where do shared cards show up?",
    answer:
      "When you publish, the card lands on your Basktball Profile and the public Court feed automatically. You can also share to X, Instagram, Facebook, or Reddit with one tap — every share carries an attribution back to your handle.",
  },
  {
    question: "Can I edit the headline and stats?",
    answer:
      "Yes. Every field on the card is editable — the big number, the unit, the headline, the context paragraph, and the meta line at the bottom. Five templates and three themes (Light, Dark, Brand) give you the look you want.",
  },
  {
    question: "How are the AI captions generated?",
    answer:
      "When you share, we draft three tonal options — Analytical, Hot Take, and Short — based on your card's content. Pick the one that fits the post, edit it inline if you want, then send.",
  },
];

const LAB_FAQ = [
  {
    question: "What's The Lab actually doing under the hood?",
    answer:
      "You type a question in plain English. We send it to an AI parser that identifies the player, the stat condition, and any filters (opponent strength, home/away, date range). Then we run that as a query against ESPN game-log data and return the matching games with full box scores.",
  },
  {
    question: "What kinds of questions can I ask?",
    answer:
      "Anything that combines a player, a stat threshold, and optional filters. Examples: \"Curry games with 7+ threes vs the West,\" \"LeBron triple-doubles in the playoffs,\" \"Wembanyama games with 5+ blocks at home.\" The Lab supports NBA, WNBA, and NCAA Division I.",
  },
  {
    question: "Can I save queries?",
    answer:
      "Yes — if you're signed in, you can save a query and we'll push you a notification when new games match. Great for tracking streaks or milestones in real time.",
  },
  {
    question: "Can I turn a result into a Take Card?",
    answer:
      "Yes. Every result has a 'Share as Card' button that pre-fills the Take Card editor with the player, stat, and matchup. One tap to design, one tap to post.",
  },
];

type Tab = "cards" | "lab";

export default function StudioTabs({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    const target = next === "lab" ? "/cards?tab=lab" : "/cards";
    startTransition(() => {
      router.replace(target, { scroll: false });
    });
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Tab switcher */}
      <div
        role="tablist"
        aria-label="Studio sections"
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <TabButton active={tab === "cards"} onClick={() => switchTab("cards")} label="TAKE CARDS" />
        <TabButton active={tab === "lab"} onClick={() => switchTab("lab")} label="THE LAB" />
      </div>

      {tab === "cards" ? (
        <section role="tabpanel" aria-label="Take Cards">
          <CardsContent />
          <div style={{ maxWidth: "1200px", margin: "60px auto 0", padding: "0 20px" }}>
            <FAQ items={CARDS_FAQ} />
          </div>
        </section>
      ) : (
        <section role="tabpanel" aria-label="The Lab">
          <LabContent />
          <div style={{ maxWidth: "1200px", margin: "60px auto 0", padding: "0 20px" }}>
            <FAQ items={LAB_FAQ} />
          </div>
        </section>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: "12px 28px",
        background: active ? "var(--orange)" : "var(--bg-secondary)",
        color: active ? "#fff" : "var(--text-primary)",
        border: `1px solid ${active ? "var(--orange)" : "var(--border-color)"}`,
        borderRadius: "10px",
        fontFamily: "var(--font-anton), Anton, sans-serif",
        fontSize: "18px",
        letterSpacing: "2px",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}

function CardsContent() {
  const { data: session, status } = useSession();
  // Use the same value on server and client to avoid hydration mismatch.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.basktball.com";

  if (status === "loading") {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
        Loading editor…
      </div>
    );
  }

  if (!session?.user) {
    return <SignInGate />;
  }

  // Compute initials from displayName if available (e.g. "John Doe" -> "JD"),
  // otherwise from the first two chars of the username.
  const nameSource = (session.user.name || "").trim();
  const parts = nameSource.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : nameSource.slice(0, 2).toUpperCase() || "BB";

  const initial: CardState = {
    ...DEFAULT_CARD_STATE,
    handle: (session.user.name || DEFAULT_CARD_STATE.handle).replace(/^@/, ""),
    avatar: initials,
    avatarUrl: session.user.image || "",
  };

  return (
    <div style={{ margin: "0 -20px" }}>
      <TakeCardEditor initial={initial} baseUrl={baseUrl} embedded />
    </div>
  );
}

function SignInGate() {
  return (
    <div
      style={{
        maxWidth: "560px",
        margin: "40px auto 60px",
        padding: "48px 32px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "4px 12px",
          border: "1px solid var(--orange)",
          color: "var(--orange)",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "12px",
          letterSpacing: "2px",
          marginBottom: "20px",
          borderRadius: "4px",
        }}
      >
        SIGN IN REQUIRED
      </div>
      <h2
        style={{
          fontFamily: "var(--font-anton), Anton, sans-serif",
          fontSize: "36px",
          lineHeight: 1.1,
          marginBottom: "14px",
        }}
      >
        SIGN IN TO MAKE A CARD
      </h2>
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "15px",
          lineHeight: 1.55,
          marginBottom: "28px",
        }}
      >
        Take Cards post to your profile and The Court, and every share carries an attribution back
        to your handle — so we need to know who you are before you build one.
      </p>
      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/login?callbackUrl=/cards"
          className="btn btn-primary"
          style={{ fontSize: "15px", padding: "12px 28px" }}
        >
          Sign In
        </Link>
        <Link
          href="/register"
          style={{
            display: "inline-block",
            fontSize: "15px",
            padding: "12px 28px",
            background: "transparent",
            border: "1px solid var(--orange)",
            color: "var(--orange)",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

function LabContent() {
  return (
    <div style={{ margin: "0 -20px" }}>
      <AskLabClient examples={SAMPLE_QUERIES} />
    </div>
  );
}
