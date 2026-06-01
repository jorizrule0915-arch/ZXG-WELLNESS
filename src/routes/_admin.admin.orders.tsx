import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/lib/api";

export const Route = createFileRoute("/_admin/admin/orders")({ component: AdminOrders });

type Item = { product_name: string; quantity: number; unit_price: number };
type Order = {
  id: string;
  created_at: string;
  email: string;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
  total: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string | null;
  shipping_zip: string;
  order_items: Item[];
};

const STATUSES: Order["status"][] = ["pending", "paid", "fulfilled", "cancelled"];

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin-data?resource=orders");
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        setOrders(data as Order[]);
      }
    } catch (e) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: Order["status"]) => {
    try {
      const res = await authFetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-order-status", id, payload: { status } }),
      });
      const data = await res.json();
      if (data.error) return toast.error(data.error);
      toast.success(`Order marked ${status}`);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch {
      toast.error("Failed to update status");
    }
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <Helmet>
        <title>Orders — ZXG Admin</title>
      </Helmet>
      <div className="px-6 lg:px-10 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">Fulfillment</div>
          <h1 className="font-display text-4xl md:text-5xl">Orders</h1>
        </motion.div>

        <div className="mt-8 flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 text-[10px] uppercase tracking-luxury border transition-colors ${filter === s ? "bg-gold text-obsidian border-gold" : "border-gold/30 text-muted-foreground hover:text-gold hover:border-gold/60"}`}
            >
              {s}
              {s !== "all" && (
                <span className="ml-2 opacity-60">
                  {orders.filter((o) => o.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 border border-gold/15 bg-charcoal">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No orders</div>
          ) : (
            <ul className="divide-y divide-gold/10">
              {filtered.map((o) => {
                const isOpen = expanded.has(o.id);
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => toggle(o.id)}
                      className="w-full grid grid-cols-12 items-center px-6 py-5 hover:bg-surface/40 transition-colors text-left"
                    >
                      <div className="col-span-1">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-gold" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="col-span-11 md:col-span-4">
                        <div className="font-display text-lg">#{o.id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground">{o.email}</div>
                      </div>
                      <div className="hidden md:block col-span-3 text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </div>
                      <div className="hidden md:block col-span-2">
                        <span className="text-[10px] uppercase tracking-luxury text-gold border border-gold/40 px-2 py-1">
                          {o.status}
                        </span>
                      </div>
                      <div className="hidden md:block col-span-2 text-right font-display text-xl text-gold">
                        ${Number(o.total).toFixed(0)}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-6 grid md:grid-cols-3 gap-8 border-t border-gold/10 bg-obsidian/40">
                        <div>
                          <div className="text-[10px] uppercase tracking-luxury text-gold mb-3 mt-4">
                            Items
                          </div>
                          <ul className="space-y-2 text-sm">
                            {o.order_items?.map((i, idx) => (
                              <li key={idx} className="flex justify-between gap-4">
                                <span>
                                  {i.product_name} × {i.quantity}
                                </span>
                                <span className="text-gold">
                                  ${(Number(i.unit_price) * i.quantity).toFixed(0)}
                                </span>
                              </li>
                            ))}
                            <li className="flex justify-between pt-3 border-t border-gold/15 font-display text-lg">
                              <span>Total</span>
                              <span className="text-gold">${Number(o.total).toFixed(0)}</span>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-luxury text-gold mb-3 mt-4">
                            Shipping
                          </div>
                          <div className="text-sm space-y-1 text-foreground/80">
                            <div>{o.shipping_name}</div>
                            <div>{o.shipping_address}</div>
                            <div>
                              {o.shipping_city}
                              {o.shipping_state ? `, ${o.shipping_state}` : ""} {o.shipping_zip}
                            </div>
                            <div className="text-muted-foreground text-xs mt-2">{o.email}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-luxury text-gold mb-3 mt-4">
                            Update Status
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {STATUSES.map((s) => (
                              <button
                                key={s}
                                onClick={() => updateStatus(o.id, s)}
                                disabled={o.status === s}
                                className={`px-3 py-2 text-[10px] uppercase tracking-luxury border transition-colors ${o.status === s ? "bg-gold text-obsidian border-gold cursor-default" : "border-gold/30 text-muted-foreground hover:text-gold hover:border-gold"}`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
