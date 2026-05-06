import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
}

async function createPaymentIntent(
  amount: number,
  email: string,
  metadata: Record<string, string>,
) {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "usd",
    receipt_email: email,
    automatic_payment_methods: { enabled: true },
    metadata,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { amount, email, orderId } = req.body || {};
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
    if (!email) return res.status(400).json({ error: "Email is required" });

    const paymentIntent = await createPaymentIntent(amount, email, { orderId: orderId || "" });
    if (!paymentIntent.client_secret)
      return res.status(500).json({ error: "Failed to get payment secret" });

    return res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment intent creation failed";
    return res.status(500).json({ error: message, success: false });
  }
}
