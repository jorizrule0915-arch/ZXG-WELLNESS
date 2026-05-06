import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/integrations/stripe/client";
import type { PropsWithChildren } from "react";

export function StripeProvider({
  children,
  clientSecret,
}: PropsWithChildren<{ clientSecret: string }>) {
  if (!stripePromise) return <>{children}</>;
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "night", variables: { colorPrimary: "#c9a84c" } },
      }}
    >
      {children}
    </Elements>
  );
}
