"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header, Footer } from "@/components";

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  conference?: string;
  division?: string;
  logoUrl?: string;
  league?: string;
}

const LEAGUE_NAMES: Record<string, string> = {
  nba: "NBA",
  wnba: "WNBA",
  ncaam: "NCAA Men's Basketball",
  ncaaw: "NCAA Women's Basketball",
};

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const league = params.league as string;
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      try {
        // For NBA, we can fetch individual team
        if (league === "nba") {
          const res = await fetch(`/api/teams?id=${teamId}`);
          const data = await res.json();
          if (data.success && data.team) {
            setTeam(data.team);
          } else {
            setError("Team not found");
          }
        } else {
          // For other leagues, fetch all teams and find the one we want
          const res = await fetch(`/api/teams?league=${league}`);
          const data = await res.json();
          if (data.success && data.teams) {
            const foundTeam = data.teams.find((t: Team) => t.id === teamId);
            if (foundTeam) {
              setTeam(foundTeam);
            } else {
              setError("Team not found");
            }
          } else {
            setError("Failed to load team");
          }
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeam();
  }, [league, teamId]);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Back button */}
          <Link
            href="/teams"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--orange)",
              textDecoration: "none",
              marginBottom: "30px",
              fontFamily: "var(--font-barlow), sans-serif",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            &larr; Back to Teams
          </Link>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading team...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "var(--red)" }}>{error}</p>
              <button
                onClick={() => router.push("/teams")}
                style={{
                  marginTop: "20px",
                  padding: "12px 24px",
                  background: "var(--orange)",
                  border: "none",
                  color: "var(--white)",
                  cursor: "pointer",
                  fontFamily: "var(--font-barlow), sans-serif",
                }}
              >
                Return to Teams
              </button>
            </div>
          ) : team ? (
            <div
              className="section"
              style={{
                padding: "40px",
                textAlign: "center",
              }}
            >
              {/* Team Logo */}
              <div
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 30px",
                  overflow: "hidden",
                }}
              >
                {team.logoUrl ? (
                  <Image
                    src={team.logoUrl}
                    alt={team.name}
                    width={120}
                    height={120}
                    style={{ objectFit: "contain" }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      if (target.parentElement) {
                        target.parentElement.textContent = team.abbreviation;
                      }
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-anton), Anton, sans-serif",
                      fontSize: "48px",
                    }}
                  >
                    {team.abbreviation}
                  </span>
                )}
              </div>

              {/* Team Name */}
              <h1
                style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "42px",
                  marginBottom: "10px",
                }}
              >
                {team.city ? `${team.city} ` : ""}
                {team.name}
              </h1>

              {/* League Badge */}
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  background: "var(--orange)",
                  marginBottom: "30px",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontSize: "12px",
                  fontWeight: "600",
                  letterSpacing: "1px",
                }}
              >
                {LEAGUE_NAMES[league] || league.toUpperCase()}
              </div>

              {/* Team Info */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "20px",
                  marginTop: "30px",
                }}
              >
                <div
                  style={{
                    padding: "20px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                  }}
                >
                  <p
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "12px",
                      marginBottom: "5px",
                    }}
                  >
                    ABBREVIATION
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-anton), Anton, sans-serif",
                      fontSize: "24px",
                    }}
                  >
                    {team.abbreviation}
                  </p>
                </div>

                {team.conference && (
                  <div
                    style={{
                      padding: "20px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                    }}
                  >
                    <p
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "12px",
                        marginBottom: "5px",
                      }}
                    >
                      CONFERENCE
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-anton), Anton, sans-serif",
                        fontSize: "24px",
                      }}
                    >
                      {team.conference}
                    </p>
                  </div>
                )}

                {team.division && (
                  <div
                    style={{
                      padding: "20px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                    }}
                  >
                    <p
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "12px",
                        marginBottom: "5px",
                      }}
                    >
                      DIVISION
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-anton), Anton, sans-serif",
                        fontSize: "24px",
                      }}
                    >
                      {team.division}
                    </p>
                  </div>
                )}
              </div>

              {/* Coming Soon */}
              <div
                style={{
                  marginTop: "40px",
                  padding: "30px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              >
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                  Team stats, roster, and schedule coming soon...
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
