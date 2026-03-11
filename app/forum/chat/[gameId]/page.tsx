"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components";
import LiveChatRoom from "@/components/forum/LiveChatRoom";

export default function GameChatPage() {
  const { gameId } = useParams() as { gameId: string };

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: "20px", fontSize: "13px" }}>
            <Link href="/forum" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Forum</Link>
            <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 8px" }}>/</span>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>Game Chat</span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-anton)",
            fontSize: "28px",
            color: "#FF6B35",
            margin: "0 0 20px 0",
            letterSpacing: "1px",
          }}>
            GAME DAY CHAT
          </h1>

          <LiveChatRoom gameId={gameId} />
        </div>
      </main>
      <Footer />
    </>
  );
}
