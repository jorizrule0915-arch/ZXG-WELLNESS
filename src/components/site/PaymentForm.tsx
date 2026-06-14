import { PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import { useState, type FormEvent } from "react";

interface PaymentFormProps {
  isProcessing: boolean;
  onSuccess: (checkoutSessionId: string) => void | Promise<void>;
  onError: (error: string) => void;
  customerEmail: string;
  shippingContact: {
    name: string;
    address: {
      country: string;
      line1: string;
      city: string;
      state: string;
      postal_code: string;
    };
  };
}

export function PaymentForm({
  isProcessing,
  onSuccess,
  onError,
  customerEmail,
  shippingContact,
}: PaymentFormProps) {
  const checkoutResult = useCheckoutElements();
  const [ready, setReady] = useState(false);
  const [localProcessing, setLocalProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (checkoutResult.type === "loading") {
      onError("Payment system is still loading. Please try again in a moment.");
      return;
    }

    if (checkoutResult.type === "error") {
      onError(checkoutResult.error.message || "Payment system failed to load.");
      return;
    }

    setLocalProcessing(true);

    try {
      const result = await checkoutResult.checkout.confirm({
        redirect: "if_required",
        email: customerEmail,
        shippingAddress: shippingContact,
        billingAddress: shippingContact,
      });

      if (result.type === "error") {
        onError(result.error.message || "Payment failed");
        return;
      }

      if (
        result.session.status.type === "complete" &&
        result.session.status.paymentStatus === "paid"
      ) {
        await onSuccess(result.session.id);
        return;
      }

      onError("Checkout did not complete. Please try again or use another card.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLocalProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        onReady={() => setReady(true)}
        options={{
          layout: { type: "accordion", defaultCollapsed: false, radios: "never" },
          paymentMethodOrder: ["card"],
          wallets: { applePay: "never", googlePay: "never", link: "never" },
        }}
      />

      <button
        type="submit"
        disabled={!ready || isProcessing || localProcessing || checkoutResult.type !== "success"}
        className="w-full px-6 py-3 bg-gold text-obsidian font-medium uppercase tracking-luxury disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-light transition-colors"
      >
        {isProcessing || localProcessing ? "Processing..." : "Complete Payment"}
      </button>
    </form>
  );
}
