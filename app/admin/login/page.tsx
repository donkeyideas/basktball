"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--darker-gray)"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        padding: "40px",
        background: "var(--dark-gray)",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "36px",
            color: "var(--orange)",
            marginBottom: "10px"
          }}>
            BASKTBALL
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "3px",
            fontSize: "14px"
          }}>
            ADMIN LOGIN
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid var(--red)",
              color: "var(--red)",
              padding: "12px",
              marginBottom: "20px",
              fontSize: "14px",
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@basktball.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              width: "100%",
              marginTop: "20px",
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <p style={{
          marginTop: "30px",
          textAlign: "center",
          fontSize: "12px",
          color: "rgba(255,255,255,0.3)"
        }}>
          Protected admin area. Authorized access only.
        </p>
      </div>
    </div>
  );
}
