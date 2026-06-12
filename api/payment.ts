import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { calculateTrustedCart } from "../server/checkout";
import { enforceRateLimit, requireUser, sendApiError, setJsonHeaders } from "../server/security";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
}

async function createPaymentIntent(
  amountCents: number,
  email: string,
  metadata: Record<string, string>,
) {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    receipt_email: email,
    automatic_payment_methods: { enabled: true },
    metadata,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setJsonHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    enforceRateLimit(req, "payment", { limit: 20, windowMs: 60_000 });
    const { supabase, user } = await requireUser(req);
    const { email, items } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email is required" });

    const trustedCart = await calculateTrustedCart(supabase, items);
    const paymentIntent = await createPaymentIntent(trustedCart.amountCents, email, {
      userId: user.id,
      customerEmail: String(email),
      cartTotal: trustedCart.total.toFixed(2),
      discount: trustedCart.discount.toFixed(2),
      shipping: trustedCart.shipping.toFixed(2),
      cartHash: trustedCart.cartHash,
    });
    if (!paymentIntent.client_secret)
      return res.status(500).json({ error: "Failed to get payment secret" });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: trustedCart.total,
    });
  } catch (error) {
    return sendApiError(res, error);
  }
}
