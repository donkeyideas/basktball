"use client";

import { useState, useEffect } from "react";

interface HistoricalRecord {
  id: string;
  category: string;
  record: string;
  holder: string;
  date: string;
  details: string | null;
  sortOrder: number;
}

interface SeasonHistory {
  id: string;
  year: string;
  champion: string;
  mvp: string;
  finalsScore: string;
  topScorer: string;
  topScorerPpg: number;
}

const emptyRecord: Omit<HistoricalRecord, "id"> = {
  category: "",
  record: "",
  holder: "",
  date: "",
  details: "",
  sortOrder: 0,
};

const emptySeason: Omit<SeasonHistory, "id"> = {
  year: "",
  champion: "",
  mvp: "",
  finalsScore: "",
  topScorer: "",
  topScorerPpg: 0,
};

export default function AdminHistoryPage() {
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [seasons, setSeasons] = useState<SeasonHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"records" | "seasons">("records");
  const [editingRecord, setEditingRecord] = useState<HistoricalRecord | null>(null);
  const [editingSeason, setEditingSeason] = useState<SeasonHistory | null>(null);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);
  const [recordForm, setRecordForm] = useState<Omit<HistoricalRecord, "id">>(emptyRecord);
  const [seasonForm, setSeasonForm] = useState<Omit<SeasonHistory, "id">>(emptySeason);

  async function fetchHistory() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/history");
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        setSeasons(data.seasons || []);
        setError(null);
      } else {
        setError(data.error || "Failed to load history");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  // Record functions
  function startEditRecord(record: HistoricalRecord) {
    setEditingRecord(record);
    setRecordForm(record);
    setIsCreatingRecord(false);
  }

  function startCreateRecord() {
    setEditingRecord(null);
    setRecordForm({ ...emptyRecord, sortOrder: records.length });
    setIsCreatingRecord(true);
  }

  function cancelRecordEdit() {
    setEditingRecord(null);
    setIsCreatingRecord(false);
    setRecordForm(emptyRecord);
  }

  async function saveRecord() {
    try {
      const method = editingRecord ? "PUT" : "POST";
      const body = editingRecord
        ? { type: "record", id: editingRecord.id, ...recordForm }
        : { type: "record", ...recordForm };

      const res = await fetch("/api/admin/history", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        await fetchHistory();
        cancelRecordEdit();
      } else {
        alert(data.error || "Failed to save record");
      }
    } catch {
      alert("Failed to save record");
    }
  }

  async function deleteRecord(id: string) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await fetch(`/api/admin/history?id=${id}&type=record`, { method: "DELETE" });
      await fetchHistory();
    } catch {
      alert("Failed to delete record");
    }
  }

  // Season functions
  function startEditSeason(season: SeasonHistory) {
    setEditingSeason(season);
    setSeasonForm(season);
    setIsCreatingSeason(false);
  }

  function startCreateSeason() {
    setEditingSeason(null);
    setSeasonForm(emptySeason);
    setIsCreatingSeason(true);
  }

  function cancelSeasonEdit() {
    setEditingSeason(null);
    setIsCreatingSeason(false);
    setSeasonForm(emptySeason);
  }

  async function saveSeason() {
    try {
      const method = editingSeason ? "PUT" : "POST";
      const body = editingSeason
        ? { type: "season", id: editingSeason.id, ...seasonForm }
        : { type: "season", ...seasonForm };

      const res = await fetch("/api/admin/history", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        await fetchHistory();
        cancelSeasonEdit();
      } else {
        alert(data.error || "Failed to save season");
      }
    } catch {
      alert("Failed to save season");
    }
  }

  async function deleteSeason(id: string) {
    if (!confirm("Are you sure you want to delete this season?")) return;
    try {
      await fetch(`/api/admin/history?id=${id}&type=season`, { method: "DELETE" });
      await fetchHistory();
    } catch {
      alert("Failed to delete season");
    }
  }

  return (
    <>
      <div className="admin-header">
        <h1>HISTORICAL DATA</h1>
        <button
          className="btn btn-primary"
          onClick={activeTab === "records" ? startCreateRecord : startCreateSeason}
        >
          + Add {activeTab === "records" ? "Record" : "Season"}
        </button>
      </div>

      <div className="admin-content">
        {/* Tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
          <button
            onClick={() => setActiveTab("records")}
            style={{
              padding: "10px 20px",
              background: activeTab === "records" ? "var(--orange)" : "var(--dark-gray)",
              border: "2px solid",
              borderColor: activeTab === "records" ? "var(--orange)" : "rgba(255,255,255,0.1)",
              color: "var(--white)",
              cursor: "pointer"
            }}
          >
            All-Time Records ({records.length})
          </button>
          <button
            onClick={() => setActiveTab("seasons")}
            style={{
              padding: "10px 20px",
              background: activeTab === "seasons" ? "var(--orange)" : "var(--dark-gray)",
              border: "2px solid",
              borderColor: activeTab === "seasons" ? "var(--orange)" : "rgba(255,255,255,0.1)",
              color: "var(--white)",
              cursor: "pointer"
            }}
          >
            Season History ({seasons.length})
          </button>
        </div>

        {/* Record Form */}
        {activeTab === "records" && (isCreatingRecord || editingRecord) && (
          <div className="section" style={{ marginBottom: "30px" }}>
            <div className="section-title">
              {editingRecord ? `Edit: ${editingRecord.category}` : "Add New Record"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Category</label>
                <input
                  type="text"
                  value={recordForm.category}
                  placeholder="e.g., Career Points"
                  onChange={e => setRecordForm(prev => ({ ...prev, category: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Record Value</label>
                <input
                  type="text"
                  value={recordForm.record}
                  placeholder="e.g., 38,387"
                  onChange={e => setRecordForm(prev => ({ ...prev, record: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Record Holder</label>
                <input
                  type="text"
                  value={recordForm.holder}
                  placeholder="e.g., LeBron James"
                  onChange={e => setRecordForm(prev => ({ ...prev, holder: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Date/Era</label>
                <input
                  type="text"
                  value={recordForm.date}
                  placeholder="e.g., Active or 1984-2003"
                  onChange={e => setRecordForm(prev => ({ ...prev, date: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Details</label>
              <input
                type="text"
                value={recordForm.details || ""}
                placeholder="Additional details about the record"
                onChange={e => setRecordForm(prev => ({ ...prev, details: e.target.value }))}
                style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Sort Order</label>
              <input
                type="number"
                value={recordForm.sortOrder}
                onChange={e => setRecordForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                style={{ width: "150px", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={saveRecord} className="btn btn-primary">Save Record</button>
              <button onClick={cancelRecordEdit} style={{ padding: "10px 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "var(--white)", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Season Form */}
        {activeTab === "seasons" && (isCreatingSeason || editingSeason) && (
          <div className="section" style={{ marginBottom: "30px" }}>
            <div className="section-title">
              {editingSeason ? `Edit: ${editingSeason.year}` : "Add New Season"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Year</label>
                <input
                  type="text"
                  value={seasonForm.year}
                  placeholder="e.g., 2023-24"
                  onChange={e => setSeasonForm(prev => ({ ...prev, year: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Champion</label>
                <input
                  type="text"
                  value={seasonForm.champion}
                  placeholder="e.g., Boston Celtics"
                  onChange={e => setSeasonForm(prev => ({ ...prev, champion: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Finals Score</label>
                <input
                  type="text"
                  value={seasonForm.finalsScore}
                  placeholder="e.g., 4-1 vs Dallas"
                  onChange={e => setSeasonForm(prev => ({ ...prev, finalsScore: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>MVP</label>
                <input
                  type="text"
                  value={seasonForm.mvp}
                  placeholder="e.g., Nikola Jokic"
                  onChange={e => setSeasonForm(prev => ({ ...prev, mvp: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Top Scorer</label>
                <input
                  type="text"
                  value={seasonForm.topScorer}
                  placeholder="e.g., Luka Doncic"
                  onChange={e => setSeasonForm(prev => ({ ...prev, topScorer: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Top Scorer PPG</label>
                <input
                  type="number"
                  step="0.1"
                  value={seasonForm.topScorerPpg}
                  onChange={e => setSeasonForm(prev => ({ ...prev, topScorerPpg: parseFloat(e.target.value) || 0 }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={saveSeason} className="btn btn-primary">Save Season</button>
              <button onClick={cancelSeasonEdit} style={{ padding: "10px 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "var(--white)", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading history...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
            <button onClick={fetchHistory} className="btn" style={{ marginTop: "20px" }}>Retry</button>
          </div>
        ) : activeTab === "records" ? (
          records.length === 0 ? (
            <div className="section">
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>No records yet. Add your first record!</p>
              </div>
            </div>
          ) : (
            <div className="section">
              <div className="section-title">All-Time NBA Records</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--orange)" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>Category</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Record</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Holder</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Date</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Details</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold", color: "var(--orange)" }}>{record.category}</td>
                      <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono)", fontSize: "18px", fontWeight: "bold" }}>{record.record}</td>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>{record.holder}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{record.date}</td>
                      <td style={{ padding: "12px", color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>{record.details}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button
                          onClick={() => startEditRecord(record)}
                          style={{ marginRight: "10px", padding: "5px 10px", background: "var(--blue)", border: "none", color: "var(--white)", cursor: "pointer" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRecord(record.id)}
                          style={{ padding: "5px 10px", background: "var(--red)", border: "none", color: "var(--white)", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          seasons.length === 0 ? (
            <div className="section">
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>No seasons yet. Add your first season!</p>
              </div>
            </div>
          ) : (
            <div className="section">
              <div className="section-title">NBA Season History</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--orange)" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>Season</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Champion</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Finals</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>MVP</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Scoring Leader</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map(season => (
                    <tr key={season.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <td style={{ padding: "12px", fontFamily: "var(--font-roboto-mono)", fontWeight: "bold", color: "var(--orange)" }}>{season.year}</td>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>{season.champion}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{season.finalsScore}</td>
                      <td style={{ padding: "12px" }}>{season.mvp}</td>
                      <td style={{ padding: "12px" }}>
                        {season.topScorer}
                        <span style={{ marginLeft: "10px", fontFamily: "var(--font-roboto-mono)", color: "var(--green)" }}>
                          {season.topScorerPpg.toFixed(1)} PPG
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button
                          onClick={() => startEditSeason(season)}
                          style={{ marginRight: "10px", padding: "5px 10px", background: "var(--blue)", border: "none", color: "var(--white)", cursor: "pointer" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSeason(season.id)}
                          style={{ padding: "5px 10px", background: "var(--red)", border: "none", color: "var(--white)", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </>
  );
}
