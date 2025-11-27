"use client";

import { useState, FormEvent } from "react";

type ProfileFormProps = {
  user: {
    email: string;
    name: string | null;
    phone: string | null;
    marketingEmails: boolean;
    orderEmails: boolean;
    newArrivalsEmails: boolean;
  };
};

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [marketingEmails, setMarketingEmails] = useState(
    user.marketingEmails,
  );
  const [orderEmails, setOrderEmails] = useState(user.orderEmails);
  const [newArrivalsEmails, setNewArrivalsEmails] = useState(
    user.newArrivalsEmails,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          marketingEmails,
          orderEmails,
          newArrivalsEmails,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error ?? "Failed to update profile.");
        return;
      }
      setStatus("Profile updated.");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Profile update failed:", error);
      }
      setStatus("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-md border border-neutral-900 bg-neutral-950 p-4 text-xs"
    >
      <div className="space-y-1">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-neutral-500">
          Account
        </p>
        <p className="text-sm font-semibold text-white">
          {user.email}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
          />
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-neutral-800 bg-black/40 p-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          Email preferences
        </p>
        <label className="flex items-center gap-2 text-[0.75rem] text-neutral-200">
          <input
            type="checkbox"
            checked={marketingEmails}
            onChange={(event) => setMarketingEmails(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-neutral-700 bg-black text-emerald-500"
          />
          Marketing emails
        </label>
        <label className="flex items-center gap-2 text-[0.75rem] text-neutral-200">
          <input
            type="checkbox"
            checked={orderEmails}
            onChange={(event) => setOrderEmails(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-neutral-700 bg-black text-emerald-500"
          />
          Order updates
        </label>
        <label className="flex items-center gap-2 text-[0.75rem] text-neutral-200">
          <input
            type="checkbox"
            checked={newArrivalsEmails}
            onChange={(event) => setNewArrivalsEmails(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-neutral-700 bg-black text-emerald-500"
          />
          New arrivals &amp; launches
        </label>
      </div>

      {status && (
        <p className="text-[0.7rem] text-neutral-400">
          {status}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}


