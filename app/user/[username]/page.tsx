"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Header, Footer } from "@/components";
import TakeCard, { Take } from "@/components/court/TakeCard";

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

interface UserProfile {
  id: string;
  name: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  image: string | null;
  location: string | null;
  role: string;
  takeCount: number;
  followerCount: number;
  followingCount: number;
  challengeWins: number;
  challengeLosses: number;
  predictionCount: number;
  correctPredictions: number;
  createdAt: string;
}

interface Prediction {
  id: string;
  claim: string;
  status: string;
  result: string | null;
  createdAt: string;
  take?: { id: string; content: string };
  game?: {
    homeTeam: { name: string; abbreviation: string };
    awayTeam: { name: string; abbreviation: string };
    homeScore: number | null;
    awayScore: number | null;
    status: string;
  } | null;
}

interface AgingTake {
  id: string;
  revisitDate: string;
  status: string;
  resurfacedAt: string | null;
  createdAt: string;
  take: {
    id: string;
    content: string;
    createdAt: string;
    fireCount: number;
    brickCount: number;
    replyCount: number;
    author: { id: string; name: string; displayName: string; avatarUrl: string | null; image: string | null };
  };
}

interface Challenge {
  id: string;
  topic: string;
  status: string;
  votesChallenger: number;
  votesChallenged: number;
  createdAt: string;
  challenger: { id: string; displayName: string | null; name: string; avatarUrl: string | null; image: string | null };
  challenged: { id: string; displayName: string | null; name: string; avatarUrl: string | null; image: string | null };
}

interface LiveGame {
  id: string;
  homeTeam: { abbreviation: string; logoUrl?: string };
  awayTeam: { abbreviation: string; logoUrl?: string };
  homeScore: number;
  awayScore: number;
  status: string;
  quarter?: string;
  clock?: string;
}

interface NewsArticle {
  id: string;
  title: string;
  link: string;
  imageUrl?: string;
  source: string;
}

type Tab = "takes" | "replies" | "challenges" | "predictions" | "aging" | "saved";

