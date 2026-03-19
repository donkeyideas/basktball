"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header, Footer } from "@/components";

interface Profile {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  image: string | null;
  location: string | null;
  role: string;
  takeCount: number;
  followerCount: number;
  followingCount: number;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch profile
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/account/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => {
        setProfile(data.profile);
        setDisplayName(data.profile.displayName || "");
        setHandle(data.profile.name || "");
        setBio(data.profile.bio || "");
        setLocation(data.profile.location || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status]);

  // Save profile
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, handle, bio, location }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to update profile");
        return;
      }

      setProfile((prev) => (prev ? { ...prev, ...data.profile } : prev));
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      // Refresh NextAuth session so header name/avatar update immediately
      await update();
    } catch {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }, [displayName, handle, bio, location, update]);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large (max 5MB)");
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/account/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to upload avatar");
          setUploadingAvatar(false);
          return;
        }

        setProfile((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl } : prev);
        setSuccess("Avatar updated!");
        setTimeout(() => setSuccess(null), 3000);
        // Trigger NextAuth session update to refresh avatar in header
        await update();
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Failed to upload avatar");
      setUploadingAvatar(false);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  if (status === "loading" || loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "60px 20px" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-inter)" }}>Loading profile...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const avatarSrc = profile?.avatarUrl || profile?.image || session?.user?.image;

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "60px 20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          {/* Page Title */}
          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "28px",
            color: "#FF6B35",
            letterSpacing: "2px",
            marginBottom: "32px",
          }}>
            EDIT PROFILE
          </h1>

          {/* Avatar Section */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              style={{ display: "none" }}
            />
            <div
              onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#FF6B35",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: "700",
                color: "#fff",
                overflow: "hidden",
                fontFamily: "var(--font-inter)",
                flexShrink: 0,
                cursor: "pointer",
                position: "relative",
                opacity: uploadingAvatar ? 0.6 : 1,
              }}
              title="Click to change avatar"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (profile?.displayName || profile?.name || "U").charAt(0).toUpperCase()
              )}
              {!uploadingAvatar && (
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "rgba(0,0,0,0.6)",
                  padding: "2px 0",
                  fontSize: "10px",
                  textAlign: "center",
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                }}>
                  EDIT
                </div>
              )}
              {uploadingAvatar && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontFamily: "var(--font-inter)",
                }}>
                  ...
                </div>
              )}
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-inter)",
                fontWeight: "700",
                fontSize: "18px",
                color: "#fff",
              }}>
                {profile?.displayName || profile?.name}
              </div>
              <div style={{
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                color: "rgba(255,255,255,0.4)",
              }}>
                @{profile?.name} · Joined {new Date(profile?.createdAt || "").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{
            display: "flex",
            gap: "24px",
            marginBottom: "32px",
            padding: "16px 20px",
            background: "#1A1A1A",
            borderRadius: "12px",
            border: "1px solid #2a2a2a",
          }}>
            {[
              { count: profile?.takeCount || 0, label: "Takes" },
              { count: profile?.followerCount || 0, label: "Followers" },
              { count: profile?.followingCount || 0, label: "Following" },
            ].map(({ count, label }) => (
              <div key={label}>
                <div style={{
                  fontFamily: "var(--font-inter)",
                  fontWeight: "700",
                  fontSize: "18px",
                  color: "#fff",
                }}>
                  {count}
                </div>
                <div style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div style={{
            background: "#1A1A1A",
            borderRadius: "12px",
            border: "1px solid #2a2a2a",
            padding: "24px",
          }}>
            {/* Success/Error messages */}
            {success && (
              <div style={{
                padding: "10px 16px",
                borderRadius: "8px",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.3)",
                color: "#22c55e",
                fontFamily: "var(--font-inter)",
                fontSize: "14px",
                marginBottom: "20px",
              }}>
                {success}
              </div>
            )}
            {error && (
              <div style={{
                padding: "10px 16px",
                borderRadius: "8px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#EF4444",
                fontFamily: "var(--font-inter)",
                fontSize: "14px",
                marginBottom: "20px",
              }}>
                {error}
              </div>
            )}

            {/* Display Name */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                fontWeight: "600",
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontFamily: "var(--font-inter)",
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#FF6B35"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
              />
              <div style={{
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                color: "rgba(255,255,255,0.3)",
                marginTop: "4px",
              }}>
                {displayName.length}/30 characters. This is how others see you on The Court.
              </div>
            </div>

            {/* Handle */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                fontWeight: "600",
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}>
                Handle
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "var(--font-inter)",
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.35)",
                  pointerEvents: "none",
                }}>
                  @
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  maxLength={20}
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 28px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontFamily: "var(--font-inter)",
                    fontSize: "15px",
                    outline: "none",
                    transition: "border-color 0.15s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#FF6B35"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
                />
              </div>
              <div style={{
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                color: "rgba(255,255,255,0.3)",
                marginTop: "4px",
              }}>
                {handle.length}/20 characters. Letters, numbers, and underscores only.
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                fontWeight: "600",
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Tell people about yourself..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontFamily: "var(--font-inter)",
                  fontSize: "15px",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "70px",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#FF6B35"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
              />
              <div style={{
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                color: "rgba(255,255,255,0.3)",
                marginTop: "4px",
              }}>
                {bio.length}/160 characters
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                fontWeight: "600",
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}>
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={50}
                placeholder="e.g. Los Angeles, CA"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontFamily: "var(--font-inter)",
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#FF6B35"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
              />
            </div>

            {/* Email (read-only) */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                fontWeight: "600",
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}>
                Email
              </label>
              <input
                type="text"
                value={profile?.email || ""}
                disabled
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "var(--font-inter)",
                  fontSize: "15px",
                  cursor: "not-allowed",
                  boxSizing: "border-box",
                }}
              />
              <div style={{
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                color: "rgba(255,255,255,0.2)",
                marginTop: "4px",
              }}>
                Email cannot be changed.
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !displayName.trim() || handle.trim().length < 3}
              style={{
                width: "100%",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                background: saving || !displayName.trim() || handle.trim().length < 3 ? "rgba(255,107,53,0.3)" : "#FF6B35",
                color: saving || !displayName.trim() || handle.trim().length < 3 ? "rgba(255,255,255,0.4)" : "#fff",
                fontFamily: "var(--font-inter)",
                fontSize: "15px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1px",
                cursor: saving || !displayName.trim() || handle.trim().length < 3 ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
