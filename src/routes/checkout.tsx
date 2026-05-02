import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useState, type FormEvent } from "react";
import { useCart, cartTotal } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const { items, clear } = useCart();
  const { user } = useAuth();
  const total = cartTotal(items);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          total,
          email: String(fd.get("email") ?? ""),
          shipping_name: `${fd.get("first") ?? ""} ${fd.get("last") ?? ""}`.trim(),
          shipping_address: String(fd.get("address") ?? ""),
          shipping_city: String(fd.get("city") ?? ""),
          shipping_zip: String(fd.get("zip") ?? ""),
        })
        .select("id")
        .single();
      if (error || !order) throw error ?? new Error("Order failed");

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_slug: i.slug,
          product_name: i.name,
          unit_price: i.price,
          quantity: i.quantity,
        })),
      );
      if (itemsError) throw itemsError;

      clear();
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="font-display text-6xl text-gradient-gold italic">Thank you</div>
        <p className="mt-6 text-muted-foreground max-w-md">
          Your order has been received and is being prepared with care. View it anytime in your
          atelier.
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

  return (
    <>
      <Helmet><title>Checkout — ZXG Wellness</title></Helmet>
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

      <form onSubmit={onSubmit} className="grid lg:grid-cols-[1fr,400px] gap-12">
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
            <Field label="Card number" name="card" />
            <div className="grid grid-cols-2 gap-5 mt-5">
              <Field label="Expiry" name="exp" />
              <Field label="CVC" name="cvc" />
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">
              Demo checkout — no payment will be processed. Stripe integration arrives in Phase 4.
            </p>
          </FormSection>
        </div>

        <aside className="bg-charcoal border border-gold/20 p-8 h-fit lg:sticky lg:top-24">
          <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">Order Summary</div>
          <ul className="space-y-4">
            {items.map((i) => (
              <li key={i.slug} className="flex items-center gap-3 text-sm">
                <img src={i.image} alt="" className="h-14 w-12 object-cover bg-surface-2" />
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
              <span>${total.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>Complimentary</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gold/15 flex justify-between items-center">
            <span className="text-[11px] uppercase tracking-luxury">Total</span>
            <span className="font-display text-3xl text-gold">${total.toFixed(0)}</span>
          </div>
          {err && <div className="mt-4 text-xs text-destructive">{err}</div>}
          <button
            type="submit"
            disabled={submitting || !user}
            className="mt-6 w-full py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-colors glow-gold-sm disabled:opacity-50"
          >
            {submitting ? "Placing order…" : !user ? "Sign in to complete" : "Complete Order →"}
          </button>
        </aside>
      </form>
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
