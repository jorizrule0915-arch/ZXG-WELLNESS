import { createFileRoute, Link } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { Plus, Minus, X } from "lucide-react";
import { useCart, cartTotal, SHIPPING_FEE } from "@/lib/cart";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items, setQty, remove } = useCart();
  const total = cartTotal(items);

  return (
    <>
      <Helmet>
        <title>Your Cart — ZXG Wellness</title>
      </Helmet>
      <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 md:py-28">
        <div className="text-[10px] uppercase tracking-luxury text-gold mb-4">Your Selection</div>
        <h1 className="font-display text-5xl md:text-6xl">
          Your <span className="text-gradient-gold italic">cart</span>
        </h1>

        {items.length === 0 ? (
          <div className="mt-20 text-center py-20 border-y border-gold/15">
            <div className="font-display text-3xl text-gold/80">Empty</div>
            <p className="mt-3 text-muted-foreground">
              Your cart awaits its first treasure.
            </p>
            <Link
              to="/products"
              className="mt-8 inline-block px-8 py-3 border border-gold text-gold text-[11px] uppercase tracking-luxury hover:bg-gold hover:text-obsidian transition-colors"
            >
              Browse the collection
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid lg:grid-cols-[1fr,360px] gap-12">
            <ul className="border-t border-gold/15">
              {items.map((i) => (
                <li key={i.slug} className="border-b border-gold/15 py-6 flex gap-6">
                  <img
                    src={i.image}
                    alt={i.name}
                    className="h-32 w-28 object-cover bg-surface-2"
                    loading="lazy"
                  />
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-2xl">{i.name}</h3>
                        <div className="mt-1 text-sm text-gold">${i.price} each</div>
                      </div>
                      <button
                        onClick={() => remove(i.slug)}
                        aria-label="Remove"
                        className="text-muted-foreground hover:text-gold"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQty(i.slug, i.quantity - 1)}
                          className="h-8 w-8 border border-gold/40 text-gold hover:bg-gold hover:text-obsidian transition flex items-center justify-center"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center">{i.quantity}</span>
                        <button
                          onClick={() => setQty(i.slug, i.quantity + 1)}
                          className="h-8 w-8 border border-gold/40 text-gold hover:bg-gold hover:text-obsidian transition flex items-center justify-center"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="font-display text-xl text-gold">
                        ${(i.price * i.quantity).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="bg-charcoal border border-gold/20 p-8 h-fit sticky top-24">
              <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">
                Order Summary
              </div>
              <div className="space-y-3 text-sm">
                <Row label="Subtotal" value={`${total.toFixed(2)}`} />
                <Row label="Shipping" value={`${SHIPPING_FEE.toFixed(2)}`} />
                <Row label="Estimated tax" value="At checkout" />
              </div>
              <div className="mt-6 pt-6 border-t border-gold/15 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-luxury">Total</span>
                <span className="font-display text-3xl text-gold">${(total + SHIPPING_FEE).toFixed(2)}</span>
              </div>
              <Link
                to="/checkout"
                className="mt-8 block w-full text-center py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-colors glow-gold-sm"
              >
                Proceed to Checkout →
              </Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-foreground/80">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
