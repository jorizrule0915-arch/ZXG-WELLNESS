import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useState, type FormEvent } from "react";
import { useCart, cartSummary, cartItemKey, type CartItem } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { imageFor } from "@/lib/productImages";
import { StripeProvider } from "@/components/site/StripeProvider";
import { PaymentForm } from "@/components/site/PaymentForm";
import { authFetch, readApiJson } from "@/lib/api";
import { stripeMode } from "@/integrations/stripe/client";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

type CartSummary = ReturnType<typeof cartSummary>;

function friendlyEmailError(error?: string) {
  if (!error) return "";
  return error.replace(/\s+/g, " ").trim().slice(0, 320);
}

function CheckoutPage() {
  const { items, clear } = useCart();
  const { user } = useAuth();
  const summary = cartSummary(items);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const nav = useNavigate();

  const handleShippingSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    if (!user) {
      nav({ to: "/login" });
      return;
    }

    const fd = new FormData(e.currentTarget);
    setSubmitting(true);

    try {
      // Create payment intent
      const email = fd.get("email");
      if (!summary.total || summary.total <= 0) {
        throw new Error("Cart total is invalid");
      }
      if (!email) {
        throw new Error("Email is required");
      }
      if (!stripeMode) {
        throw new Error("Stripe publishable key is missing or invalid. Check Vercel env vars.");
      }

      const response = await authFetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(email),
          items: items.map((item) => ({
            slug: item.slug,
            quantity: item.quantity,
            optionLabel: item.optionLabel,
            name: item.name,
          })),
          stripeMode,
        }),
      });

      const responseText = await response.text();
      let responseData = null;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch {
        if (!response.ok) {
          throw new Error(responseText.slice(0, 160) || `Payment server error: ${response.status}`);
        }
        throw new Error("Invalid payment response from server");
      }

      if (!response.ok) {
        throw new Error(responseData?.error || `Payment server error: ${response.status}`);
      }

      const { clientSecret: secret } = responseData;
      if (!secret) {
        throw new Error("No payment secret received");
      }

      setClientSecret(secret);
      setFormData(fd);
      setSubmitting(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (checkoutSessionId: string) => {
    if (!formData || !user) return;
    setSubmitting(true);

    try {
      const orderResponse = await authFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutSessionId,
          shipping: {
            email: String(formData.get("email") ?? ""),
            name: `${formData.get("first") ?? ""} ${formData.get("last") ?? ""}`.trim(),
            address: String(formData.get("address") ?? ""),
            city: String(formData.get("city") ?? ""),
            state: String(formData.get("state") ?? ""),
            zip: String(formData.get("zip") ?? ""),
          },
          items: items.map((item) => ({
            slug: item.slug,
            quantity: item.quantity,
            optionLabel: item.optionLabel,
            name: item.name,
          })),
        }),
      });
      const orderData = await readApiJson<{
        success: boolean;
        orderId: string;
        emailSent?: boolean;
        emailError?: string;
      }>(orderResponse);
      if (orderData.emailSent === false) {
        console.error("Order confirmation email failed:", orderData.emailError);
        const emailReason = friendlyEmailError(orderData.emailError);
        setNotice(
          `Your paid order was saved, but the confirmation email could not be sent automatically.${emailReason ? ` Reason: ${emailReason}` : ""}`,
        );
      } else {
        setNotice(null);
      }

      clear();
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setErr(errorMessage);
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="font-display text-6xl text-gradient-gold italic">Thank you</div>
        <p className="mt-6 text-muted-foreground max-w-md">
          Your order has been received and is being prepared with care. View it anytime in your
          account.
        </p>
        {notice && <p className="mt-4 text-sm text-gold max-w-lg">{notice}</p>}
        <div className="mt-10 flex gap-4">
          <Link
            to="/account"
            className="px-6 py-3 bg-gold text-obsidian text-[11px] uppercase tracking-luxury hover:bg-gold-light transition-colors"
          >
            View My Orders
          </Link>
          <Link
            to="/products"
            className="px-6 py-3 border border-gold text-gold text-[11px] uppercase tracking-luxury hover:bg-gold hover:text-obsidian transition-colors"
          >
            Continue Browsing
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="font-display text-3xl text-gold/80">No items to check out</div>
        <Link
          to="/products"
          className="mt-6 inline-block text-[11px] uppercase tracking-luxury text-gold border-b border-gold/40"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  // Show payment form after shipping info is submitted
  if (clientSecret && formData) {
    return (
      <StripeProvider clientSecret={clientSecret}>
        <CheckoutPaymentForm
          clientSecret={clientSecret}
          isProcessing={submitting}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          errorMessage={err}
          items={items}
          formData={formData}
        />
      </StripeProvider>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout — ZXG Wellness</title>
      </Helmet>
      <div className="mx-auto max-w-6xl px-6 lg:px-10 py-20 md:py-28">
        <div className="text-[10px] uppercase tracking-luxury text-gold mb-4">Final Step</div>
        <h1 className="font-display text-5xl md:text-6xl mb-6">Checkout</h1>

        {!user && (
          <div className="mb-10 border border-gold/30 bg-charcoal px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-foreground/80">
              Please <span className="text-gold">sign in</span> to complete your order and track it
              later.
            </div>
            <Link
              to="/login"
              className="text-[11px] uppercase tracking-luxury text-gold border border-gold/40 px-4 py-2 hover:bg-gold hover:text-obsidian transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}

        <form onSubmit={handleShippingSubmit} className="grid lg:grid-cols-[1fr,400px] gap-12">
          <div className="space-y-12">
            <FormSection title="Contact">
              <Field label="Email" name="email" type="email" defaultValue={user?.email ?? ""} />
            </FormSection>

            <FormSection title="Shipping">
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="First name" name="first" />
                <Field label="Last name" name="last" />
                <div className="md:col-span-2">
                  <Field label="Address" name="address" />
                </div>
                <Field label="City" name="city" />
                <Field label="State" name="state" />
                <Field label="Postal code" name="zip" />
              </div>
            </FormSection>

            <FormSection title="Payment">
              {stripeMode === "test" && (
                <p className="mb-3 text-xs text-gold">
                  Stripe test mode is active. Use Stripe test cards only; no real card will be
                  charged.
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Click the button below to proceed to secure payment processing with Stripe.
              </p>
            </FormSection>
          </div>

          <aside className="bg-charcoal border border-gold/20 p-8 h-fit lg:sticky lg:top-24">
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">
              Order Summary
            </div>
            <CartLineItems items={items} />
            <OrderSummaryTotals summary={summary} />
            {err && <div className="mt-4 text-xs text-destructive">{err}</div>}
            <button
              type="submit"
              disabled={submitting || !user}
              className="mt-6 w-full py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-colors glow-gold-sm disabled:opacity-50"
            >
              {submitting ? "Processing…" : !user ? "Sign in to complete" : "Continue to Payment →"}
            </button>
          </aside>
        </form>
      </div>
    </>
  );
}

function CheckoutPaymentForm({
  clientSecret,
  isProcessing,
  onSuccess,
  onError,
  errorMessage,
  items,
  formData,
}: {
  clientSecret: string;
  isProcessing: boolean;
  onSuccess: (checkoutSessionId: string) => void | Promise<void>;
  onError: (err: string) => void;
  errorMessage?: string | null;
  items: CartItem[];
  formData: FormData;
}) {
  const summary = cartSummary(items);
  const shippingContact = {
    name: `${formData.get("first") ?? ""} ${formData.get("last") ?? ""}`.trim(),
    address: {
      country: "US",
      line1: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      postal_code: String(formData.get("zip") ?? ""),
    },
  };

  return (
    <>
      <Helmet>
        <title>Payment — ZXG Wellness</title>
      </Helmet>
      <div className="mx-auto max-w-6xl px-6 lg:px-10 py-20 md:py-28">
        <div className="text-[10px] uppercase tracking-luxury text-gold mb-4">Secure Payment</div>
        <h1 className="font-display text-5xl md:text-6xl mb-6">Complete Payment</h1>

        <div className="grid lg:grid-cols-[1fr,400px] gap-12">
          <div>
            <FormSection title="Card Details">
              <PaymentForm
                isProcessing={isProcessing}
                onSuccess={onSuccess}
                onError={onError}
                shippingContact={shippingContact}
              />
              {errorMessage && <div className="mt-4 text-sm text-destructive">{errorMessage}</div>}
            </FormSection>
          </div>

          <aside className="bg-charcoal border border-gold/20 p-8 h-fit lg:sticky lg:top-24">
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">
              Order Summary
            </div>
            <CartLineItems items={items} />
            <OrderSummaryTotals summary={summary} />
          </aside>
        </div>
      </div>
    </>
  );
}

function CartLineItems({ items }: { items: CartItem[] }) {
  return (
    <ul className="space-y-4">
      {items.map((i) => (
        <li key={cartItemKey(i)} className="flex items-center gap-3 text-sm">
          <img
            src={i.image || imageFor(i.slug)}
            alt=""
            className="h-14 w-12 object-contain bg-surface-2"
          />
          <div className="flex-1">
            <div className="font-display text-base">{i.name}</div>
            <div className="text-xs text-muted-foreground">Qty {i.quantity}</div>
          </div>
          <div className="text-gold">${(i.price * i.quantity).toFixed(2)}</div>
        </li>
      ))}
    </ul>
  );
}

function OrderSummaryTotals({ summary }: { summary: CartSummary }) {
  return (
    <>
      <div className="mt-6 pt-6 border-t border-gold/15 space-y-2 text-sm text-foreground/80">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${summary.subtotal.toFixed(2)}</span>
        </div>
        {summary.penDiscount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>5+ Pen Discount</span>
            <span>-${summary.penDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{summary.freeShipping ? "Free" : `$${summary.shipping.toFixed(2)}`}</span>
        </div>
      </div>
      <div className="mt-4 space-y-1 text-xs text-muted-foreground">
        <p>
          {summary.freeShipping
            ? "Free shipping unlocked on this order."
            : `$${summary.freeShippingRemaining.toFixed(2)} away from free shipping.`}
        </p>
        {summary.penDiscountApplied ? (
          <p className="text-emerald-400">10% reusable pen discount applied.</p>
        ) : summary.penQuantity > 0 ? (
          <p>
            Add {summary.penDiscountRemaining} more reusable pen
            {summary.penDiscountRemaining === 1 ? "" : "s"} for 10% off.
          </p>
        ) : null}
      </div>
      <div className="mt-6 pt-6 border-t border-gold/15 flex justify-between items-center">
        <span className="text-[11px] uppercase tracking-luxury">Total</span>
        <span className="font-display text-3xl text-gold">${summary.total.toFixed(2)}</span>
      </div>
    </>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">
        <span className="gold-line">{title}</span>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-luxury text-muted-foreground mb-2">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required
        defaultValue={defaultValue}
        className="w-full bg-transparent border-b border-gold/30 focus:border-gold outline-none py-2 text-sm text-foreground transition-colors"
      />
    </label>
  );
}
