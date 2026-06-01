import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useState, type FormEvent } from "react";
import { useCart, cartTotal, SHIPPING_FEE, type CartItem } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { imageFor } from "@/lib/productImages";
import { StripeProvider } from "@/components/site/StripeProvider";
import { PaymentForm } from "@/components/site/PaymentForm";
import { authFetch } from "@/lib/api";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const { items, clear } = useCart();
  const { user } = useAuth();
  const total = cartTotal(items);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
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
      if (!total || total <= 0) {
        throw new Error("Cart total is invalid");
      }
      if (!email) {
        throw new Error("Email is required");
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
        }),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        throw new Error(`Invalid response from server: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(responseData?.error || `Server error: ${response.status}`);
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

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!formData || !user) return;
    setSubmitting(true);

    try {
      const orderResponse = await authFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          shipping: {
            email: String(formData.get("email") ?? ""),
            name: `${formData.get("first") ?? ""} ${formData.get("last") ?? ""}`.trim(),
            address: String(formData.get("address") ?? ""),
            city: String(formData.get("city") ?? ""),
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
      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData?.error || "Order creation failed");

      // Send order confirmation + invoice email
      try {
        await authFetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderData.orderId }),
        });
      } catch (emailErr) {
        // Non-blocking — don't fail the order if email fails
        console.error("Email send failed:", emailErr);
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
          items={items}
          total={total}
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
                <Field label="Postal code" name="zip" />
              </div>
            </FormSection>

            <FormSection title="Payment">
              <p className="text-sm text-muted-foreground">
                Click the button below to proceed to secure payment processing with Stripe.
              </p>
            </FormSection>
          </div>

          <aside className="bg-charcoal border border-gold/20 p-8 h-fit lg:sticky lg:top-24">
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">
              Order Summary
            </div>
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.slug} className="flex items-center gap-3 text-sm">
                  <img
                    src={imageFor(i.slug) || i.image}
                    alt=""
                    className="h-14 w-12 object-cover bg-surface-2"
                  />
                  <div className="flex-1">
                    <div className="font-display text-base">{i.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {i.quantity}</div>
                  </div>
                  <div className="text-gold">${(i.price * i.quantity).toFixed(0)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-gold/15 space-y-2 text-sm text-foreground/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${SHIPPING_FEE.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gold/15 flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-luxury">Total</span>
              <span className="font-display text-3xl text-gold">${(total + SHIPPING_FEE).toFixed(2)}</span>
            </div>
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
  items,
  total,
}: {
  clientSecret: string;
  isProcessing: boolean;
  onSuccess: (paymentIntentId: string) => void;
  onError: (err: string) => void;
  items: CartItem[];
  total: number;
}) {
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
              <PaymentForm isProcessing={isProcessing} onSuccess={onSuccess} onError={onError} />
            </FormSection>
          </div>

          <aside className="bg-charcoal border border-gold/20 p-8 h-fit lg:sticky lg:top-24">
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">
              Order Summary
            </div>
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.slug} className="flex items-center gap-3 text-sm">
                  <img
                    src={imageFor(i.slug) || i.image}
                    alt=""
                    className="h-14 w-12 object-cover bg-surface-2"
                  />
                  <div className="flex-1">
                    <div className="font-display text-base">{i.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {i.quantity}</div>
                  </div>
                  <div className="text-gold">${(i.price * i.quantity).toFixed(0)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-gold/15 space-y-2 text-sm text-foreground/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${SHIPPING_FEE.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gold/15 flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-luxury">Total</span>
              <span className="font-display text-3xl text-gold">${(total + SHIPPING_FEE).toFixed(2)}</span>
            </div>
          </aside>
        </div>
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
