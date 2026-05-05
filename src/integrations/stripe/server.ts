import Stripe from "stripe";

let stripe: Stripe | null = null;

function getStripe() {
  if (stripe) return stripe;

  const secretKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;

  if (!secretKey) {
    const error = "STRIPE_SECRET_KEY environment variable is not configured. Add it to .env file.";
    console.error(error);
    throw new Error(error);
  }

  stripe = new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
  });

  return stripe;
}

export async function createPaymentIntent(
  amount: number,
  email: string,
  metadata: Record<string, string>,
) {
  const stripeClient = getStripe();

  try {
    console.log("Creating payment intent:", { amount, email, metadata });

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      receipt_email: email,
      metadata,
    });

    console.log("Payment intent created:", paymentIntent.id);
    return paymentIntent;
  } catch (error) {
    console.error("Stripe API error:", error);
    throw error;
  }
}
