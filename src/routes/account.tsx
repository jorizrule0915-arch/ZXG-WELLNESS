import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  MapPin,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price?: number | null;
};

type Order = {
  id: string;
  created_at: string;
  status: "pending" | "paid" | "fulfilled" | "cancelled" | string;
  total: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state?: string | null;
  shipping_zip: string;
  tracking_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  tracking_status?: string | null;
  shipped_at?: string | null;
  estimated_delivery_date?: string | null;
  shipment_note?: string | null;
  order_items: OrderItem[];
};

type OrderFilter = "all" | "active" | "delivered";
type PillTone = "gold" | "muted" | "green" | "red" | "amber";

const orderSelect =
  "id, created_at, status, total, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, tracking_carrier, tracking_number, tracking_url, tracking_status, shipped_at, estimated_delivery_date, shipment_note, order_items(product_name, quantity, unit_price)";

const legacyOrderSelect =
  "id, created_at, status, total, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, order_items(product_name, quantity, unit_price)";

const trackingStatusLabels: Record<string, string> = {
  processing: "Preparing",
  packed: "Packed",
  shipped: "Shipped",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  delayed: "Delayed",
  returned: "Returned",
};

const orderStatusLabels: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const progressSteps = [
  {
    title: "Order placed",
    description: "We received your order.",
  },
  {
    title: "Preparing",
    description: "ZXG is packing your items.",
  },
  {
    title: "With courier",
    description: "Tracking begins after handoff.",
  },
  {
    title: "Delivered",
    description: "Package has arrived.",
  },
];

