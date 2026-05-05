import type Stripe from "stripe";
import { createPaymentIntent } from "@/integrations/stripe/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, email, orderId } = body as {
      amount: number;
      email: string;
      orderId?: string;
    };

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Creating payment intent for ${email}, amount: ${amount}`);

    const paymentIntent = await createPaymentIntent(amount, email, {
      orderId: orderId || "",
    });

    const secret = (paymentIntent as Stripe.PaymentIntent).client_secret;

    if (!secret) {
      return new Response(JSON.stringify({ error: "Failed to get payment secret" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: secret,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Payment error:", error);
    const message = error instanceof Error ? error.message : "Payment intent creation failed";
    return new Response(JSON.stringify({ error: message, success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
