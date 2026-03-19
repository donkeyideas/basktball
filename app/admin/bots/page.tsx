"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BOT_PRESETS as PERSONALITY_PRESETS } from "@/lib/bots/personalities";
import { NBA_TEAMS, WNBA_TEAMS, getTeam, getTeamFullName } from "@/lib/bots/nba-teams";

interface Bot {
  id: string;
  name: string;
  displayName: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  image: string | null;
  botPersonality: string | null;
  botActive: boolean;
  takeCount: number;
  createdAt: string;
  favoriteTeamId: string | null;
}

export default function AdminBotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [posting, setPosting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create form state
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [creating, setCreating] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const createAvatarRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [editBot, setEditBot] = useState<Bot | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPreset, setEditPreset] = useState("");
  const [editTeam, setEditTeam] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const editAvatarRef = useRef<HTMLInputElement>(null);

  const fetchBots = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/bots");
      const data = await res.json();
      setBots(data.bots || []);
    } catch {
      setError("Failed to load bots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  function handleAvatarSelect(file: File, setFile: (f: File) => void, setPreview: (s: string) => void) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadAvatarForBot(botId: string, file: File): Promise<string | null> {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result.split(",")[1]); // strip data:image/...;base64, prefix
      };
      reader.readAsDataURL(file);
    });

    const res = await fetch(`/api/admin/bots/${botId}/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64, mimeType: file.type }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Avatar upload failed");
    }

    const data = await res.json();
    return data.avatarUrl;
  }

  async function createBot(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");

    const preset = PERSONALITY_PRESETS.find((p) => p.name === selectedPreset);
    const personality = preset
      ? preset.personality
      : { tone: "casual", interests: ["basketball"], responseStyle: "concise" };

    try {
      const res = await fetch("/api/admin/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, displayName, bio, avatarUrl, personality, favoriteTeamId: selectedTeam || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to create bot");
        return;
      }

      const data = await res.json();

      // Upload avatar if file selected
      if (avatarFile && data.bot?.id) {
        try {
          await uploadAvatarForBot(data.bot.id, avatarFile);
        } catch (err) {
          setError(`Bot created but avatar upload failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      setHandle("");
      setDisplayName("");
      setBio("");
      setAvatarUrl("");
      setSelectedPreset("");
      setSelectedTeam("");
      setAvatarFile(null);
      setAvatarPreview("");
      setShowCreate(false);
      showSuccess("Bot created successfully!");
      fetchBots();
    } catch {
      setError("Failed to create bot");
    } finally {
      setCreating(false);
    }
  }

  function openEditModal(bot: Bot) {
    setEditBot(bot);
    setEditDisplayName(bot.displayName);
    setEditBio(bot.bio || "");
    setEditTeam(bot.favoriteTeamId || "");
    setEditAvatarFile(null);
    setEditAvatarPreview(bot.avatarUrl || "");

    // Find matching preset
    try {
      const personality = JSON.parse(bot.botPersonality || "{}");
      const match = PERSONALITY_PRESETS.find((p) =>
        p.personality.tone === personality.tone && p.personality.responseStyle === personality.responseStyle
      );
      setEditPreset(match?.name || "");
    } catch {
      setEditPreset("");
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBot) return;
    setSaving(true);
    setError("");

    try {
      // Upload new avatar if selected
      if (editAvatarFile) {
        try {
          await uploadAvatarForBot(editBot.id, editAvatarFile);
        } catch (err) {
          setError(`Avatar upload failed: ${err instanceof Error ? err.message : String(err)}`);
          setSaving(false);
          return;
        }
      }

      // Update bot details
      const preset = PERSONALITY_PRESETS.find((p) => p.name === editPreset);
      const personality = preset ? preset.personality : undefined;

      const body: Record<string, unknown> = {
        displayName: editDisplayName,
        bio: editBio,
        favoriteTeamId: editTeam || null,
      };
      if (personality) body.personality = personality;

      const res = await fetch(`/api/admin/bots/${editBot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to update bot");
        return;
      }

      setEditBot(null);
      showSuccess("Bot updated successfully!");
      fetchBots();
    } catch {
      setError("Failed to update bot");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBot(id: string, active: boolean) {
    try {
      await fetch(`/api/admin/bots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botActive: !active }),
      });
      fetchBots();
    } catch {
      setError("Failed to update bot");
    }
  }

  async function triggerPost(id: string) {
    setPosting(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/bots/${id}/post`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.take) {
        showSuccess(`Posted: "${data.take.content.slice(0, 80)}..."`);
        fetchBots();
      } else {
        setError(data.message || "Failed to trigger post");
      }
    } catch {
      setError("Failed to trigger post");
    } finally {
      setPosting(null);
    }
  }

  async function deleteBot(id: string) {
    if (!confirm("Deactivate this bot? It will be suspended.")) return;
    try {
      await fetch(`/api/admin/bots/${id}`, { method: "DELETE" });
      fetchBots();
    } catch {
      setError("Failed to delete bot");
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.3)",
    color: "#fff",
    fontSize: "14px",
  };

  const labelStyle = {
    color: "rgba(255,255,255,0.7)",
    fontSize: "13px",
    display: "block" as const,
    marginBottom: "4px",
  };

  return (
    <div style={{ padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#fff" }}>Bot Users</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
            Create and manage AI-powered bot accounts that post, reply, react, and repost on The Court
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            background: "#F97316",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {showCreate ? "Cancel" : "+ Create Bot"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #EF4444", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: "#EF4444" }}>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: "8px", background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}>x</button>
        </div>
      )}

      {successMsg && (
        <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid #22C55E", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: "#22C55E" }}>
          {successMsg}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={createBot} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "24px", marginBottom: "24px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ color: "#fff", marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>Create New Bot</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Handle *</label>
              <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="e.g. HoopAnalyst" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Display Name *</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. The Hoop Analyst" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Avatar</label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  onClick={() => createAvatarRef.current?.click()}
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: avatarPreview ? `url(${avatarPreview}) center/cover` : "linear-gradient(135deg, #F97316, #EAB308)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    border: "2px dashed rgba(255,255,255,0.3)",
                    flexShrink: 0,
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {!avatarPreview && "Upload"}
                </div>
                <input
                  ref={createAvatarRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarSelect(file, setAvatarFile, setAvatarPreview);
                  }}
                />
                <div style={{ flex: 1 }}>
                  <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="Or paste URL..." style={inputStyle} />
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Personality Preset</label>
              <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)} style={inputStyle}>
                <option value="">Custom / Default</option>
                {PERSONALITY_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>{p.name} - {p.description}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Favorite Team</label>
              <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} style={inputStyle}>
                <option value="">No team (general basketball)</option>
                <optgroup label="NBA">
                  {NBA_TEAMS.map((t) => (
                    <option key={t.abbreviation} value={t.abbreviation}>{t.city} {t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="WNBA">
                  {WNBA_TEAMS.map((t) => (
                    <option key={t.abbreviation} value={t.abbreviation}>{t.city} {t.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio for the bot profile..." rows={2} style={{ ...inputStyle, resize: "vertical" as const }} />
            </div>
          </div>
          <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
            <button type="submit" disabled={creating} style={{ background: "#F97316", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: "600", cursor: "pointer", opacity: creating ? 0.5 : 1 }}>
              {creating ? "Creating..." : "Create Bot"}
            </button>
          </div>
        </form>
      )}

      {/* Bot list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)" }}>Loading bots...</div>
      ) : bots.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.5)" }}>
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>No bots created yet</p>
          <p>Click &quot;+ Create Bot&quot; to add your first AI-powered bot user.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {bots.map((bot) => {
            let personality: { tone?: string; interests?: string[] } = {};
            try { personality = JSON.parse(bot.botPersonality || "{}"); } catch { /* */ }
            const avatar = bot.avatarUrl || bot.image;
            const botTeam = bot.favoriteTeamId ? getTeam(bot.favoriteTeamId) : undefined;

            return (
              <div key={bot.id} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "20px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: avatar ? `url(${avatar}) center/cover` : "linear-gradient(135deg, #F97316, #EAB308)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "18px",
                  flexShrink: 0,
                }}>
                  {!avatar && (bot.displayName?.[0] || "B")}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#fff", fontWeight: "600", fontSize: "15px" }}>{bot.displayName}</span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>@{bot.name}</span>
                    <span style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: bot.botActive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                      color: bot.botActive ? "#22C55E" : "#EF4444",
                      fontWeight: "600",
                    }}>
                      {bot.botActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "4px" }}>
                    {bot.takeCount} takes &middot; {personality.tone || "default"} tone &middot; {(personality.interests || []).join(", ") || "basketball"}
                    {botTeam && <> &middot; <span style={{ color: "#F97316" }}>{getTeamFullName(botTeam)}</span> fan</>}
                  </div>
                  {bot.bio && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "2px" }}>{bot.bio}</div>}
                </div>

                <div style={{ display: "flex", gap: "8px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => openEditModal(bot)}
                    style={{
                      background: "rgba(168,85,247,0.2)",
                      color: "#A855F7",
                      border: "1px solid rgba(168,85,247,0.3)",
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => triggerPost(bot.id)}
                    disabled={posting === bot.id || !bot.botActive}
                    style={{
                      background: "rgba(59,130,246,0.2)",
                      color: "#3B82F6",
                      border: "1px solid rgba(59,130,246,0.3)",
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      opacity: posting === bot.id || !bot.botActive ? 0.5 : 1,
                    }}
                  >
                    {posting === bot.id ? "Posting..." : "Post Now"}
                  </button>
                  <button
                    onClick={() => toggleBot(bot.id, bot.botActive)}
                    style={{
                      background: bot.botActive ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
                      color: bot.botActive ? "#EF4444" : "#22C55E",
                      border: `1px solid ${bot.botActive ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {bot.botActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteBot(bot.id)}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#EF4444",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editBot && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditBot(null); }}
        >
          <form
            onSubmit={saveEdit}
            style={{
              background: "#1A1A1A",
              borderRadius: "16px",
              padding: "32px",
              width: "100%",
              maxWidth: "500px",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: "700", marginBottom: "24px" }}>
              Edit Bot: @{editBot.name}
            </h2>

            {/* Avatar upload */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
              <div
                onClick={() => editAvatarRef.current?.click()}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: editAvatarPreview ? `url(${editAvatarPreview}) center/cover` : "linear-gradient(135deg, #F97316, #EAB308)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: "3px dashed rgba(255,255,255,0.3)",
                  flexShrink: 0,
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F97316"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              >
                {!editAvatarPreview && (editBot.displayName?.[0] || "B")}
              </div>
              <input
                ref={editAvatarRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarSelect(file, setEditAvatarFile, setEditAvatarPreview);
                }}
              />
              <div>
                <button
                  type="button"
                  onClick={() => editAvatarRef.current?.click()}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "6px",
                    padding: "6px 16px",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Change Avatar
                </button>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "4px" }}>Click avatar or button to upload</p>
              </div>
            </div>

            {/* Display Name */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Display Name</label>
              <input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} style={inputStyle} />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Bio</label>
              <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" as const }} />
            </div>

            {/* Personality */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Personality Preset</label>
              <select value={editPreset} onChange={(e) => setEditPreset(e.target.value)} style={inputStyle}>
                <option value="">Keep Current</option>
                {PERSONALITY_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>{p.name} - {p.description}</option>
                ))}
              </select>
            </div>

            {/* Favorite Team */}
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Favorite Team <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>(~80% of takes will focus on this team)</span></label>
              <select value={editTeam} onChange={(e) => setEditTeam(e.target.value)} style={inputStyle}>
                <option value="">No team (general basketball)</option>
                <optgroup label="NBA">
                  {NBA_TEAMS.map((t) => (
                    <option key={t.abbreviation} value={t.abbreviation}>{t.city} {t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="WNBA">
                  {WNBA_TEAMS.map((t) => (
                    <option key={t.abbreviation} value={t.abbreviation}>{t.city} {t.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setEditBot(null)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: "#F97316",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontWeight: "600",
                  cursor: "pointer",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
