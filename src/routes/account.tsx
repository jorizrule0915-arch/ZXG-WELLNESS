import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

type Order = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  order_items: { product_name: string; quantity: number }[];
};

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, loading, signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, created_at, status, total, order_items(product_name, quantity)")
        .order("created_at", { ascending: false });
      setOrders((data ?? []) as unknown as Order[]);
      setFetching(false);
    })();
  }, [user]);

  if (loading || !user) {
    return <div className="py-32 text-center text-muted-foreground">…</div>;
  }

  return (
    <>
      <Helmet><title>My Atelier — ZXG Wellness</title></Helmet>
    <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-[10px] uppercase tracking-luxury text-gold mb-4">Your Atelier</div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-display text-5xl md:text-6xl">
            Welcome, <span className="text-gradient-gold italic">{user.email?.split("@")[0]}</span>
          </h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="text-[11px] uppercase tracking-luxury text-gold border border-gold/40 px-4 py-2 hover:bg-gold hover:text-obsidian transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
            <button
              onClick={async () => {
                await signOut();
                nav({ to: "/" });
              }}
              className="text-[11px] uppercase tracking-luxury text-muted-foreground hover:text-gold border-b border-gold/30 pb-1"
            >
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>

      <section className="mt-16">
        <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">
          <span className="gold-line">Order History</span>
        </div>

        {fetching ? (
          <div className="text-center text-muted-foreground py-12">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 border border-gold/15 bg-charcoal">
            <div className="font-display text-2xl text-gold/80">No orders yet</div>
            <Link
              to="/products"
              className="mt-4 inline-block text-[11px] uppercase tracking-luxury text-gold border-b border-gold/40"
            >
              Browse the collection
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((o) => (
              <li
                key={o.id}
                className="border border-gold/15 bg-charcoal p-6 flex flex-wrap gap-6 justify-between items-center"
              >
                <div>
                  <div className="font-display text-xl">Order #{o.id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(o.created_at).toLocaleDateString(undefined, { dateStyle: "long" })}
                    {" · "}
                    {o.order_items?.reduce((n, i) => n + i.quantity, 0) ?? 0} items
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[10px] uppercase tracking-luxury text-gold border border-gold/40 px-3 py-1">
                    {o.status}
                  </span>
                  <div className="font-display text-2xl text-gold">
                    ${Number(o.total).toFixed(0)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
    </>
  );
}
