import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, type FormEvent } from "react";

interface PaymentFormProps {
  isProcessing: boolean;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export function PaymentForm({ isProcessing, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [localProcessing, setLocalProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Payment system not ready");
      return;
    }

    setLocalProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Payment failed");
      } else if (paymentIntent?.status === "succeeded") {
        onSuccess(paymentIntent.id);
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLocalProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement onReady={() => setReady(true)} />

      <button
        type="submit"
        disabled={!ready || isProcessing || localProcessing}
        className="w-full px-6 py-3 bg-gold text-obsidian font-medium uppercase tracking-luxury disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-light transition-colors"
      >
        {isProcessing || localProcessing ? "Processing..." : "Complete Payment"}
      </button>
    </form>
  );
}
