"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

function CheckoutPaymentInner() {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!stripe || !elements) {
      setStatus("Payment is not ready yet. Please try again.");
      return;
    }

    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setStatus(error.message ?? "Payment failed.");
        return;
      }

      if (!paymentIntent) {
        setStatus("Payment could not be confirmed.");
        return;
      }

      const response = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Failed to finalize order.");
        return;
      }

      window.location.href = "/account/orders";
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Checkout payment error:", error);
      }
      setStatus("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement />
      {status && (
        <p className="mt-1 text-[0.7rem] text-red-400">{status}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-white px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Processing..." : "Place Order"}
      </button>
    </form>
  );
}

type CheckoutPaymentProps = {
  clientSecret: string | null;
};

export function CheckoutPayment({ clientSecret }: CheckoutPaymentProps) {
  if (!stripePromise || !clientSecret) {
    return (
      <p className="text-[0.7rem] text-neutral-500">
        Payment is not available. Please try again later.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
        },
      }}
    >
      <CheckoutPaymentInner />
    </Elements>
  );
}


