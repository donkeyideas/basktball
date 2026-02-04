"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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

type League = "nba" | "wnba" | "ncaam" | "ncaaw";
type ConferenceFilter = "all" | "east" | "west";

const LEAGUES: { id: League; name: string; fullName: string }[] = [
  { id: "nba", name: "NBA", fullName: "National Basketball Association" },
  { id: "wnba", name: "WNBA", fullName: "Women's National Basketball Association" },
  { id: "ncaam", name: "NCAAM", fullName: "NCAA Men's Basketball" },
  { id: "ncaaw", name: "NCAAW", fullName: "NCAA Women's Basketball" },
];

export default function TeamsPage() {
  const [teamsData, setTeamsData] = useState<Record<string, Team[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<League>("nba");
  const [conferenceFilter, setConferenceFilter] = useState<ConferenceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("/api/teams?grouped=true");
        const data = await res.json();
        if (data.success) {
          setTeamsData(data.teams || {});
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

  const currentTeams = teamsData[selectedLeague] || [];

  const filteredTeams = currentTeams.filter((team) => {
    // Conference filter (only for NBA)
    if (selectedLeague === "nba" && conferenceFilter !== "all") {
      if (!team.conference?.toLowerCase().includes(conferenceFilter)) {
        return false;
      }
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        team.name.toLowerCase().includes(query) ||
        team.city.toLowerCase().includes(query) ||
        team.abbreviation.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Group by division (for NBA) or alphabetically (for others)
  const teamsByGroup = filteredTeams.reduce(
    (acc, team) => {
      let group: string;
      if (selectedLeague === "nba") {
        group = team.division || "Other";
      } else {
        // Group college teams alphabetically by first letter
        group = team.name.charAt(0).toUpperCase();
      }
      if (!acc[group]) acc[group] = [];
      acc[group].push(team);
      return acc;
    },
    {} as Record<string, Team[]>
  );

  // Sort groups
  const sortedGroups = Object.entries(teamsByGroup).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const leagueInfo = LEAGUES.find((l) => l.id === selectedLeague);
  const teamCount = filteredTeams.length;

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Page Header */}
          <h1
            style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "48px",
              marginBottom: "10px",
              textAlign: "center",
            }}
          >
            BASKETBALL TEAMS
            <span
              style={{
                display: "block",
                width: "100px",
                height: "4px",
                background: "var(--orange)",
                margin: "15px auto 0",
              }}
            ></span>
          </h1>
          <p
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "30px",
            }}
          >
            Browse teams from NBA, WNBA, and College Basketball
          </p>

          {/* League Tabs */}
          <div
            style={{
              display: "flex",
              gap: "5px",
              marginBottom: "20px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {LEAGUES.map((league) => (
              <button
                key={league.id}
                onClick={() => {
                  setSelectedLeague(league.id);
                  setConferenceFilter("all");
                  setSearchQuery("");
                }}
                style={{
                  padding: "14px 28px",
                  background:
                    selectedLeague === league.id
                      ? "var(--orange)"
                      : "var(--dark-gray)",
                  border: "2px solid",
                  borderColor:
                    selectedLeague === league.id
                      ? "var(--orange)"
                      : "rgba(255,255,255,0.1)",
                  color: "var(--white)",
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "18px",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {league.name}
              </button>
            ))}
          </div>

          {/* League Description */}
          <p
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "30px",
              fontSize: "14px",
            }}
          >
            {leagueInfo?.fullName} • {teamCount} team{teamCount !== 1 ? "s" : ""}
          </p>

          {/* Filters Row */}
          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "30px",
              justifyContent: "center",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Search */}
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "12px 20px",
                background: "var(--dark-gray)",
                border: "2px solid rgba(255,255,255,0.1)",
                color: "var(--white)",
                fontFamily: "var(--font-barlow), sans-serif",
                fontSize: "14px",
                width: "250px",
                outline: "none",
              }}
            />

            {/* Conference Filter (NBA only) */}
            {selectedLeague === "nba" && (
              <div style={{ display: "flex", gap: "5px" }}>
                {[
                  { id: "all" as ConferenceFilter, name: "All" },
                  { id: "east" as ConferenceFilter, name: "East" },
                  { id: "west" as ConferenceFilter, name: "West" },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setConferenceFilter(filter.id)}
                    style={{
                      padding: "10px 18px",
                      background:
                        conferenceFilter === filter.id
                          ? "var(--orange)"
                          : "transparent",
                      border: "2px solid",
                      borderColor:
                        conferenceFilter === filter.id
                          ? "var(--orange)"
                          : "rgba(255,255,255,0.2)",
                      color: "var(--white)",
                      fontFamily: "var(--font-barlow), sans-serif",
                      fontSize: "13px",
                      fontWeight: "600",
                      letterSpacing: "1px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading teams...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "var(--red)" }}>{error}</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>
                {searchQuery
                  ? `No teams found matching "${searchQuery}"`
                  : `No ${leagueInfo?.name} teams available. ${
                      selectedLeague === "nba"
                        ? "Make sure BALLDONTLIE_API_KEY is configured."
                        : "Data may be loading or unavailable."
                    }`}
              </p>
            </div>
          ) : (
            sortedGroups.map(([group, groupTeams]) => (
              <div
                key={group}
                className="section"
                style={{ marginBottom: "30px" }}
              >
                <div className="section-title">{group}</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {groupTeams.map((team) => (
                    <div
                      key={team.id}
                      className="league-card"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        padding: "20px",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
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
                                target.parentElement.textContent =
                                  team.abbreviation;
                              }
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--font-anton), Anton, sans-serif",
                              fontSize: "16px",
                            }}
                          >
                            {team.abbreviation}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3
                          style={{
                            fontFamily: "var(--font-anton), Anton, sans-serif",
                            fontSize: "18px",
                            marginBottom: "5px",
                          }}
                        >
                          {team.city ? `${team.city} ` : ""}
                          {team.name}
                        </h3>
                        {(team.conference || team.division) && (
                          <p
                            style={{
                              color: "rgba(255,255,255,0.5)",
                              fontSize: "13px",
                            }}
                          >
                            {[team.conference, team.division]
                              .filter(Boolean)
                              .join(" - ")}
                          </p>
                        )}
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
