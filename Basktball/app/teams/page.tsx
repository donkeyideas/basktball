"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Header, Footer } from "@/components";

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  logoUrl?: string;
}

type ConferenceFilter = "all" | "east" | "west";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conferenceFilter, setConferenceFilter] = useState<ConferenceFilter>("all");

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("/api/teams");
        const data = await res.json();
        if (data.success) {
          setTeams(data.teams || []);
        } else {
          setError(data.error || "Failed to load teams");
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(team => {
    if (conferenceFilter === "all") return true;
    return team.conference?.toLowerCase().includes(conferenceFilter);
  });

  // Group by division
  const teamsByDivision = filteredTeams.reduce((acc, team) => {
    const division = team.division || "Other";
    if (!acc[division]) acc[division] = [];
    acc[division].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Page Header */}
          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "40px",
            textAlign: "center"
          }}>
            NBA TEAMS
            <span style={{
              display: "block",
              width: "100px",
              height: "4px",
              background: "var(--orange)",
              margin: "15px auto 0"
            }}></span>
          </h1>

          {/* Conference Filter */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginBottom: "40px",
            justifyContent: "center"
          }}>
            {[
              { id: "all" as ConferenceFilter, name: "All Teams" },
              { id: "east" as ConferenceFilter, name: "Eastern Conference" },
              { id: "west" as ConferenceFilter, name: "Western Conference" },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setConferenceFilter(filter.id)}
                style={{
                  padding: "12px 24px",
                  background: conferenceFilter === filter.id ? "var(--orange)" : "var(--dark-gray)",
                  border: "2px solid",
                  borderColor: conferenceFilter === filter.id ? "var(--orange)" : "rgba(255,255,255,0.1)",
                  color: "var(--white)",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontSize: "14px",
                  fontWeight: "600",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                {filter.name}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading teams...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "var(--red)" }}>{error}</p>
            </div>
          ) : teams.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>No teams available.</p>
            </div>
          ) : (
            Object.entries(teamsByDivision).map(([division, divisionTeams]) => (
              <div key={division} className="section" style={{ marginBottom: "30px" }}>
                <div className="section-title">{division}</div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "20px"
                }}>
                  {divisionTeams.map(team => (
                    <div
                      key={team.id}
                      className="league-card"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        padding: "20px",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0
                      }}>
                        {team.logoUrl ? (
                          <Image
                            src={team.logoUrl}
                            alt={team.name}
                            width={50}
                            height={50}
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
                          <span style={{
                            fontFamily: "var(--font-anton), Anton, sans-serif",
                            fontSize: "18px"
                          }}>
                            {team.abbreviation}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 style={{
                          fontFamily: "var(--font-anton), Anton, sans-serif",
                          fontSize: "20px",
                          marginBottom: "5px"
                        }}>
                          {team.city} {team.name}
                        </h3>
                        <p style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: "14px"
                        }}>
                          {team.conference} - {team.division}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
