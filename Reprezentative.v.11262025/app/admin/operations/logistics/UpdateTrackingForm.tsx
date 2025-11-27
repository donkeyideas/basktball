"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  trackingNumber?: string | null;
  carrier?: string | null;
};

export function UpdateTrackingForm({
  orderId,
  trackingNumber,
  carrier,
}: Props) {
  const router = useRouter();
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [carrierValue, setCarrierValue] = useState(carrier ?? "");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!tracking || !carrierValue) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/operations/orders/${encodeURIComponent(orderId)}/tracking`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingNumber: tracking,
            carrier: carrierValue,
          }),
        },
      );
      if (!res.ok) {
        throw new Error("Failed to update tracking");
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 text-[0.7rem]">
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="Tracking #"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          className="h-7 w-28 rounded-md border border-neutral-800 bg-black px-2 text-[0.7rem] text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
        />
        <input
          type="text"
          placeholder="Carrier"
          value={carrierValue}
          onChange={(e) => setCarrierValue(e.target.value)}
          className="h-7 w-20 rounded-md border border-neutral-800 bg-black px-2 text-[0.7rem] text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500"
        />
      </div>
      <button
        type="button"
        disabled={saving || !tracking || !carrierValue}
        onClick={onSave}
        className="h-6 rounded-md border border-sky-500 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-sky-300 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}


