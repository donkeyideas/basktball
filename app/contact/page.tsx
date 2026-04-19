"use client";

import { useState } from "react";
import { Header, Footer } from "@/components";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send message");
        return;
      }

      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "60px 20px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "clamp(32px, 5vw, 48px)",
            color: "var(--white)",
            marginBottom: "8px",
          }}>
            CONTACT US
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "40px", fontSize: "16px" }}>
            Have a question, feedback, or partnership inquiry? Send us a message and we&apos;ll get back to you.
          </p>

          {success ? (
            <div style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>&#10003;</div>
              <h2 style={{ fontSize: "24px", marginBottom: "8px", color: "#10B981" }}>Message Sent!</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
                Thanks for reaching out. We&apos;ll get back to you as soon as possible.
              </p>
              <button
                onClick={() => setSuccess(false)}
                style={{
                  padding: "10px 24px",
                  background: "var(--orange)",
                  color: "var(--white)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: "600",
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {error && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  color: "#EF4444",
                  fontSize: "14px",
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Your name"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "var(--border-subtle)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--white)",
                      fontSize: "15px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "var(--border-subtle)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--white)",
                      fontSize: "15px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  placeholder="What's this about?"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "var(--border-subtle)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--white)",
                    fontSize: "15px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>
                  Message *
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  placeholder="Tell us what's on your mind..."
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "var(--border-subtle)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "var(--white)",
                    fontSize: "15px",
                    outline: "none",
                    resize: "vertical",
                    minHeight: "120px",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "14px 32px",
                  background: submitting ? "rgba(255, 107, 53, 0.5)" : "var(--orange)",
                  color: "var(--white)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  fontWeight: "700",
                  fontFamily: "var(--font-inter)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  alignSelf: "flex-start",
                }}
              >
                {submitting ? "SENDING..." : "SEND MESSAGE"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
