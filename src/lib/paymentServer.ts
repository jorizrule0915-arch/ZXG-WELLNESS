import { createPaymentIntent } from "@/integrations/stripe/server";
import type Stripe from "stripe";

export async function createPaymentHandler(amount: number, email: string, orderId?: string) {
  try {
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Creating payment intent for ${email}, amount: ${amount}`);

    const paymentIntent = await createPaymentIntent(amount, email, {
      orderId: orderId || "",
    });

    const secret = (paymentIntent as Stripe.PaymentIntent).client_secret;

    if (!secret) {
      throw new Error("Failed to get payment secret");
    }

    return {
      success: true,
      clientSecret: secret,
    };
  } catch (error) {
    console.error("Payment error:", error);
    const message = error instanceof Error ? error.message : "Payment intent creation failed";
    throw new Error(message);
  }
}
