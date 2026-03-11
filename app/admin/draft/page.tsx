"use client";

import { useState, useEffect } from "react";

interface DraftProspect {
  id: string;
  rank: number;
  name: string;
  position: string;
  school: string;
  height: string;
  weight: number;
  age: number;
  ppg: number;
  rpg: number;
  apg: number;
  fgPct: number;
  threePct: number;
  strengths: string[];
  weaknesses: string[];
  comparison: string | null;
  projectedPick: string | null;
  draftYear: number;
}

const emptyProspect: Omit<DraftProspect, "id"> = {
  rank: 1,
  name: "",
  position: "",
  school: "",
  height: "",
  weight: 0,
  age: 0,
  ppg: 0,
  rpg: 0,
  apg: 0,
  fgPct: 0,
  threePct: 0,
  strengths: [],
  weaknesses: [],
  comparison: "",
  projectedPick: "",
  draftYear: new Date().getFullYear(),
};

export default function AdminDraftPage() {
  const [prospects, setProspects] = useState<DraftProspect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProspect, setEditingProspect] = useState<DraftProspect | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Omit<DraftProspect, "id">>(emptyProspect);
  const [strengthInput, setStrengthInput] = useState("");
  const [weaknessInput, setWeaknessInput] = useState("");

  async function fetchProspects() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/draft");
      const data = await res.json();
      if (data.success) {
        setProspects(data.prospects || []);
        setError(null);
      } else {
        setError(data.error || "Failed to load prospects");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProspects();
  }, []);

  function startEdit(prospect: DraftProspect) {
    setEditingProspect(prospect);
    setFormData(prospect);
    setIsCreating(false);
  }

  function startCreate() {
    setEditingProspect(null);
    setFormData({ ...emptyProspect, rank: prospects.length + 1 });
    setIsCreating(true);
  }

  function cancelEdit() {
    setEditingProspect(null);
    setIsCreating(false);
    setFormData(emptyProspect);
    setStrengthInput("");
    setWeaknessInput("");
  }

  function addStrength() {
    if (strengthInput.trim()) {
      setFormData(prev => ({
        ...prev,
        strengths: [...prev.strengths, strengthInput.trim()],
      }));
      setStrengthInput("");
    }
  }

  function removeStrength(index: number) {
    setFormData(prev => ({
      ...prev,
      strengths: prev.strengths.filter((_, i) => i !== index),
    }));
  }

  function addWeakness() {
    if (weaknessInput.trim()) {
      setFormData(prev => ({
        ...prev,
        weaknesses: [...prev.weaknesses, weaknessInput.trim()],
      }));
      setWeaknessInput("");
    }
  }

  function removeWeakness(index: number) {
    setFormData(prev => ({
      ...prev,
      weaknesses: prev.weaknesses.filter((_, i) => i !== index),
    }));
  }

  async function saveProspect() {
    try {
      const method = editingProspect ? "PUT" : "POST";
      const body = editingProspect
        ? { id: editingProspect.id, ...formData }
        : formData;

      const res = await fetch("/api/admin/draft", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        await fetchProspects();
        cancelEdit();
      } else {
        alert(data.error || "Failed to save prospect");
      }
    } catch {
      alert("Failed to save prospect");
    }
  }

  async function deleteProspect(id: string) {
    if (!confirm("Are you sure you want to delete this prospect?")) return;
    try {
      await fetch(`/api/admin/draft?id=${id}`, { method: "DELETE" });
      await fetchProspects();
    } catch {
      alert("Failed to delete prospect");
    }
  }

  return (
    <>
      <div className="admin-header">
        <h1>DRAFT PROSPECTS</h1>
        <button className="btn btn-primary" onClick={startCreate}>
          + Add Prospect
        </button>
      </div>

      <div className="admin-content">
        {/* Form Modal */}
        {(isCreating || editingProspect) && (
          <div className="section" style={{ marginBottom: "30px" }}>
            <div className="section-title">
              {editingProspect ? `Edit: ${editingProspect.name}` : "Add New Prospect"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Rank</label>
                <input
                  type="number"
                  value={formData.rank}
                  onChange={e => setFormData(prev => ({ ...prev, rank: parseInt(e.target.value) || 0 }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Position</label>
                <input
                  type="text"
                  value={formData.position}
                  placeholder="PG, SG, SF, PF, C"
                  onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>School</label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={e => setFormData(prev => ({ ...prev, school: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Height</label>
                <input
                  type="text"
                  value={formData.height}
                  placeholder="6'5&quot;"
                  onChange={e => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Weight (lbs)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={e => setFormData(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Draft Year</label>
                <input
                  type="number"
                  value={formData.draftYear}
                  onChange={e => setFormData(prev => ({ ...prev, draftYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Projected Pick</label>
                <input
                  type="text"
                  value={formData.projectedPick || ""}
                  placeholder="1-5"
                  onChange={e => setFormData(prev => ({ ...prev, projectedPick: e.target.value }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>PPG</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ppg}
                  onChange={e => setFormData(prev => ({ ...prev, ppg: parseFloat(e.target.value) || 0 }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>RPG</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.rpg}
                  onChange={e => setFormData(prev => ({ ...prev, rpg: parseFloat(e.target.value) || 0 }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>APG</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.apg}
                  onChange={e => setFormData(prev => ({ ...prev, apg: parseFloat(e.target.value) || 0 }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>FG%</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.fgPct}
                  onChange={e => setFormData(prev => ({ ...prev, fgPct: parseFloat(e.target.value) || 0 }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>3P%</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.threePct}
                  onChange={e => setFormData(prev => ({ ...prev, threePct: parseFloat(e.target.value) || 0 }))}
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Player Comparison</label>
              <input
                type="text"
                value={formData.comparison || ""}
                placeholder="e.g., Jayson Tatum"
                onChange={e => setFormData(prev => ({ ...prev, comparison: e.target.value }))}
                style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Strengths</label>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type="text"
                    value={strengthInput}
                    onChange={e => setStrengthInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addStrength())}
                    placeholder="Add strength..."
                    style={{ flex: 1, padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                  />
                  <button onClick={addStrength} style={{ padding: "10px 15px", background: "var(--green)", border: "none", color: "var(--white)", cursor: "pointer" }}>+</button>
                </div>
                {formData.strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(16, 185, 129, 0.1)", marginBottom: "5px" }}>
                    <span>{s}</span>
                    <button onClick={() => removeStrength(i)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "rgba(255,255,255,0.6)" }}>Weaknesses</label>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type="text"
                    value={weaknessInput}
                    onChange={e => setWeaknessInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addWeakness())}
                    placeholder="Add weakness..."
                    style={{ flex: 1, padding: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--white)" }}
                  />
                  <button onClick={addWeakness} style={{ padding: "10px 15px", background: "var(--red)", border: "none", color: "var(--white)", cursor: "pointer" }}>+</button>
                </div>
                {formData.weaknesses.map((w, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", marginBottom: "5px" }}>
                    <span>{w}</span>
                    <button onClick={() => removeWeakness(i)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={saveProspect} className="btn btn-primary">Save Prospect</button>
              <button onClick={cancelEdit} style={{ padding: "10px 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "var(--white)", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Prospects Table */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading prospects...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
            <button onClick={fetchProspects} className="btn" style={{ marginTop: "20px" }}>Retry</button>
          </div>
        ) : prospects.length === 0 ? (
          <div className="section">
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>No draft prospects yet. Add your first prospect!</p>
            </div>
          </div>
        ) : (
          <div className="section">
            <div className="section-title">
              {new Date().getFullYear()} Draft Board ({prospects.length} prospects)
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--orange)" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Rank</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Pos</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>School</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>PPG</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>RPG</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>APG</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Projected</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map(prospect => (
                  <tr key={prospect.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        display: "inline-block",
                        width: "30px",
                        height: "30px",
                        background: prospect.rank <= 3 ? "var(--orange)" : "rgba(255,255,255,0.1)",
                        textAlign: "center",
                        lineHeight: "30px",
                        fontWeight: "bold"
                      }}>
                        {prospect.rank}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontWeight: "bold" }}>{prospect.name}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{prospect.position}</td>
                    <td style={{ padding: "12px" }}>{prospect.school}</td>
                    <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono)" }}>{prospect.ppg.toFixed(1)}</td>
                    <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono)" }}>{prospect.rpg.toFixed(1)}</td>
                    <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono)" }}>{prospect.apg.toFixed(1)}</td>
                    <td style={{ padding: "12px", textAlign: "center", color: "var(--green)" }}>#{prospect.projectedPick}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <button
                        onClick={() => startEdit(prospect)}
                        style={{ marginRight: "10px", padding: "5px 10px", background: "var(--blue)", border: "none", color: "var(--white)", cursor: "pointer" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProspect(prospect.id)}
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
        )}
      </div>
    </>
  );
}
