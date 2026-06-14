import { loadStripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const stripeMode = publishableKey?.startsWith("pk_test_")
  ? "test"
  : publishableKey?.startsWith("pk_live_")
    ? "live"
    : null;

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
