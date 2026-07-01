import { createFileRoute, Link } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Clock,
  DollarSign,
  Package,
  Save,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { authFetch, readApiJson } from "@/lib/api";

export const Route = createFileRoute("/_admin/admin/")({ component: AdminDashboard });

type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";
type TrackingStatus =
  | "processing"
  | "packed"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delayed"
  | "returned";

type FulfillmentOrder = {
  id: string;
  created_at: string;
  email: string;
  status: OrderStatus;
  total: number;
  shipping_name?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_zip?: string | null;
  tracking_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  tracking_status?: TrackingStatus | string | null;
  shipped_at?: string | null;
  estimated_delivery_date?: string | null;
  shipment_note?: string | null;
};

type FulfillmentDraft = {
  order_status: OrderStatus;
  tracking_carrier: string;
  tracking_number: string;
  tracking_url: string;
  tracking_status: TrackingStatus;
  delivery_days: string;
  shipment_note: string;
};

type Stats = {
  revenue: number;
  orderCount: number;
  pendingOrderCount: number;
  needsFulfillmentCount: number;
  productCount: number;
  customerCount: number;
  recentOrders: FulfillmentOrder[];
  fulfillmentOrders: FulfillmentOrder[];
  revenueByDay: { day: string; revenue: number }[];
  topProducts: { name: string; qty: number }[];
};

const TRACKING_STATUSES: Array<{ value: TrackingStatus; label: string }> = [
  { value: "processing", label: "Order placed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In transit" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "delayed", label: "Delayed" },
  { value: "returned", label: "Returned" },
];

const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled"];

const emptyFulfillmentDraft: FulfillmentDraft = {
  order_status: "pending",
  tracking_carrier: "",
  tracking_number: "",
  tracking_url: "",
  tracking_status: "processing",
  delivery_days: "",
  shipment_note: "",
};

const noEstimatedDeliveryNote =
  "Shipping label has been created. USPS will show an estimated delivery date once they receive and scan the package.";

const fieldClassName =
  "h-9 w-full border border-gold/15 bg-obsidian px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-gold/60";

const toFiniteNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const normalizeStats = (data: Partial<Stats> | null | undefined): Stats => ({
  revenue: toFiniteNumber(data?.revenue),
  orderCount: toFiniteNumber(data?.orderCount),
  pendingOrderCount: toFiniteNumber(data?.pendingOrderCount),
  needsFulfillmentCount: toFiniteNumber(data?.needsFulfillmentCount),
  productCount: toFiniteNumber(data?.productCount),
  customerCount: toFiniteNumber(data?.customerCount),
  recentOrders: Array.isArray(data?.recentOrders) ? data.recentOrders : [],
  fulfillmentOrders: Array.isArray(data?.fulfillmentOrders) ? data.fulfillmentOrders : [],
  revenueByDay: Array.isArray(data?.revenueByDay) ? data.revenueByDay : [],
  topProducts: Array.isArray(data?.topProducts) ? data.topProducts : [],
});

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fulfillmentDrafts, setFulfillmentDrafts] = useState<Record<string, FulfillmentDraft>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const response = await authFetch("/api/admin-data?resource=dashboard");
    const data = normalizeStats(await readApiJson<Stats>(response));
    setStats(data);
    setFulfillmentDrafts(
      Object.fromEntries(
        data.fulfillmentOrders.map((order) => [order.id, fulfillmentDraftFromOrder(order)]),
      ),
    );
  }, []);

  useEffect(() => {
    loadDashboard().catch((e) => setError(e.message));
  }, [loadDashboard]);

  const updateDraft = (id: string, patch: Partial<FulfillmentDraft>) => {
    setFulfillmentDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? emptyFulfillmentDraft),
        ...patch,
      },
    }));
  };

  const saveFulfillment = async (order: FulfillmentOrder) => {
    const draft = fulfillmentDrafts[order.id] ?? fulfillmentDraftFromOrder(order);
    const estimatedDeliveryDate = dateFromDeliveryDays(draft.delivery_days);
    const trackingPayload: Record<string, string | null> = {
      tracking_carrier: draft.tracking_carrier,
      tracking_number: draft.tracking_number,
      tracking_url: draft.tracking_url,
      tracking_status: draft.tracking_status,
      shipment_note: draft.shipment_note.trim()
        ? draft.shipment_note
        : estimatedDeliveryDate
          ? draft.shipment_note
          : noEstimatedDeliveryNote,
      shipped_at: order.shipped_at ?? null,
    };

    if (estimatedDeliveryDate) {
      trackingPayload.estimated_delivery_date = estimatedDeliveryDate;
    }

    setSavingOrderId(order.id);
    try {
      if (draft.order_status !== order.status) {
        const statusResponse = await authFetch("/api/admin-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update-order-status",
            id: order.id,
            payload: { status: draft.order_status },
          }),
        });
        await readApiJson(statusResponse);
      }

      const trackingResponse = await authFetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-order-tracking",
          id: order.id,
          payload: trackingPayload,
        }),
      });
      await readApiJson(trackingResponse);
      await loadDashboard();
      toast.success("Order fulfillment updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update fulfillment");
    } finally {
      setSavingOrderId(null);
    }
  };

  if (error) return <div className="p-12 text-center text-sm text-destructive">Error: {error}</div>;

  if (!stats)
    return <div className="p-12 text-center text-sm text-muted-foreground">Loading metrics…</div>;

  const cards = [
    {
      label: "Revenue",
      value: `$${stats.revenue.toFixed(0)}`,
      detail: "Total paid orders",
      icon: DollarSign,
    },
    {
      label: "All orders",
      value: stats.orderCount.toString(),
      detail: "Every order in store",
      icon: ShoppingCart,
    },
    {
      label: "Needs update",
      value: stats.needsFulfillmentCount.toString(),
      detail: `${stats.pendingOrderCount} pending now`,
      icon: Clock,
    },
    {
      label: "Customers",
      value: stats.customerCount.toString(),
      detail: "Registered accounts",
      icon: Users,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard — ZXG Admin</title>
      </Helmet>
      <div className="px-5 py-7 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col gap-4 border-b border-gold/15 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-gold">
                Admin overview
              </div>
              <h1 className="text-2xl font-medium text-foreground">Operations dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Watch new orders, update shipment progress, and add tracking details before
                customers ask where their package is.
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex h-9 items-center justify-center border border-gold/25 px-4 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
            >
              Open full orders
            </Link>
          </div>
        </motion.div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.04 * index }}
                className="border border-gold/15 bg-charcoal p-4 transition-colors hover:border-gold/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{card.label}</div>
                    <div className="mt-2 text-2xl font-medium text-gold">{card.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{card.detail}</div>
                  </div>
                  <div className="border border-gold/25 p-2">
                    <Icon className="h-4 w-4 text-gold" strokeWidth={1.6} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <FulfillmentQueue
            orders={stats.fulfillmentOrders}
            drafts={fulfillmentDrafts}
            savingOrderId={savingOrderId}
            updateDraft={updateDraft}
            saveFulfillment={saveFulfillment}
          />

          <RecentOrders orders={stats.recentOrders} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="border border-gold/15 bg-charcoal p-5 lg:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold" />
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                Revenue · 14 days
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueByDay}>
                  <defs>
                    <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.13 80)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="oklch(0.78 0.13 80)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(0.78 0.13 80 / 0.08)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="oklch(0.65 0 0)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="oklch(0.65 0 0)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.13 0 0)",
                      border: "1px solid oklch(0.78 0.13 80 / 0.3)",
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "oklch(0.78 0.13 80)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="oklch(0.78 0.13 80)"
                    strokeWidth={2}
                    fill="url(#dashboardRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-gold/15 bg-charcoal p-5">
            <div className="mb-5 flex items-center gap-2">
              <Package className="h-4 w-4 text-gold" />
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                Top products
              </div>
            </div>
            {stats.topProducts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No sales yet</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="oklch(0.96 0 0)"
                      fontSize={10}
                      width={100}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.13 0 0)",
                        border: "1px solid oklch(0.78 0.13 80 / 0.3)",
                        borderRadius: 0,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="qty" fill="oklch(0.78 0.13 80)" radius={0} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function FulfillmentQueue({
  orders,
  drafts,
  savingOrderId,
  updateDraft,
  saveFulfillment,
}: {
  orders: FulfillmentOrder[];
  drafts: Record<string, FulfillmentDraft>;
  savingOrderId: string | null;
  updateDraft: (id: string, patch: Partial<FulfillmentDraft>) => void;
  saveFulfillment: (order: FulfillmentOrder) => void;
}) {
  return (
    <section className="border border-gold/15 bg-charcoal">
      <div className="flex flex-col gap-2 border-b border-gold/15 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-medium text-foreground">New orders needing updates</h2>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Add courier tracking, estimated delivery days, and whether the order is still placed or
            already shipped.
          </p>
        </div>
        <Link
          to="/admin/orders"
          className="text-sm text-gold transition-colors hover:text-gold-light"
        >
          Manage all
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-sm font-medium text-foreground">No orders need shipment updates</div>
          <div className="mt-1 text-sm text-muted-foreground">
            New paid or pending orders will appear here.
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gold/10">
          {orders.map((order) => {
            const draft = drafts[order.id] ?? fulfillmentDraftFromOrder(order);
            const saving = savingOrderId === order.id;
            return (
              <article key={order.id} className="p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        #{order.id.slice(0, 8)}
                      </span>
                      <StatusBadge status={order.status}>{statusLabel(order.status)}</StatusBadge>
                      <StatusBadge status="tracking">
                        {trackingLabel(order.tracking_status)}
                      </StatusBadge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{order.email}</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                      {" · "}
                      {formatShippingPlace(order)}
                      {" · "}${Number(order.total).toFixed(0)}
                    </div>
                  </div>

                  {order.estimated_delivery_date && (
                    <div className="border border-gold/10 px-3 py-2 text-xs text-muted-foreground">
                      ETA{" "}
                      <span className="text-foreground">
                        {new Date(order.estimated_delivery_date).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label>
                    <FieldLabel>Order status</FieldLabel>
                    <select
                      value={draft.order_status}
                      onChange={(event) =>
                        updateDraft(order.id, { order_status: event.target.value as OrderStatus })
                      }
                      className={fieldClassName}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <FieldLabel>Shipping stage</FieldLabel>
                    <select
                      value={draft.tracking_status}
                      onChange={(event) =>
                        updateDraft(order.id, {
                          tracking_status: event.target.value as TrackingStatus,
                        })
                      }
                      className={fieldClassName}
                    >
                      {TRACKING_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <FieldLabel>Courier</FieldLabel>
                    <input
                      value={draft.tracking_carrier}
                      onChange={(event) =>
                        updateDraft(order.id, { tracking_carrier: event.target.value })
                      }
                      placeholder="J&T, LBC, DHL..."
                      className={fieldClassName}
                    />
                  </label>

                  <div>
                    <FieldLabel>Delivery estimate</FieldLabel>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft(order.id, {
                            delivery_days: "",
                            shipment_note: draft.shipment_note.trim()
                              ? draft.shipment_note
                              : noEstimatedDeliveryNote,
                          })
                        }
                        className={`h-9 border px-3 text-left text-sm transition-colors ${
                          !draft.delivery_days
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-gold/15 text-muted-foreground hover:border-gold/40"
                        }`}
                      >
                        No date yet
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={draft.delivery_days}
                        onChange={(event) =>
                          updateDraft(order.id, { delivery_days: event.target.value })
                        }
                        placeholder="Days"
                        className={fieldClassName}
                        aria-label="Estimated delivery days"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <label>
                    <FieldLabel>Tracking ID</FieldLabel>
                    <input
                      value={draft.tracking_number}
                      onChange={(event) =>
                        updateDraft(order.id, { tracking_number: event.target.value })
                      }
                      placeholder="Courier tracking number"
                      className={fieldClassName}
                    />
                  </label>

                  <label>
                    <FieldLabel>Tracking link</FieldLabel>
                    <input
                      value={draft.tracking_url}
                      onChange={(event) =>
                        updateDraft(order.id, { tracking_url: event.target.value })
                      }
                      placeholder="https://courier.com/track/..."
                      className={fieldClassName}
                    />
                  </label>

                  <button
                    onClick={() => saveFulfillment(order)}
                    disabled={saving}
                    className="mt-5 inline-flex h-9 items-center justify-center gap-2 bg-gold px-4 text-sm font-medium text-obsidian transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 lg:min-w-36"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? "Saving..." : "Save update"}
                  </button>
                </div>

                <label className="mt-3 block">
                  <FieldLabel>Customer note</FieldLabel>
                  <textarea
                    value={draft.shipment_note}
                    onChange={(event) =>
                      updateDraft(order.id, { shipment_note: event.target.value })
                    }
                    rows={2}
                    placeholder="Example: Shipping label has been created. USPS will update once they receive the package."
                    className={`${fieldClassName} h-auto resize-none py-2`}
                  />
                </label>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecentOrders({ orders }: { orders: FulfillmentOrder[] }) {
  return (
    <section className="border border-gold/15 bg-charcoal">
      <div className="flex items-center gap-2 border-b border-gold/15 p-5">
        <ClipboardList className="h-4 w-4 text-gold" />
        <h2 className="text-sm font-medium text-foreground">Recent orders</h2>
      </div>
      {orders.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No orders yet</div>
      ) : (
        <ul className="divide-y divide-gold/10">
          {orders.map((order) => (
            <li key={order.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <div className="text-sm font-medium text-foreground">#{order.id.slice(0, 8)}</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  {order.email}
                  <br />
                  {new Date(order.created_at).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status={order.status}>{statusLabel(order.status)}</StatusBadge>
                <div className="mt-2 text-sm font-medium text-gold">
                  ${Number(order.total).toFixed(0)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs text-muted-foreground">{children}</span>;
}

function StatusBadge({
  status,
  children,
}: {
  status: OrderStatus | "tracking";
  children: React.ReactNode;
}) {
  const classes = {
    pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    paid: "border-gold/30 bg-gold/10 text-gold",
    fulfilled: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
    tracking: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  };

  return (
    <span className={`inline-flex border px-2 py-1 text-xs font-medium ${classes[status]}`}>
      {children}
    </span>
  );
}

function fulfillmentDraftFromOrder(order: FulfillmentOrder): FulfillmentDraft {
  return {
    order_status: order.status,
    tracking_carrier: order.tracking_carrier ?? "",
    tracking_number: order.tracking_number ?? "",
    tracking_url: order.tracking_url ?? "",
    tracking_status: isTrackingStatus(order.tracking_status) ? order.tracking_status : "processing",
    delivery_days: "",
    shipment_note: order.shipment_note ?? "",
  };
}

function isTrackingStatus(status: unknown): status is TrackingStatus {
  return TRACKING_STATUSES.some((item) => item.value === status);
}

function trackingLabel(status: string | null | undefined) {
  return TRACKING_STATUSES.find((item) => item.value === status)?.label ?? "Order placed";
}

function statusLabel(status: OrderStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatShippingPlace(order: FulfillmentOrder) {
  return (
    [order.shipping_city, order.shipping_state, order.shipping_zip].filter(Boolean).join(", ") ||
    "No address"
  );
}

function dateFromDeliveryDays(value: string) {
  const days = Number(value);
  if (!Number.isFinite(days) || days <= 0) return null;

  const date = new Date();
  date.setDate(date.getDate() + Math.round(days));
  return date.toISOString().slice(0, 10);
}
