import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";
import { stripePromise } from "@/integrations/stripe/client";
import type { PropsWithChildren } from "react";

export function StripeProvider({
  children,
  clientSecret,
}: PropsWithChildren<{ clientSecret: string }>) {
  if (!stripePromise) return <>{children}</>;
  return (
    <CheckoutElementsProvider
      stripe={stripePromise}
      options={{
        clientSecret,
        elementsOptions: {
          appearance: { theme: "night", variables: { colorPrimary: "#c9a84c" } },
        },
      }}
    >
      {children}
    </CheckoutElementsProvider>
  );
}
