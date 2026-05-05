import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, type FormEvent } from "react";
import type { StripeCardElement } from "@stripe/stripe-js";

interface PaymentFormProps {
  clientSecret: string;
  isProcessing: boolean;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PaymentForm({ clientSecret, isProcessing, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Payment system not ready");
      return;
    }

    const cardElement = elements.getElement(CardElement) as StripeCardElement | null;
    if (!cardElement) {
      onError("Card field not found");
      return;
    }

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        onError(result.error.message || "Payment failed");
      } else if (result.paymentIntent?.status === "succeeded") {
        onSuccess();
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : "Payment failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="border border-gold/20 rounded p-4 bg-charcoal/50">
        <CardElement
          onChange={(e) => setCardComplete(e.complete)}
          options={{
            style: {
              base: {
                fontSize: "14px",
                color: "#ffffff",
                "::placeholder": {
                  color: "#888888",
                },
              },
              invalid: {
                color: "#fa755a",
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!cardComplete || isProcessing}
        className="w-full px-6 py-3 bg-gold text-obsidian font-medium uppercase tracking-luxury disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-light transition-colors"
      >
        {isProcessing ? "Processing..." : "Complete Payment"}
      </button>
    </form>
  );
}