const filterLabels: Record<OrderFilter, string> = {
  all: "All orders",
  active: "Active deliveries",
  delivered: "Delivered",
};

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, loading, signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<OrderFilter>("all");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setFetching(true);
      setError(null);

      const result = await supabase
        .from("orders")
        .select(orderSelect)
        .order("created_at", { ascending: false });

      if (result.error) {
        const fallback = await supabase
          .from("orders")
          .select(legacyOrderSelect)
          .order("created_at", { ascending: false });

        if (fallback.error) {
          setError("We could not load your orders right now.");
          setOrders([]);
        } else {
          setOrders((fallback.data ?? []) as unknown as Order[]);
        }
      } else {
        setOrders((result.data ?? []) as unknown as Order[]);
      }

      setFetching(false);
    })();
  }, [user]);

  const filteredOrders = useMemo(() => {
    if (filter === "active") {
      return orders.filter((order) => !isDelivered(order) && order.status !== "cancelled");
    }
    if (filter === "delivered") return orders.filter(isDelivered);
    return orders;
  }, [filter, orders]);

  const activeOrderCount = orders.filter(
    (order) => !isDelivered(order) && order.status !== "cancelled",
  ).length;
  const deliveredOrderCount = orders.filter(isDelivered).length;
  const latestOrder = orders[0];
  const displayName = user.email?.split("@")[0] || "there";

  const toggleOrder = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading || !user) {
    return <div className="py-32 text-center text-muted-foreground">Loading your account…</div>;
  }

  return (
    <>
      <Helmet>
        <title>My Account — ZXG Wellness</title>
      </Helmet>

      <main className="mx-auto max-w-7xl px-5 py-16 md:py-24 lg:px-10">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="overflow-hidden border border-gold/15 bg-charcoal"
        >
          <div className="grid gap-8 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.16),transparent_34rem)] p-6 md:grid-cols-[1fr_320px] md:p-8 lg:p-10">
            <div>
              <div className="mb-4 text-[11px] uppercase tracking-luxury text-gold">
                Account Dashboard
              </div>
              <h1 className="font-display text-4xl leading-tight md:text-6xl">
                Hi, <span className="text-gradient-gold italic">{displayName}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Track every ZXG order from purchase to delivery. Open any order to see what you
                bought, where it is shipping, and the courier details once the package leaves us.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-[11px] uppercase tracking-luxury text-obsidian transition-colors hover:bg-gold-light"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Continue Shopping
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 border border-gold/40 px-5 py-3 text-[11px] uppercase tracking-luxury text-gold transition-colors hover:bg-gold hover:text-obsidian"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={async () => {
                    await signOut();
                    nav({ to: "/" });
                  }}
                  className="inline-flex items-center border border-gold/20 px-5 py-3 text-[11px] uppercase tracking-luxury text-muted-foreground transition-colors hover:border-gold/60 hover:text-gold"
                >
                  Sign Out
                </button>
              </div>
            </div>

            <AccountSummaryCard
              email={user.email ?? ""}
              totalOrders={orders.length}
              activeOrderCount={activeOrderCount}
              latestOrder={latestOrder}
            />
          </div>
        </motion.section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <DashboardStat
            icon={<Package className="h-5 w-5" />}
            label="Total Orders"
            value={orders.length.toString()}
            description="All purchases on this account"
          />
          <DashboardStat
            icon={<Truck className="h-5 w-5" />}
            label="In Progress"
            value={activeOrderCount.toString()}
            description="Preparing or on the way"
          />
          <DashboardStat
            icon={<PackageCheck className="h-5 w-5" />}
            label="Delivered"
            value={deliveredOrderCount.toString()}
            description="Completed deliveries"
          />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-luxury text-gold">
                  <span className="gold-line">Your Orders</span>
                </div>
                <h2 className="mt-3 font-display text-3xl md:text-4xl">Order history</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Each order shows payment status, delivery destination, and tracking details when
                  the shipping company provides them.
                </p>
              </div>
              <div className="text-[10px] uppercase tracking-luxury text-muted-foreground">
                {filteredOrders.length} shown
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {(Object.keys(filterLabels) as OrderFilter[]).map((nextFilter) => (
                <button
                  key={nextFilter}
                  onClick={() => setFilter(nextFilter)}
                  className={`border px-4 py-2 text-[10px] uppercase tracking-luxury transition-colors ${
                    filter === nextFilter
                      ? "border-gold bg-gold text-obsidian"
                      : "border-gold/25 text-muted-foreground hover:border-gold hover:text-gold"
                  }`}
                >
                  {filterLabels[nextFilter]}
                </button>
              ))}
            </div>

            {fetching ? (
              <LoadingOrders />
            ) : error ? (
              <div className="border border-destructive/30 bg-destructive/10 p-8 text-center text-sm text-destructive">
                {error}
              </div>
            ) : orders.length === 0 ? (
              <EmptyOrders />
            ) : filteredOrders.length === 0 ? (
              <div className="border border-gold/15 bg-charcoal p-10 text-center">
                <div className="font-display text-2xl text-gold/80">Nothing in this view</div>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  Try another filter to see the rest of your order history.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isOpen={expanded.has(order.id)}
                    onToggle={() => toggleOrder(order.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          <aside className="space-y-5">
            <TrackingExplainer />
            <HelpCard />
          </aside>
        </section>
      </main>
    </>
  );
}

function AccountSummaryCard({
  email,
  totalOrders,
  activeOrderCount,
  latestOrder,
}: {
  email: string;
  totalOrders: number;
  activeOrderCount: number;
  latestOrder?: Order;
}) {
  return (
    <div className="border border-gold/15 bg-obsidian/70 p-5">
      <div className="text-[10px] uppercase tracking-luxury text-gold">Signed in as</div>
      <div className="mt-2 break-all text-sm text-foreground/85">{email}</div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <MiniStat label="Orders" value={totalOrders.toString()} />
        <MiniStat label="Active" value={activeOrderCount.toString()} />
      </div>

      <div className="mt-6 border-t border-gold/10 pt-5">
        <div className="text-[10px] uppercase tracking-luxury text-muted-foreground">
          Latest Order
        </div>
        {latestOrder ? (
          <>
            <div className="mt-2 font-display text-xl">#{latestOrder.id.slice(0, 8)}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {formatDate(latestOrder.created_at)} · {getTrackingLabel(latestOrder)}
            </div>
          </>
        ) : (
          <div className="mt-2 text-sm text-muted-foreground">No orders yet</div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gold/10 bg-charcoal/80 p-4">
      <div className="font-display text-2xl text-gold">{value}</div>
      <div className="mt-1 text-[9px] uppercase tracking-luxury text-muted-foreground">{label}</div>
    </div>
  );
}

function DashboardStat({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="border border-gold/15 bg-charcoal p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-luxury text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-4xl text-gold">{value}</div>
        </div>
        <div className="border border-gold/20 bg-obsidian p-3 text-gold">{icon}</div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function OrderCard({
  order,
  isOpen,
  onToggle,
}: {
  order: Order;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const itemCount = getItemCount(order);
  const trackingTone = getTrackingTone(order);

  return (
    <li className="overflow-hidden border border-gold/15 bg-charcoal">
      <button
        onClick={onToggle}
        className="w-full p-5 text-left transition-colors hover:bg-surface/40 md:p-6"
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="flex gap-4">
            <div className="mt-1 hidden border border-gold/20 bg-obsidian p-3 text-gold sm:block">
              <Package className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-2xl">Order #{order.id.slice(0, 8)}</h3>
                <StatusPill label={getOrderStatusLabel(order.status)} tone={getOrderTone(order)} />
                <StatusPill label={getTrackingLabel(order)} tone={trackingTone} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-gold/80" />
                  Ordered {formatDate(order.created_at)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-gold/80" />
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gold/80" />
                  Ships to {order.shipping_city}
                  {order.shipping_state ? `, ${order.shipping_state}` : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 lg:flex-col lg:items-end">
            <div className="text-left lg:text-right">
              <div className="text-[9px] uppercase tracking-luxury text-muted-foreground">
                Order Total
              </div>
              <div className="mt-1 font-display text-3xl text-gold">{formatMoney(order.total)}</div>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-luxury text-gold">
              {isOpen ? "Hide details" : "View details"}
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </div>
        </div>
      </button>

      {isOpen && <OrderDetails order={order} />}
    </li>
  );
}

function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="grid gap-6 border-t border-gold/10 bg-obsidian/40 p-5 md:p-6 xl:grid-cols-[1fr_1fr]">
      <section className="border border-gold/10 bg-charcoal/70 p-5">
        <SectionHeader icon={<PackageCheck className="h-4 w-4" />} label="Items in this order" />
        <ul className="mt-4 divide-y divide-gold/10 text-sm">
          {order.order_items?.map((item, index) => (
            <li
              key={`${item.product_name}-${index}`}
              className="flex items-start justify-between gap-4 py-3 first:pt-0"
            >
              <div>
                <div className="text-foreground/90">{item.product_name}</div>
                <div className="mt-1 text-xs text-muted-foreground">Qty {item.quantity}</div>
              </div>
              {typeof item.unit_price === "number" && (
                <span className="shrink-0 text-gold">
                  {formatMoney(item.unit_price * item.quantity)}
                </span>
              )}
            </li>
          ))}
          <li className="flex justify-between pt-4 font-display text-xl">
            <span>Total paid</span>
            <span className="text-gold">{formatMoney(order.total)}</span>
          </li>
        </ul>
      </section>

      <section className="space-y-6">
        <div className="border border-gold/10 bg-charcoal/70 p-5">
          <SectionHeader icon={<MapPin className="h-4 w-4" />} label="Delivery destination" />
          <address className="mt-4 not-italic text-sm leading-7 text-foreground/80">
            <div className="font-medium text-foreground">{order.shipping_name}</div>
            <div>{order.shipping_address}</div>
            <div>
              {order.shipping_city}
              {order.shipping_state ? `, ${order.shipping_state}` : ""} {order.shipping_zip}
            </div>
          </address>
        </div>

        <div className="border border-gold/10 bg-charcoal/70 p-5">
          <SectionHeader icon={<Truck className="h-4 w-4" />} label="Package tracking" />
          <TrackingTimeline order={order} />
          <TrackingDetails order={order} />
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-luxury text-gold">
      {icon}
      {label}
    </div>
  );
}

function TrackingTimeline({ order }: { order: Order }) {
  const progress = getProgressIndex(order);

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-4">
      {progressSteps.map((step, index) => {
        const complete = progress >= index;
        const current = progress === index;
        return (
          <div key={step.title} className="relative">
            <div
              className={`mb-3 h-1 rounded-full ${complete ? "bg-gold" : "bg-gold/15"} sm:mb-4`}
            />
            <div
              className={`flex h-8 w-8 items-center justify-center border text-xs ${
                complete
                  ? "border-gold bg-gold text-obsidian"
                  : current
                    ? "border-gold text-gold"
                    : "border-gold/20 text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>
            <div className="mt-3 text-xs font-medium uppercase tracking-wide text-foreground/90">
              {step.title}
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</p>
          </div>
        );
      })}
    </div>
  );
}

function TrackingDetails({ order }: { order: Order }) {
  return (
    <div className="mt-5 space-y-4 border border-gold/10 bg-obsidian/70 p-4 text-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <TrackingField label="Courier" value={order.tracking_carrier || "Not assigned yet"} />
        <TrackingField
          label="Tracking Number"
          value={order.tracking_number || "Will appear after the package ships"}
        />
      </div>

      {order.estimated_delivery_date && (
        <TrackingField
          label="Estimated Arrival"
          value={formatDate(order.estimated_delivery_date)}
        />
      )}

      {order.shipment_note && <TrackingField label="Latest Update" value={order.shipment_note} />}

      {order.tracking_url ? (
        <a
          href={order.tracking_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-gold px-4 py-2 text-[11px] uppercase tracking-luxury text-obsidian transition-colors hover:bg-gold-light"
        >
          Track with shipping company <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <div className="rounded-sm border border-gold/10 bg-gold/5 p-4 text-xs leading-6 text-muted-foreground">
          Tracking is added after ZXG hands the package to the shipping company. Until then, this
          page shows your order status and delivery destination.
        </div>
      )}
    </div>
  );
}

function TrackingField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-luxury text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-foreground/85">{value}</div>
    </div>
  );
}

function TrackingExplainer() {
  return (
    <div className="border border-gold/15 bg-charcoal p-5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-luxury text-gold">
        <Truck className="h-4 w-4" />
        How Tracking Works
      </div>
      <ol className="mt-5 space-y-4 text-sm text-foreground/80">
        <ExplainerStep
          number="1"
          title="You place the order"
          text="Your account immediately stores the order details."
        />
        <ExplainerStep
          number="2"
          title="ZXG prepares it"
          text="The team packs your items and updates the order status."
        />
        <ExplainerStep
          number="3"
          title="Courier receives it"
          text="Once the shipping company gives a tracking link, it appears here."
        />
      </ol>
    </div>
  );
}

function ExplainerStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-gold/30 text-xs text-gold">
        {number}
      </span>
      <span>
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span>
      </span>
    </li>
  );
}

function HelpCard() {
  return (
    <div className="border border-gold/15 bg-charcoal p-5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-luxury text-gold">
        <HelpCircle className="h-4 w-4" />
        Need Help?
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        If a tracking number looks wrong or your delivery is delayed, contact us with your order
        number so we can check with the courier.
      </p>
      <Link
        to="/contact"
        className="mt-5 inline-flex border border-gold/40 px-4 py-2 text-[11px] uppercase tracking-luxury text-gold transition-colors hover:bg-gold hover:text-obsidian"
      >
        Contact Support
      </Link>
    </div>
  );
}

function LoadingOrders() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse border border-gold/10 bg-charcoal p-6">
          <div className="h-6 w-48 bg-gold/10" />
          <div className="mt-4 h-4 w-2/3 bg-gold/10" />
          <div className="mt-6 h-12 bg-gold/5" />
        </div>
      ))}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="border border-gold/15 bg-charcoal px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center border border-gold/20 bg-obsidian text-gold">
        <ShoppingBag className="h-7 w-7" />
      </div>
      <div className="mt-5 font-display text-3xl text-gold/90">No orders yet</div>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        Once you complete a purchase, your order details and tracking updates will appear here.
      </p>
      <Link
        to="/products"
        className="mt-6 inline-flex bg-gold px-5 py-3 text-[11px] uppercase tracking-luxury text-obsidian transition-colors hover:bg-gold-light"
      >
        Browse Products
      </Link>
    </div>
  );
}

function StatusPill({ label, tone = "gold" }: { label: string; tone?: PillTone }) {
  const classes = {
    gold: "border-gold/40 bg-gold/5 text-gold",
    muted: "border-muted-foreground/30 text-muted-foreground",
    green: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
    red: "border-destructive/40 bg-destructive/10 text-destructive",
    amber: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  };

  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-[9px] uppercase tracking-luxury ${classes[tone]}`}
    >
      {label}
    </span>
  );
}

function getItemCount(order: Order) {
  return order.order_items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
}

function getOrderStatusLabel(status: string) {
  return orderStatusLabels[status] ?? status.replace(/_/g, " ");
}

function getTrackingLabel(order: Order) {
  if (order.status === "cancelled") return "Cancelled";
  const status = order.tracking_status || "processing";
  return trackingStatusLabels[status] ?? status.replace(/_/g, " ");
}

function getOrderTone(order: Order): PillTone {
  if (order.status === "cancelled") return "red";
  if (isDelivered(order)) return "green";
  if (order.status === "pending") return "amber";
  return "gold";
}

function getTrackingTone(order: Order): PillTone {
  if (order.status === "cancelled" || order.tracking_status === "returned") return "red";
  if (isDelivered(order)) return "green";
  if (order.tracking_status === "delayed") return "amber";
  if (order.tracking_number || order.tracking_url) return "gold";
  return "muted";
}

function getProgressIndex(order: Order) {
  if (order.status === "cancelled") return -1;
  if (isDelivered(order)) return 3;
  if (
    order.tracking_number ||
    order.tracking_url ||
    ["shipped", "in_transit", "out_for_delivery", "delayed"].includes(order.tracking_status ?? "")
  ) {
    return 2;
  }
  if (order.status === "paid" || ["processing", "packed"].includes(order.tracking_status ?? "")) {
    return 1;
  }
  return 0;
}

function isDelivered(order: Order) {
  return order.tracking_status === "delivered" || order.status === "fulfilled";
}

function formatDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
  }).format(Number(value));
}