export default function UserProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const username = params.username as string;
  const currentUserId = (session?.user as { id?: string })?.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("takes");

  // Tab data
  const [takes, setTakes] = useState<Take[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [agingTakes, setAgingTakes] = useState<AgingTake[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Sidebar data
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<{ id: string; topic: string; status: string; challenger: { displayName: string | null; name: string }; challenged: { displayName: string | null; name: string }; votesChallenger: number; votesChallenged: number }[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) {
        if (res.status === 404) { setProfile(null); setLoading(false); return; }
        throw new Error("Failed to load profile");
      }
      const data = await res.json();
      setProfile(data.user);
      setIsFollowing(data.isFollowing);
      setIsSelf(data.isSelf);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Fetch sidebar data
  useEffect(() => {
    async function fetchSidebar() {
      try {
        const [gamesRes, newsRes, challengesRes] = await Promise.all([
          fetch("/api/games/live"),
          fetch("/api/news?limit=4"),
          fetch("/api/court/challenges?limit=5"),
        ]);
        const gamesData = await gamesRes.json();
        if (gamesData.success) setLiveGames(gamesData.games || []);
        const newsData = await newsRes.json();
        setNewsArticles(newsData.articles || []);
        const challengesData = await challengesRes.json();
        setActiveChallenges(challengesData.challenges || []);
      } catch { /* ignore */ }
    }
    fetchSidebar();
  }, []);

  const fetchTabData = useCallback(async () => {
    if (!profile) return;
    setTabLoading(true);
    try {
      if (activeTab === "takes" || activeTab === "replies") {
        const res = await fetch(`/api/users/${username}/takes?type=${activeTab}`);
        const data = await res.json();
        setTakes(data.takes || []);
      } else if (activeTab === "predictions") {
        const res = await fetch(`/api/users/${username}/predictions`);
        const data = await res.json();
        setPredictions(data.predictions || []);
      } else if (activeTab === "aging") {
        const res = await fetch(`/api/users/${username}/aging-takes`);
        const data = await res.json();
        setAgingTakes(data.agingTakes || []);
      } else if (activeTab === "challenges") {
        const res = await fetch(`/api/users/${username}/challenges`);
        const data = await res.json();
        setChallenges(data.challenges || []);
      } else if (activeTab === "saved") {
        const res = await fetch(`/api/users/${username}/takes?type=takes`);
        const data = await res.json();
        setTakes(data.takes || []);
      }
    } catch { /* ignore */ } finally {
      setTabLoading(false);
    }
  }, [activeTab, profile, username]);

  useEffect(() => { fetchTabData(); }, [fetchTabData]);

  async function handleFollow() {
    if (!profile || !currentUserId) return;
    setFollowLoading(true);
    try {
      const res = await fetch("/api/court/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: profile.id }),
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setProfile((p) => p ? { ...p, followerCount: p.followerCount + (isFollowing ? -1 : 1) } : null);
      }
    } catch { /* ignore */ } finally {
      setFollowLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: "700px", margin: "0 auto", padding: "80px 20px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
          Loading profile...
        </main>
        <Footer />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <main style={{ maxWidth: "700px", margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: "24px", marginBottom: "8px" }}>User not found</h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>This user doesn&apos;t exist or has been deactivated.</p>
          <Link href="/court" style={{ color: "#F97316", marginTop: "16px", display: "inline-block" }}>Back to The Court</Link>
        </main>
        <Footer />
      </>
    );
  }

  const avatarSrc = profile.avatarUrl || profile.image;
  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "takes", label: "TAKES", show: true },
    { key: "replies", label: "REPLIES", show: true },
    { key: "challenges", label: "CHALLENGES", show: true },
    { key: "predictions", label: "PREDICTIONS", show: true },
    { key: "aging", label: "AGING TAKES", show: true },
    { key: "saved", label: "SAVED", show: isSelf },
  ];

  const predictionAccuracy = profile.predictionCount > 0
    ? Math.round((profile.correctPredictions / profile.predictionCount) * 100)
    : 0;

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px", fontSize: "15px", fontFamily: FONT }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          <div className="profile-grid" style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr 320px",
            gap: "28px",
            alignItems: "start",
          }}>
            {/* ===== LEFT SIDEBAR: Profile Info ===== */}
            <div className="profile-left-sidebar" style={{ position: "sticky", top: "140px" }}>
              <div style={{
                background: "#1A1A1A",
                borderRadius: "12px",
                border: "1px solid #2a2a2a",
                padding: "20px",
              }}>
                {/* Avatar */}
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: avatarSrc ? `url(${avatarSrc}) center/cover` : "linear-gradient(135deg, #F97316, #EAB308)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "32px",
                    fontFamily: "var(--font-anton), sans-serif",
                    margin: "0 auto",
                  }}>
                    {!avatarSrc && (profile.displayName || profile.name).charAt(0).toUpperCase()}
                  </div>
                  <h1 style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "var(--font-anton), sans-serif",
                    letterSpacing: "0.5px",
                    marginTop: "12px",
                    marginBottom: "2px",
                  }}>
                    {profile.displayName || profile.name}
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>@{profile.name}</p>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: "1.5", marginBottom: "12px", textAlign: "center" }}>
                    {profile.bio}
                  </p>
                )}

                {/* Location */}
                {profile.location && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "14px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{profile.location}</span>
                  </div>
                )}

                {/* Follow / Edit Button */}
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  {!isSelf && currentUserId && (
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      style={{
                        background: isFollowing ? "transparent" : "#F97316",
                        color: isFollowing ? "#F97316" : "#fff",
                        border: isFollowing ? "1px solid #F97316" : "none",
                        borderRadius: "20px",
                        padding: "8px 32px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        fontFamily: "var(--font-inter), sans-serif",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        width: "100%",
                      }}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                  {isSelf && (
                    <Link
                      href="/profile"
                      style={{
                        display: "block",
                        background: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "20px",
                        padding: "8px 20px",
                        fontWeight: 600,
                        fontSize: "13px",
                        textDecoration: "none",
                        fontFamily: "var(--font-inter), sans-serif",
                        textAlign: "center",
                      }}
                    >
                      Edit Profile
                    </Link>
                  )}
                </div>

                {/* Stats Grid */}
                <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {[
                      { label: "Takes", value: profile.takeCount },
                      { label: "Followers", value: profile.followerCount },
                      { label: "Following", value: profile.followingCount },
                      { label: "W-L", value: `${profile.challengeWins}-${profile.challengeLosses}` },
                    ].map((stat) => (
                      <div key={stat.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-inter)" }}>
                          {stat.value}
                        </div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "var(--font-inter)" }}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  {profile.predictionCount > 0 && (
                    <div style={{ textAlign: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #2a2a2a" }}>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#22C55E", fontFamily: "var(--font-inter)" }}>
                        {predictionAccuracy}%
                      </div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "var(--font-inter)" }}>
                        Prediction Accuracy
                      </div>
                    </div>
                  )}
                </div>

                {/* Member Since */}
                <div style={{ borderTop: "1px solid #2a2a2a", marginTop: "14px", paddingTop: "12px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                    Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* ===== CENTER: Tabs + Content ===== */}
            <div>
              {/* Sticky Tabs */}
              <div style={{ position: "sticky", top: "140px", zIndex: 20 }}>
                <div style={{
                  display: "flex",
                  gap: "0",
                  background: "#1A1A1A",
                  borderRadius: "12px 12px 0 0",
                  border: "1px solid #2a2a2a",
                  borderBottom: "none",
                  overflowX: "auto",
                }}>
                  {tabs.filter((t) => t.show).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        background: "none",
                        border: "none",
                        borderBottom: activeTab === tab.key ? "2px solid #F97316" : "2px solid transparent",
                        padding: "14px 18px",
                        color: activeTab === tab.key ? "#F97316" : "rgba(255,255,255,0.5)",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "var(--font-inter), sans-serif",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                        marginBottom: "-2px",
                        transition: "color 0.15s ease",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div style={{
                background: "#1A1A1A",
                borderRadius: "0 0 12px 12px",
                border: "1px solid #2a2a2a",
                borderTop: "none",
                overflow: "hidden",
              }}>
              {tabLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)" }}>Loading...</div>
              ) : (
                <>
                  {(activeTab === "takes" || activeTab === "replies" || activeTab === "saved") && (
                    <div>
                      {takes.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
                          No {activeTab} yet
                        </div>
                      ) : (
                        takes.map((take) => (
                          <TakeCard key={take.id} take={take} currentUserId={currentUserId} />
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "predictions" && (
                    <div>
                      {predictions.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>No predictions yet</div>
                      ) : (
                        predictions.map((p) => (
                          <Link
                            key={p.id}
                            href={p.take ? `/court/take/${p.take.id}` : "#"}
                            style={{ display: "block", padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", textDecoration: "none" }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                              <span style={{
                                fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase",
                                background: p.status === "RECEIPT" ? "rgba(34,197,94,0.2)" : p.status === "BUST" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)",
                                color: p.status === "RECEIPT" ? "#22C55E" : p.status === "BUST" ? "#EF4444" : "rgba(255,255,255,0.6)",
                              }}>{p.status}</span>
                              {p.game && (
                                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                                  {p.game.awayTeam.abbreviation} {p.game.awayScore ?? "?"} - {p.game.homeTeam.abbreviation} {p.game.homeScore ?? "?"}
                                </span>
                              )}
                            </div>
                            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.4", fontFamily: "var(--font-inter)" }}>{p.claim}</p>
                            {p.result && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "6px" }}>{p.result}</p>}
                          </Link>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "challenges" && (
                    <div>
                      {challenges.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>No challenges yet</div>
                      ) : (
                        challenges.map((c) => (
                          <Link
                            key={c.id}
                            href={`/court/challenge/${c.id}`}
                            style={{ display: "block", padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", textDecoration: "none" }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                              <span style={{
                                fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase",
                                background: c.status === "COMPLETED" ? "rgba(34,197,94,0.2)" : c.status === "EXPIRED" ? "rgba(255,255,255,0.1)" : "rgba(249,115,22,0.2)",
                                color: c.status === "COMPLETED" ? "#22C55E" : c.status === "EXPIRED" ? "rgba(255,255,255,0.4)" : "#F97316",
                              }}>{c.status}</span>
                              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, marginBottom: "8px", fontFamily: "var(--font-inter)" }}>{c.topic}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                              <span style={{ color: "rgba(255,255,255,0.7)" }}>{c.challenger.displayName || c.challenger.name}</span>
                              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>VS</span>
                              <span style={{ color: "rgba(255,255,255,0.7)" }}>{c.challenged.displayName || c.challenged.name}</span>
                              {(c.votesChallenger > 0 || c.votesChallenged > 0) && (
                                <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: "auto", fontSize: "12px" }}>{c.votesChallenger} - {c.votesChallenged} votes</span>
                              )}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "aging" && (
                    <div>
                      {agingTakes.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>No aging takes yet</div>
                      ) : (
                        agingTakes.map((at) => (
                          <Link
                            key={at.id}
                            href={`/court/take/${at.take.id}`}
                            style={{ display: "block", padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", textDecoration: "none" }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{
                                fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase",
                                background: at.status === "AGED" ? "rgba(234,179,8,0.2)" : at.status === "AGING" ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.1)",
                                color: at.status === "AGED" ? "#EAB308" : at.status === "AGING" ? "#3B82F6" : "rgba(255,255,255,0.4)",
                              }}>
                                {at.status === "AGING" ? `Aging until ${new Date(at.revisitDate).toLocaleDateString()}` : at.status}
                              </span>
                            </div>
                            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: "1.4", fontFamily: "var(--font-inter)" }}>{at.take.content}</p>
                            <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
                              <span>{at.take.fireCount} fires</span>
                              <span>{at.take.brickCount} bricks</span>
                              <span>{at.take.replyCount} replies</span>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
              </div>
            </div>

            {/* ===== RIGHT SIDEBAR ===== */}
            <aside style={{ position: "sticky", top: "140px", alignSelf: "start" }}>
              {/* Live Scores */}
              {liveGames.length > 0 && (
                <div style={{
                  background: "#1A1A1A",
                  borderRadius: "12px",
                  border: "1px solid #2a2a2a",
                  padding: "20px",
                  marginBottom: "16px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <h3 style={{
                      fontFamily: "var(--font-anton), Anton, sans-serif",
                      fontSize: "14px",
                      color: "#FF6B35",
                      margin: 0,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}>Live Scores</h3>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#22c55e", fontFamily: FONT, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                      LIVE
                    </span>
                  </div>
                  {liveGames.slice(0, 5).map((game) => (
                    <Link
                      key={game.id}
                      href="/scores"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", textDecoration: "none" }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {game.awayTeam.logoUrl && <img src={game.awayTeam.logoUrl} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}
                            <span style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 600, color: game.awayScore > game.homeScore ? "#fff" : "rgba(255,255,255,0.5)" }}>{game.awayTeam.abbreviation}</span>
                          </div>
                          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "13px", fontWeight: 700, color: game.awayScore > game.homeScore ? "#fff" : "rgba(255,255,255,0.5)" }}>{game.awayScore}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {game.homeTeam.logoUrl && <img src={game.homeTeam.logoUrl} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}
                            <span style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 600, color: game.homeScore > game.awayScore ? "#fff" : "rgba(255,255,255,0.5)" }}>{game.homeTeam.abbreviation}</span>
                          </div>
                          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "13px", fontWeight: 700, color: game.homeScore > game.awayScore ? "#fff" : "rgba(255,255,255,0.5)" }}>{game.homeScore}</span>
                        </div>
                      </div>
                      <div style={{ marginLeft: "12px", textAlign: "center", minWidth: "40px" }}>
                        <div style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: game.status === "live" ? "#22c55e" : "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
                          {game.status === "live" ? (game.quarter || "LIVE") : game.status === "final" ? "FINAL" : ""}
                        </div>
                        {game.clock && game.status === "live" && (
                          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>{game.clock}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                  <Link href="/scores" style={{ display: "block", textAlign: "center", marginTop: "10px", fontFamily: FONT, fontSize: "12px", fontWeight: 600, color: "#FF6B35", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    View All Scores
                  </Link>
                </div>
              )}

              {/* Active Challenges */}
              {activeChallenges.length > 0 && (
                <div style={{
                  background: "#1A1A1A",
                  borderRadius: "12px",
                  border: "1px solid #2a2a2a",
                  padding: "20px",
                  marginBottom: "16px",
                }}>
                  <h3 style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "14px",
                    color: "#FF6B35",
                    margin: "0 0 14px 0",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}>Active Challenges</h3>
                  {activeChallenges.map((c) => (
                    <div key={c.id} style={{ padding: "10px 0", borderTop: "1px solid #2a2a2a" }}>
                      <div style={{ fontSize: "13px", color: "#fff", fontFamily: FONT, fontWeight: 600, marginBottom: "6px", lineHeight: "1.3" }}>
                        {c.topic.length > 80 ? c.topic.slice(0, 77) + "..." : c.topic}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontFamily: FONT }}>
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>{c.challenger.displayName || c.challenger.name} vs {c.challenged.displayName || c.challenged.name}</span>
                        <span style={{ fontSize: "11px", color: c.status === "VOTING" ? "#EAB308" : "#22C55E", fontWeight: 700, textTransform: "uppercase" }}>{c.status}</span>
                      </div>
                      {(c.votesChallenger > 0 || c.votesChallenged > 0) && (
                        <div style={{ marginTop: "6px", height: "4px", borderRadius: "2px", background: "#333", overflow: "hidden", display: "flex" }}>
                          <div style={{ width: `${(c.votesChallenger / (c.votesChallenger + c.votesChallenged)) * 100}%`, background: "#FF6B35", borderRadius: "2px 0 0 2px" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Latest News */}
              {newsArticles.length > 0 && (
                <div style={{
                  background: "#1A1A1A",
                  borderRadius: "12px",
                  border: "1px solid #2a2a2a",
                  padding: "20px",
                  marginBottom: "16px",
                }}>
                  <h3 style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "14px",
                    color: "#FF6B35",
                    margin: "0 0 14px 0",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}>Latest News</h3>
                  {newsArticles.map((article) => (
                    <a
                      key={article.id}
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", textDecoration: "none", color: "inherit" }}
                    >
                      <div style={{ width: 56, height: 56, borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "rgba(255,107,53,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {article.imageUrl ? (
                          <img src={article.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "18px", color: "#FF6B35" }}>{article.source.charAt(0)}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: FONT, fontSize: "13px", fontWeight: "600", color: "#fff", lineHeight: "1.3", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {article.title}
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
                          {article.source}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>

        <style>{`
          @media (max-width: 1100px) {
            .profile-left-sidebar { display: none !important; }
            .profile-grid { grid-template-columns: 1fr 320px !important; }
          }
          @media (max-width: 768px) {
            .profile-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
