import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import Stripe from "stripe";

type PaidPaymentIntent = {
  id: string;
  amount_received: number;
  currency: string;
  receipt_email: string | null;
  metadata: Record<string, string>;
  status: string;
};

const defaultAdminEmails = [
  "jorizrule0@gmail.com",
  "g@gxzpeptides.com",
  "g@gxzhealth.com",
  "g@zxgwellness.com",
];

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(key);
}

function getAdminEmails() {
  return (process.env.ORDER_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

async function getRawBody(req: VercelRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function sendPaidPaymentEmail(paymentIntent: PaidPaymentIntent) {
  const amount = (paymentIntent.amount_received / 100).toFixed(2);
  const customerEmail =
    paymentIntent.receipt_email || paymentIntent.metadata.customerEmail || "No email on payment";
  const dashboardUrl = `https://dashboard.stripe.com/payments/${paymentIntent.id}`;
  const discount = Number(paymentIntent.metadata.discount || 0);
  const shipping = Number(paymentIntent.metadata.shipping || 0);
  const cartTotal = paymentIntent.metadata.cartTotal || amount;
  const recipients = getAdminEmails();
  const to = recipients.length > 0 ? recipients : defaultAdminEmails;

  await getResend().emails.send({
    from: "ZXG Wellness <admin@zxgwellness.com>",
    to,
    subject: `Stripe Payment Approved - $${amount}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2>Stripe payment approved</h2>
        <p>A customer payment has succeeded in Stripe.</p>
        <table style="border-collapse:collapse;">
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Total Paid</td><td>$${cartTotal} ${paymentIntent.currency.toUpperCase()}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Reusable Pen Discount</td><td>${discount > 0 ? `-$${discount.toFixed(2)}` : "$0.00"}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Shipping</td><td>${shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Customer</td><td>${customerEmail}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Payment ID</td><td>${paymentIntent.id}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Status</td><td>${paymentIntent.status}</td></tr>
        </table>
        <p><a href="${dashboardUrl}">View payment in Stripe Dashboard</a></p>
      </div>
    `,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret)
    return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET is not configured." });

  try {
    const stripe = getStripe();
    const signature = req.headers["stripe-signature"];
    if (!signature || Array.isArray(signature)) {
      return res.status(400).json({ error: "Missing Stripe signature" });
    }

    const rawBody = await getRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "payment_intent.succeeded") {
      await sendPaidPaymentEmail(event.data.object as PaidPaymentIntent);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    console.error("stripe-webhook error:", message);
    return res.status(400).json({ error: message });
  }
}
