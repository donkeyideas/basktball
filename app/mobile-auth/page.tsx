"use client";

import { useState, useEffect, useRef } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
} from "firebase/auth";
import { auth as firebaseAuth, googleProvider } from "@/lib/firebase/config";

export default function MobileAuthPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scheme = params.get("scheme");
    const sid = params.get("sid");
    if (scheme) {
      sessionStorage.setItem("mobile_auth_scheme", scheme);
    }
    if (sid) {
      sessionStorage.setItem("mobile_auth_sid", sid);
    }

    handleAuth();
  }, []);

  async function exchangeAndStore(idToken: string) {
    if (handled.current) return;
    handled.current = true;

    // Exchange Firebase token for our JWT
    const res = await fetch("/api/mobile/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebaseToken: idToken }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Sign-in failed");
    }

    const data = await res.json();
    const sid = sessionStorage.getItem("mobile_auth_sid");

    if (sid) {
      // Store token server-side so the app can retrieve it
      await fetch("/api/mobile/auth/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid, token: data.token, user: data.user }),
      });
    }

    sessionStorage.removeItem("mobile_auth_scheme");
    sessionStorage.removeItem("mobile_auth_sid");
    setSuccess(true);
  }

  async function handleAuth() {
    // 1. Try getRedirectResult first
    try {
      const result = await getRedirectResult(firebaseAuth);
      if (result) {
        const idToken = await result.user.getIdToken();
        await exchangeAndStore(idToken);
        return;
      }
    } catch (err: unknown) {
      console.error("getRedirectResult error:", err);
    }

    // 2. Fallback: check if Firebase auth state has a user
    try {
      const user = await new Promise<any>((resolve) => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (u) => {
          unsubscribe();
          resolve(u);
        });
        setTimeout(() => resolve(null), 3000);
      });

      if (user && sessionStorage.getItem("mobile_auth_sid")) {
        const idToken = await user.getIdToken();
        await exchangeAndStore(idToken);
        return;
      }
    } catch (err: unknown) {
      console.error("Auth state check error:", err);
    }

    setLoading(false);
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    // Try signInWithPopup first
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      await exchangeAndStore(idToken);
      return;
    } catch (popupErr: unknown) {
      const popupError = popupErr as { code?: string };
      console.warn("Popup failed, trying redirect:", popupError.code);
    }

    try {
      await signInWithRedirect(firebaseAuth, googleProvider);
    } catch (err: unknown) {
      const firebaseError = err as { message?: string };
      setError(
        firebaseError.message || "Google sign-in failed. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        background: "#0D0D0D",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "#1A1A1A",
          borderRadius: "16px",
          border: "1px solid #333",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            color: "#FFFFFF",
            marginBottom: "8px",
            fontWeight: "900",
            letterSpacing: "3px",
          }}
        >
          BASKTBALL
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "14px",
            marginBottom: "36px",
          }}
        >
          Sign in to continue to the app
        </p>

        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "20px",
              color: "#EF4444",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {success ? (
          <div>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(34,197,94,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "32px",
              }}
            >
              &#10003;
            </div>
            <p
              style={{
                color: "#22C55E",
                fontSize: "20px",
                fontWeight: "700",
                marginBottom: "16px",
              }}
            >
              Signed in successfully!
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "16px",
                lineHeight: "1.5",
                marginBottom: "8px",
              }}
            >
              Close this window to return to the app.
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "14px",
              }}
            >
              Tap the <strong style={{ color: "rgba(255,255,255,0.6)" }}>X</strong> button at the top left
            </p>
          </div>
        ) : loading ? (
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
            Loading...
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: "#fff",
              color: "#333",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        )}
      </div>
    </main>
  );
}
