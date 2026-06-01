import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { calculateTrustedCart } from "./_checkout";
import { enforceRateLimit, requireUser, sendApiError, setJsonHeaders } from "./_security";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setJsonHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    enforceRateLimit(req, "orders", { limit: 20, windowMs: 60_000 });
    const { supabase, user } = await requireUser(req);
    const { paymentIntentId, shipping, items } = req.body || {};
    if (!paymentIntentId) {
      return res.status(400).json({ error: "paymentIntentId is required" });
    }
    if (
      !shipping?.email ||
      !shipping?.name ||
      !shipping?.address ||
      !shipping?.city ||
      !shipping?.state ||
      !shipping?.zip
    ) {
      return res.status(400).json({ error: "Shipping details are required" });
    }

    const trustedCart = await calculateTrustedCart(supabase, items);
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment has not succeeded" });
    }
    if (paymentIntent.metadata.userId !== user.id) {
      return res.status(403).json({ error: "Payment does not belong to this user" });
    }
    if (paymentIntent.amount_received !== trustedCart.amountCents) {
      return res.status(400).json({ error: "Payment amount does not match cart total" });
    }
    if (paymentIntent.metadata.cartHash !== trustedCart.cartHash) {
      return res.status(400).json({ error: "Payment cart does not match submitted order" });
    }

    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle();
    if (existing) return res.status(200).json({ success: true, orderId: existing.id });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "paid",
        total: trustedCart.total,
        email: String(shipping.email),
        shipping_name: String(shipping.name),
        shipping_address: String(shipping.address),
        shipping_city: String(shipping.city),
        shipping_state: String(shipping.state),
        shipping_zip: String(shipping.zip),
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select("id")
      .single();

    if (orderError || !order) throw orderError ?? new Error("Order creation failed");

    const { error: itemsError } = await supabase.from("order_items").insert(
      trustedCart.items.map((item) => ({
        order_id: order.id,
        ...item,
      })),
    );
    if (itemsError) throw itemsError;

    return res.status(200).json({ success: true, orderId: order.id });
  } catch (error) {
    return sendApiError(res, error);
  }
}
