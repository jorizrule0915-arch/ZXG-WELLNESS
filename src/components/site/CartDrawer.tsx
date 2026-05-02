import { Link } from "@tanstack/react-router";
import { X, Plus, Minus } from "lucide-react";
import { useCart, cartTotal } from "@/lib/cart";
import { AnimatePresence, motion } from "framer-motion";

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove } = useCart();
  const total = cartTotal(items);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-obsidian/70 backdrop-blur-sm"
          />
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-md bg-charcoal border-l border-gold/25 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gold/15">
              <div>
                <div className="text-[10px] uppercase tracking-luxury text-gold">
                  Your Selection
                </div>
                <h3 className="font-display text-2xl mt-1">Atelier Cart</h3>
              </div>
              <button
                onClick={close}
                aria-label="Close cart"
                className="p-2 text-foreground/70 hover:text-gold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="font-display text-3xl text-gold/80">Empty</div>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                    Your atelier cart awaits its first treasure.
                  </p>
                  <Link
                    to="/products"
                    onClick={close}
                    className="mt-6 inline-block text-[11px] uppercase tracking-luxury text-gold border-b border-gold/50 pb-1 hover:border-gold"
                  >
                    Discover the collection
                  </Link>
                </div>
              ) : (
                <ul className="space-y-6">
                  {items.map((i) => (
                    <li key={i.slug} className="flex gap-4">
                      <img
                        src={i.image}
                        alt={i.name}
                        className="h-24 w-20 object-cover bg-surface-2 rounded-sm"
                        loading="lazy"
                      />
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-display text-lg leading-tight">{i.name}</div>
                          <button
                            onClick={() => remove(i.slug)}
                            className="text-muted-foreground hover:text-gold text-xs"
                            aria-label="Remove"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-1 text-sm text-gold">${i.price}</div>
                        <div className="mt-auto flex items-center gap-3">
                          <button
                            onClick={() => setQty(i.slug, i.quantity - 1)}
                            className="h-7 w-7 border border-gold/40 text-gold hover:bg-gold hover:text-obsidian transition-colors flex items-center justify-center"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{i.quantity}</span>
                          <button
                            onClick={() => setQty(i.slug, i.quantity + 1)}
                            className="h-7 w-7 border border-gold/40 text-gold hover:bg-gold hover:text-obsidian transition-colors flex items-center justify-center"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gold/15 px-6 py-5 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="uppercase tracking-luxury text-[11px] text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="font-display text-2xl text-gold">${total.toFixed(0)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={close}
                  className="block w-full text-center py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-colors glow-gold-sm"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  to="/cart"
                  onClick={close}
                  className="block text-center text-[11px] uppercase tracking-luxury text-muted-foreground hover:text-gold"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
