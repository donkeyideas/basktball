"use client";

import { useState, useEffect } from "react";

interface Campaign {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  placements: Array<{
    id: string;
    slot: string;
    imageUrl: string | null;
    linkUrl: string | null;
    impressions: number;
    clicks: number;
  }>;
}

interface AdsStats {
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  overallCTR: number;
}

export default function AdminAdsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<AdsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAds() {
    try {
      const res = await fetch("/api/admin/ads");
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        setStats(data.stats || null);
        setError(null);
      } else {
        setError(data.error || "Failed to load ads");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAds();
  }, []);

  return (
    <>
      <div className="admin-header">
        <h1>AD MANAGEMENT</h1>
        <button className="btn btn-primary" onClick={fetchAds}>
          Refresh
        </button>
      </div>

      <div className="admin-content">
        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "40px"
        }}>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <div className="value">{stats?.activeCampaigns ?? "-"}</div>
            <div className="label">Active Campaigns</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="value">{stats?.totalImpressions?.toLocaleString() ?? "-"}</div>
            <div className="label">Total Impressions</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <div className="value">{stats?.totalClicks?.toLocaleString() ?? "-"}</div>
            <div className="label">Total Clicks</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div className="value">{stats?.overallCTR?.toFixed(2) ?? "-"}%</div>
            <div className="label">Average CTR</div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading campaigns...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
          </div>
        ) : (
          <div className="section">
            <div className="section-title">Campaigns</div>
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>CAMPAIGN</th>
                  <th>STATUS</th>
                  <th>DATE RANGE</th>
                  <th>IMPRESSIONS</th>
                  <th>CLICKS</th>
                  <th>CTR</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                      No campaigns created
                    </td>
                  </tr>
                ) : (
                  campaigns.map(campaign => (
                    <tr key={campaign.id}>
                      <td>
                        <div style={{ fontWeight: "600" }}>{campaign.name}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                          {campaign.placements.length} placement(s)
                        </div>
                      </td>
                      <td>
                        <span className={`job-status ${campaign.status === "ACTIVE" ? "success" : campaign.status === "PAUSED" ? "paused" : "running"}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "14px" }}>
                        {campaign.startDate || "-"} to {campaign.endDate || "-"}
                      </td>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {campaign.impressions.toLocaleString()}
                      </td>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {campaign.clicks.toLocaleString()}
                      </td>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {campaign.ctr.toFixed(2)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
