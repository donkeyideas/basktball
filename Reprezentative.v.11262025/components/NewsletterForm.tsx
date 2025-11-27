"use client";

import { FormEvent, useState } from "react";

type Props = {
  buttonText: string;
};

export function NewsletterForm({ buttonText }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!email) {
      setStatus("Please enter your email.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Subscription failed.");
        return;
      }

      setStatus("Thank you for subscribing.");
      setEmail("");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Newsletter subscribe failed:", error);
      }
      setStatus("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        required
        placeholder="Email Address"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="h-10 flex-1 rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
      />
      <button
        type="submit"
        disabled={submitting}
        className="h-10 rounded-md bg-white px-5 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Subscribing..." : buttonText}
      </button>
      {status && (
        <p className="mt-1 text-[0.7rem] text-neutral-400 sm:ml-2 sm:mt-0">
          {status}
        </p>
      )}
    </form>
  );
}


