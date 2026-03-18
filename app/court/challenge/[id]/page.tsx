"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Header, Footer } from "@/components";

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

interface ChallengeUser {
  id: string;
  displayName: string | null;
  name: string | null;
  avatarUrl: string | null;
  image: string | null;
  challengeWins: number;
  challengeLosses: number;
  predictionCount: number;
  correctPredictions: number;
}

interface ChallengeTake {
  id: string;
  content: string;
  fireCount: number;
  brickCount: number;
  createdAt: string;
  author: {
    id: string;
    displayName: string | null;
    name: string | null;
    avatarUrl: string | null;
    image: string | null;
  };
}

interface Challenge {
  id: string;
  topic: string;
  status: string;
  votesChallenger: number;
  votesChallenged: number;
  expiresAt: string;
  createdAt: string;
  challenger: ChallengeUser;
  challenged: ChallengeUser;
  winner: { id: string; displayName: string | null; name: string | null } | null;
  challengerTake: ChallengeTake | null;
  challengedTake: ChallengeTake | null;
  userVote: { votedForId: string } | null;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getStatusColor(status: string) {
  switch (status) {
    case "OPEN": return { bg: "rgba(59,130,246,0.15)", color: "#3B82F6" };
    case "ACTIVE": return { bg: "rgba(34,197,94,0.15)", color: "#22C55E" };
    case "VOTING": return { bg: "rgba(234,179,8,0.15)", color: "#EAB308" };
    case "COMPLETED": return { bg: "rgba(34,197,94,0.15)", color: "#22C55E" };
    case "EXPIRED": return { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" };
    case "DECLINED": return { bg: "rgba(239,68,68,0.15)", color: "#EF4444" };
    default: return { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" };
  }
}

function Avatar({ user, size = 48 }: { user: ChallengeUser | ChallengeTake["author"]; size?: number }) {
  const src = user.avatarUrl || user.image;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#FF6B35", display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff", fontWeight: 700,
      fontSize: size * 0.4, fontFamily: FONT,
    }}>
      {(user.displayName || user.name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default function ChallengeDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const challengeId = params?.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!challengeId) return;
    setLoading(true);
    fetch(`/api/court/challenges/${challengeId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Challenge not found" : "Failed to load");
        return res.json();
      })
      .then((data) => setChallenge(data.challenge))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [challengeId]);

  async function handleAccept() {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/court/challenges/${challengeId}/accept`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to accept");
      }
      const data = await res.json();
      setChallenge((prev) => prev ? { ...prev, ...data.challenge, userVote: prev.userVote } : prev);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDecline() {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/court/challenges/${challengeId}/decline`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to decline");
      }
      setChallenge((prev) => prev ? { ...prev, status: "DECLINED" } : prev);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVote(votedForId: string) {
    if (!session?.user) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/court/challenges/${challengeId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votedForId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to vote");
      }
      const data = await res.json();
      setChallenge((prev) => prev ? {
        ...prev,
        votesChallenger: data.challenge.votesChallenger,
        votesChallenged: data.challenge.votesChallenged,
        status: data.challenge.status,
        userVote: { votedForId },
      } : prev);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePostResponse() {
    if (!responseText.trim() || !challenge) return;
    setPosting(true);
    setActionError(null);
    try {
      // Post a take
      const takeRes = await fetch("/api/court/takes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: responseText.trim(), tags: ["challenge"] }),
      });
      if (!takeRes.ok) throw new Error("Failed to post take");
      const takeData = await takeRes.json();

      // Link the take to this challenge
      const currentUserId = (session?.user as { id?: string })?.id;
      const side = currentUserId === challenge.challenger.id ? "challenger" : "challenged";
      await fetch(`/api/court/challenges/${challengeId}/link-take`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ takeId: takeData.take.id, side }),
      });

      setResponseText("");
      // Refresh challenge
      const refreshRes = await fetch(`/api/court/challenges/${challengeId}`);
      const refreshData = await refreshRes.json();
      setChallenge(refreshData.challenge);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setPosting(false);
    }
  }

  const currentUserId = (session?.user as { id?: string })?.id;
  const isChallenged = challenge && currentUserId === challenge.challenged.id;
  const isChallenger = challenge && currentUserId === challenge.challenger.id;
  const isParticipant = isChallenged || isChallenger;
  const canAcceptDecline = isChallenged && challenge?.status === "OPEN";
  const canVote = challenge &&
    (challenge.status === "ACTIVE" || challenge.status === "VOTING") &&
    !challenge.userVote &&
    !isParticipant &&
    !!session?.user;

  const totalVotes = challenge ? challenge.votesChallenger + challenge.votesChallenged : 0;
  const challengerPct = totalVotes > 0 ? Math.round((challenge!.votesChallenger / totalVotes) * 100) : 50;
  const challengedPct = totalVotes > 0 ? 100 - challengerPct : 50;

  const statusInfo = challenge ? getStatusColor(challenge.status) : { bg: "", color: "" };

  return (
    <>
      <Header />
      <main style={{
        minHeight: "100vh",
        background: "#0D0D0D",
        padding: "100px 20px 60px",
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          {/* Back button */}
          <button
            onClick={() => router.back()}
            style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.5)",
              fontSize: "14px", cursor: "pointer", padding: "0", marginBottom: "20px",
              fontFamily: FONT, display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            <span style={{ fontSize: "18px" }}>&larr;</span> Back
          </button>

          {loading && (
            <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.4)" }}>
              Loading challenge...
            </div>
          )}

          {error && (
            <div style={{
              textAlign: "center", padding: "60px",
              color: "#EF4444", fontSize: "16px", fontFamily: FONT,
            }}>
              {error}
            </div>
          )}

          {challenge && (
            <div style={{
              background: "#1A1A1A",
              borderRadius: "16px",
              border: "1px solid #2a2a2a",
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                padding: "24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, padding: "3px 10px",
                    borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.5px",
                    background: statusInfo.bg, color: statusInfo.color,
                  }}>
                    {challenge.status}
                  </span>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", fontFamily: FONT }}>
                    {timeAgo(challenge.createdAt)}
                  </span>
                </div>

                <h1 style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "24px",
                  color: "#fff",
                  margin: "0 0 8px 0",
                  lineHeight: "1.2",
                  letterSpacing: "0.5px",
                }}>
                  {challenge.topic}
                </h1>

                {challenge.status === "OPEN" && (
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", fontFamily: FONT, margin: 0 }}>
                    Expires {new Date(challenge.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* VS Section */}
              <div style={{
                padding: "24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}>
                {/* Challenger */}
                <Link
                  href={`/user/${challenge.challenger.name}`}
                  style={{ flex: 1, textDecoration: "none", textAlign: "center" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <Avatar user={challenge.challenger} size={56} />
                    <div>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px", fontFamily: FONT }}>
                        {challenge.challenger.displayName || challenge.challenger.name}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", fontFamily: FONT }}>
                        {challenge.challenger.challengeWins}W - {challenge.challenger.challengeLosses}L
                      </div>
                    </div>
                  </div>
                </Link>

                {/* VS Badge */}
                <div style={{
                  background: "rgba(255,107,53,0.15)",
                  borderRadius: "50%",
                  width: "44px", height: "44px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "14px",
                    color: "#FF6B35",
                    letterSpacing: "1px",
                  }}>
                    VS
                  </span>
                </div>

                {/* Challenged */}
                <Link
                  href={`/user/${challenge.challenged.name}`}
                  style={{ flex: 1, textDecoration: "none", textAlign: "center" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <Avatar user={challenge.challenged} size={56} />
                    <div>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px", fontFamily: FONT }}>
                        {challenge.challenged.displayName || challenge.challenged.name}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", fontFamily: FONT }}>
                        {challenge.challenged.challengeWins}W - {challenge.challenged.challengeLosses}L
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Vote Progress Bar */}
              {totalVotes > 0 && (
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontFamily: FONT, fontSize: "13px" }}>
                    <span style={{ color: "#FF6B35", fontWeight: 600 }}>{challengerPct}%</span>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
                    <span style={{ color: "#3B82F6", fontWeight: 600 }}>{challengedPct}%</span>
                  </div>
                  <div style={{
                    height: "8px", borderRadius: "4px", background: "#333",
                    overflow: "hidden", display: "flex",
                  }}>
                    <div style={{
                      width: `${challengerPct}%`,
                      background: "linear-gradient(90deg, #FF6B35, #FF8F5E)",
                      borderRadius: "4px 0 0 4px",
                      transition: "width 0.3s ease",
                    }} />
                    <div style={{
                      width: `${challengedPct}%`,
                      background: "linear-gradient(90deg, #3B82F6, #60A5FA)",
                      borderRadius: "0 4px 4px 0",
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                </div>
              )}

              {/* Winner Banner */}
              {challenge.status === "COMPLETED" && challenge.winner && (
                <div style={{
                  padding: "16px 24px",
                  background: "rgba(34,197,94,0.1)",
                  borderBottom: "1px solid rgba(34,197,94,0.2)",
                  textAlign: "center",
                }}>
                  <span style={{ fontSize: "13px", color: "#22C55E", fontFamily: FONT, fontWeight: 600 }}>
                    Winner: {challenge.winner.displayName || challenge.winner.name}
                  </span>
                </div>
              )}

              {/* Linked Takes */}
              {(challenge.challengerTake || challenge.challengedTake) && (
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <h3 style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "12px", color: "rgba(255,255,255,0.5)",
                    margin: "0 0 12px 0", letterSpacing: "1px", textTransform: "uppercase",
                  }}>
                    Takes
                  </h3>
                  {challenge.challengerTake && (
                    <Link
                      href={`/court/take/${challenge.challengerTake.id}`}
                      style={{
                        display: "block", padding: "12px", background: "rgba(255,107,53,0.08)",
                        borderRadius: "8px", border: "1px solid rgba(255,107,53,0.15)",
                        textDecoration: "none", marginBottom: challenge.challengedTake ? "10px" : "0",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "#FF6B35", fontWeight: 600, marginBottom: "4px", fontFamily: FONT }}>
                        {challenge.challengerTake.author.displayName || challenge.challengerTake.author.name}
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: 0, lineHeight: "1.4", fontFamily: FONT }}>
                        {challenge.challengerTake.content}
                      </p>
                    </Link>
                  )}
                  {challenge.challengedTake && (
                    <Link
                      href={`/court/take/${challenge.challengedTake.id}`}
                      style={{
                        display: "block", padding: "12px", background: "rgba(59,130,246,0.08)",
                        borderRadius: "8px", border: "1px solid rgba(59,130,246,0.15)",
                        textDecoration: "none",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "#3B82F6", fontWeight: 600, marginBottom: "4px", fontFamily: FONT }}>
                        {challenge.challengedTake.author.displayName || challenge.challengedTake.author.name}
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: 0, lineHeight: "1.4", fontFamily: FONT }}>
                        {challenge.challengedTake.content}
                      </p>
                    </Link>
                  )}
                </div>
              )}

              {/* Action Area */}
              <div style={{ padding: "20px 24px" }}>
                {actionError && (
                  <div style={{
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "8px", padding: "10px 14px", marginBottom: "16px",
                    color: "#EF4444", fontSize: "13px", fontFamily: FONT,
                  }}>
                    {actionError}
                  </div>
                )}

                {/* Accept / Decline (for challenged user on OPEN challenges) */}
                {canAcceptDecline && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading}
                      style={{
                        flex: 1, padding: "14px", borderRadius: "10px", border: "none",
                        background: "#22C55E", color: "#fff", fontSize: "15px",
                        fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer",
                        fontFamily: FONT, opacity: actionLoading ? 0.6 : 1,
                      }}
                    >
                      {actionLoading ? "..." : "Accept Challenge"}
                    </button>
                    <button
                      onClick={handleDecline}
                      disabled={actionLoading}
                      style={{
                        flex: 1, padding: "14px", borderRadius: "10px",
                        border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)",
                        color: "#EF4444", fontSize: "15px", fontWeight: 700,
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        fontFamily: FONT, opacity: actionLoading ? 0.6 : 1,
                      }}
                    >
                      {actionLoading ? "..." : "Decline"}
                    </button>
                  </div>
                )}

                {/* Waiting message for challenger on OPEN */}
                {isChallenger && challenge.status === "OPEN" && (
                  <div style={{
                    textAlign: "center", padding: "12px",
                    background: "rgba(59,130,246,0.08)", borderRadius: "10px",
                    color: "rgba(255,255,255,0.5)", fontSize: "14px", fontFamily: FONT,
                  }}>
                    Waiting for {challenge.challenged.displayName || challenge.challenged.name} to respond...
                  </div>
                )}

                {/* Participant response area */}
                {isParticipant && (challenge.status === "ACTIVE" || challenge.status === "VOTING") && (
                  <div>
                    {isChallenger && !challenge.challengerTake && (
                      <p style={{ textAlign: "center", color: "#FF6B35", fontSize: "14px", margin: "0 0 12px 0", fontFamily: FONT, fontWeight: 600 }}>
                        Post your take to make your case
                      </p>
                    )}
                    {isChallenged && !challenge.challengedTake && (
                      <p style={{ textAlign: "center", color: "#FF6B35", fontSize: "14px", margin: "0 0 12px 0", fontFamily: FONT, fontWeight: 600 }}>
                        Post your response take
                      </p>
                    )}
                    {((isChallenger && !challenge.challengerTake) || (isChallenged && !challenge.challengedTake)) && (
                      <div>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Share your take on this challenge..."
                          maxLength={500}
                          style={{
                            width: "100%", minHeight: "80px", padding: "12px",
                            borderRadius: "10px", border: "1px solid #333",
                            background: "#111", color: "#fff", fontSize: "14px",
                            fontFamily: FONT, resize: "vertical", outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                        <button
                          onClick={handlePostResponse}
                          disabled={posting || !responseText.trim()}
                          style={{
                            width: "100%", padding: "14px", marginTop: "8px",
                            borderRadius: "10px", border: "none",
                            background: responseText.trim() ? "#FF6B35" : "rgba(255,107,53,0.3)",
                            color: "#fff", fontSize: "15px", fontWeight: 700,
                            cursor: posting || !responseText.trim() ? "not-allowed" : "pointer",
                            fontFamily: FONT, opacity: posting ? 0.6 : 1,
                          }}
                        >
                          {posting ? "Posting..." : "Post Response"}
                        </button>
                      </div>
                    )}
                    {((isChallenger && challenge.challengerTake) || (isChallenged && challenge.challengedTake)) && (
                      <div style={{
                        textAlign: "center", padding: "12px",
                        background: "rgba(34,197,94,0.08)", borderRadius: "10px",
                        color: "#22C55E", fontSize: "14px", fontFamily: FONT,
                      }}>
                        Your take is posted! Waiting for community votes.
                      </div>
                    )}
                  </div>
                )}

                {/* Vote buttons */}
                {canVote && (
                  <div>
                    <p style={{
                      textAlign: "center", color: "rgba(255,255,255,0.5)",
                      fontSize: "13px", margin: "0 0 12px 0", fontFamily: FONT,
                    }}>
                      Cast your vote
                    </p>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => handleVote(challenge.challenger.id)}
                        disabled={actionLoading}
                        style={{
                          flex: 1, padding: "14px", borderRadius: "10px",
                          border: "1px solid rgba(255,107,53,0.3)",
                          background: "rgba(255,107,53,0.1)", color: "#FF6B35",
                          fontSize: "14px", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer",
                          fontFamily: FONT, opacity: actionLoading ? 0.6 : 1,
                        }}
                      >
                        {challenge.challenger.displayName || challenge.challenger.name}
                      </button>
                      <button
                        onClick={() => handleVote(challenge.challenged.id)}
                        disabled={actionLoading}
                        style={{
                          flex: 1, padding: "14px", borderRadius: "10px",
                          border: "1px solid rgba(59,130,246,0.3)",
                          background: "rgba(59,130,246,0.1)", color: "#3B82F6",
                          fontSize: "14px", fontWeight: 700, cursor: actionLoading ? "not-allowed" : "pointer",
                          fontFamily: FONT, opacity: actionLoading ? 0.6 : 1,
                        }}
                      >
                        {challenge.challenged.displayName || challenge.challenged.name}
                      </button>
                    </div>
                  </div>
                )}

                {/* Already voted */}
                {challenge.userVote && (
                  <div style={{
                    textAlign: "center", padding: "12px",
                    background: "rgba(255,255,255,0.05)", borderRadius: "10px",
                    color: "rgba(255,255,255,0.4)", fontSize: "14px", fontFamily: FONT,
                  }}>
                    You voted for{" "}
                    <span style={{ color: "#fff", fontWeight: 600 }}>
                      {challenge.userVote.votedForId === challenge.challenger.id
                        ? challenge.challenger.displayName || challenge.challenger.name
                        : challenge.challenged.displayName || challenge.challenged.name}
                    </span>
                  </div>
                )}

                {/* Not logged in prompt */}
                {!session?.user && (challenge.status === "ACTIVE" || challenge.status === "VOTING") && (
                  <div style={{
                    textAlign: "center", padding: "12px",
                    background: "rgba(255,255,255,0.05)", borderRadius: "10px",
                    color: "rgba(255,255,255,0.4)", fontSize: "14px", fontFamily: FONT,
                  }}>
                    <Link href="/login" style={{ color: "#FF6B35", textDecoration: "none" }}>Sign in</Link> to vote on this challenge
                  </div>
                )}

                {/* Declined */}
                {challenge.status === "DECLINED" && (
                  <div style={{
                    textAlign: "center", padding: "12px",
                    background: "rgba(239,68,68,0.08)", borderRadius: "10px",
                    color: "rgba(255,255,255,0.4)", fontSize: "14px", fontFamily: FONT,
                  }}>
                    This challenge was declined
                  </div>
                )}

                {/* Expired */}
                {challenge.status === "EXPIRED" && (
                  <div style={{
                    textAlign: "center", padding: "12px",
                    background: "rgba(255,255,255,0.05)", borderRadius: "10px",
                    color: "rgba(255,255,255,0.4)", fontSize: "14px", fontFamily: FONT,
                  }}>
                    This challenge expired without a winner
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
