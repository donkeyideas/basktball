"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components";
import { signInWithPopup } from "firebase/auth";
import { auth as firebaseAuth, googleProvider } from "@/lib/firebase/config";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/forum";
  const isMobile = searchParams.get("mobile") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      if (isMobile) {
        // Mobile flow: exchange Firebase token for mobile JWT, redirect to app
        const res = await fetch("/api/mobile/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firebaseToken: idToken }),
        });
        if (!res.ok) {
          setError("Sign-in failed. Please try again.");
          return;
        }
        const data = await res.json();
        const userData = encodeURIComponent(JSON.stringify(data.user));
        window.location.href = `basktball://auth?token=${data.token}&user=${userData}`;
        return;
      }

      const signInResult = await signIn("credentials", {
        firebaseToken: idToken,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Google sign-in failed. Please try again.");
      } else {
        router.push(callbackUrl);
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "var(--dark-gray)",
        borderRadius: "12px",
        border: "1px solid #333",
        padding: "40px",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{
            fontFamily: "var(--font-anton)",
            fontSize: "32px",
            color: "#FF6B35",
            marginBottom: "8px",
          }}>
            SIGN IN
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Join the basketball conversation
          </p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #444",
            background: "#fff",
            color: "#333",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontFamily: "var(--font-inter)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          margin: "24px 0",
          color: "var(--text-faint)",
          fontSize: "13px",
        }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
          OR
          <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
        </div>

        {/* Credentials form */}
        <form onSubmit={handleCredentialsLogin}>
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
              color: "#EF4444",
              fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "6px", fontFamily: "var(--font-inter)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #333",
                background: "var(--black)",
                color: "var(--white)",
                fontSize: "15px",
                fontFamily: "var(--font-inter)",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "6px", fontFamily: "var(--font-inter)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #333",
                background: "var(--black)",
                color: "var(--white)",
                fontSize: "15px",
                fontFamily: "var(--font-inter)",
                outline: "none",
                boxSizing: "border-box",
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: loading ? "#995030" : "#FF6B35",
              color: "var(--white)",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-inter)",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{
          textAlign: "center",
          marginTop: "24px",
          color: "var(--text-muted)",
          fontSize: "14px",
          fontFamily: "var(--font-inter)",
        }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#FF6B35", textDecoration: "none" }}>
            Create one
          </Link>
        </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
