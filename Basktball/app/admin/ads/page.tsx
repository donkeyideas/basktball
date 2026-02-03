"use client";

import { useState, useEffect } from "react";

interface AdSlot {
  id: string;
  name: string;
  location: string;
  enabled: boolean;
  impressions: number;
  clicks: number;
  ctr: string;
  revenue: number;
}

export default function AdminAdsPage() {
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAds() {
    try {
      const res = await fetch("/api/admin/ads");
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots || []);
        setError(null);
      } else {
        setError(data.error || "Failed to load ad slots");
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

  async function toggleSlot(slotId: string, enabled: boolean) {
    try {
      await fetch(`/api/admin/ads/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      await fetchAds();
    } catch {
      // Silent fail
    }
  }

  const totalRevenue = slots.reduce((sum, slot) => sum + slot.revenue, 0);
  const totalImpressions = slots.reduce((sum, slot) => sum + slot.impressions, 0);
  const totalClicks = slots.reduce((sum, slot) => sum + slot.clicks, 0);

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
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="value">${totalRevenue.toFixed(2)}</div>
            <div className="label">Total Revenue (30d)</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="value">{totalImpressions.toLocaleString()}</div>
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
            <div className="value">{totalClicks.toLocaleString()}</div>
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
            <div className="value">
              {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00"}%
            </div>
            <div className="label">Average CTR</div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading ad slots...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
          </div>
        ) : (
          <div className="section">
            <div className="section-title">Ad Slots</div>
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>SLOT NAME</th>
                  <th>LOCATION</th>
                  <th>IMPRESSIONS</th>
                  <th>CLICKS</th>
                  <th>CTR</th>
                  <th>REVENUE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {slots.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                      No ad slots configured
                    </td>
                  </tr>
                ) : (
                  slots.map(slot => (
                    <tr key={slot.id}>
                      <td style={{ fontWeight: "600" }}>{slot.name}</td>
                      <td style={{ color: "rgba(255,255,255,0.6)" }}>{slot.location}</td>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {slot.impressions.toLocaleString()}
                      </td>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {slot.clicks.toLocaleString()}
                      </td>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {slot.ctr}
                      </td>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace", color: "var(--green)" }}>
                        ${slot.revenue.toFixed(2)}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleSlot(slot.id, !slot.enabled)}
                          className={`job-status ${slot.enabled ? "success" : "paused"}`}
                          style={{ cursor: "pointer", border: "none" }}
                        >
                          {slot.enabled ? "ENABLED" : "DISABLED"}
                        </button>
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
