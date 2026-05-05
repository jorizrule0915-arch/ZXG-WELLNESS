import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";
import { createPaymentIntent } from "../src/integrations/stripe/server";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const { amount, email, orderId } = body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log(`Creating payment intent for ${email}, amount: ${amount}`);

    const paymentIntent = await createPaymentIntent(amount, email, {
      orderId: orderId || "",
    });

    const secret = (paymentIntent as Stripe.PaymentIntent).client_secret;

    if (!secret) {
      return res.status(500).json({ error: "Failed to get payment secret" });
    }

    return res.status(200).json({
      success: true,
      clientSecret: secret,
    });
  } catch (error) {
    console.error("Payment error:", error);
    const message = error instanceof Error ? error.message : "Payment intent creation failed";
    return res.status(500).json({ error: message, success: false });
  }
}
