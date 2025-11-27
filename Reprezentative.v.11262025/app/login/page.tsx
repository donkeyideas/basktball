"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account/orders";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!email || !password) {
      setStatus("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (!result) {
        setStatus("Unexpected error. Please try again.");
        return;
      }

      if (result.error) {
        setStatus("Invalid email or password.");
        return;
      }

      window.location.href = result.url ?? callbackUrl;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Login error:", error);
      }
      setStatus("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const externalError =
    errorParam === "CredentialsSignin"
      ? "Invalid email or password."
      : errorParam
      ? "Unable to sign in. Please try again."
      : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="w-full max-w-sm rounded-md border border-neutral-900 bg-neutral-950 px-6 py-8 text-sm shadow-lg">
        <div className="mb-6 text-center">
          <p className="text-[0.75rem] uppercase tracking-[0.18em] text-neutral-500">
            Reprezentative
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Enter your email and password to access your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
            />
          </div>

          {(status || externalError) && (
            <p className="text-[0.7rem] text-red-400">
              {status ?? externalError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-white px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-[0.7rem] text-neutral-500">
          By continuing, you agree to Reprezentative&apos;s terms of use and
          privacy policy.
        </p>

        <div className="mt-4 text-[0.7rem] text-neutral-400">
          <span>Need an account? </span>
          <span className="text-neutral-500">
            (Registration flow will be added later.)
          </span>
        </div>
      </div>
    </main>
  );
}


