import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/integrations/stripe/client";
import type { PropsWithChildren } from "react";

export function StripeProvider({ children }: PropsWithChildren) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
