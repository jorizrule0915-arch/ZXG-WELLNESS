import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, ExternalLink, Package, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { authFetch, readApiJson } from "@/lib/api";
import { imageForOrderItem } from "@/lib/orderImages";

export const Route = createFileRoute("/_admin/admin/orders")({ component: AdminOrders });

type Item = {
  product_name: string;
  product_slug?: string | null;
  quantity: number;
  unit_price: number;
  product_image?: string | null;
};
type TrackingStatus =
  | "processing"
  | "packed"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delayed"
  | "returned";

type Order = {
  id: string;
  created_at: string;
  email: string;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
  total: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state?: string | null;
  shipping_zip: string;
  tracking_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  tracking_status?: TrackingStatus | string | null;
  shipped_at?: string | null;
  estimated_delivery_date?: string | null;
  shipment_note?: string | null;
  order_items: Item[];
};

type TrackingDraft = {
  tracking_carrier: string;
  tracking_number: string;
  tracking_url: string;
  tracking_status: TrackingStatus;
  estimated_delivery_date: string;
  shipment_note: string;
};

const STATUSES: Order["status"][] = ["pending", "paid", "fulfilled", "cancelled"];
const TRACKING_STATUSES: Array<{ value: TrackingStatus; label: string }> = [
  { value: "processing", label: "Preparing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In transit" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "delayed", label: "Delayed" },
  { value: "returned", label: "Returned" },
];

const emptyTrackingDraft: TrackingDraft = {
  tracking_carrier: "",
  tracking_number: "",
  tracking_url: "",
  tracking_status: "processing",
  estimated_delivery_date: "",
  shipment_note: "",
};

const noEstimatedDeliveryNote =
  "Shipping label has been created. USPS will show an estimated delivery date once they receive and scan the package.";

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, TrackingDraft>>({});
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin-data?resource=orders");
      const data = await readApiJson<Order[]>(res);
      const rows = Array.isArray(data) ? data : [];
      setOrders(rows);
      setTrackingDrafts(
        Object.fromEntries(rows.map((order) => [order.id, trackingDraftFromOrder(order)])),
      );
    } catch {
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
      await readApiJson(res);
      toast.success(`Order marked ${status}`);
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
    } catch {
      toast.error("Failed to update status");
    }
  };

  const updateTrackingDraft = (id: string, patch: Partial<TrackingDraft>) => {
    setTrackingDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? emptyTrackingDraft),
        ...patch,
      },
    }));
  };

  const saveTracking = async (order: Order) => {
    const draft = trackingDrafts[order.id] ?? trackingDraftFromOrder(order);
    const payload = trackingPayloadFromDraft(draft, order.shipped_at);

    try {
      const res = await authFetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-order-tracking",
          id: order.id,
          payload,
        }),
      });
      const updated = await readApiJson<Order>(res);
      toast.success("Tracking updated");
      setOrders((prev) =>
        prev.map((item) => (item.id === order.id ? { ...item, ...updated } : item)),
      );
      setTrackingDrafts((prev) => ({
        ...prev,
        [order.id]: trackingDraftFromOrder(updated),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update tracking");
    }
  };

  const removeOrder = async (order: Order) => {
    const confirmed = window.confirm(
      `Remove order #${order.id.slice(0, 8)}? This is permanent and should only be used for test or try orders.`,
    );
    if (!confirmed) return;

    setDeletingOrderId(order.id);
    try {
      const res = await authFetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-order", id: order.id }),
      });
      await readApiJson(res);
      toast.success("Order removed");
      setOrders((prev) => prev.filter((item) => item.id !== order.id));
      setTrackingDrafts((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove order");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = filter === "all" ? orders : orders.filter((order) => order.status === filter);

  return (
    <>
      <Helmet>
        <title>Orders - ZXG Admin</title>
      </Helmet>
      <div className="overflow-x-hidden px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="grid gap-3 border-b border-gold/10 pb-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 text-xs font-medium text-gold">Fulfillment</div>
              <h1 className="font-display text-xl font-normal text-foreground sm:text-2xl">
                Orders
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage customer orders, shipping status, tracking details, and test order cleanup.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="text-foreground">{filtered.length}</span> shown of {orders.length}
            </div>
          </div>
        </motion.div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {(["all", ...STATUSES] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`min-h-11 border px-3 py-2 text-sm transition-colors ${
                filter === status
                  ? "border-gold bg-gold text-obsidian"
                  : "border-gold/20 text-muted-foreground hover:border-gold/60 hover:text-gold"
              }`}
            >
              {statusLabel(status)}
              {status !== "all" && (
                <span className="ml-2 text-xs opacity-60">
                  {orders.filter((order) => order.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-hidden border border-gold/15 bg-charcoal">
          <div className="hidden grid-cols-[44px_1.25fr_1fr_0.75fr_0.85fr_0.7fr] gap-4 border-b border-gold/10 px-5 py-3 text-xs font-medium text-muted-foreground lg:grid">
            <div />
            <div>Order</div>
            <div>Customer</div>
            <div>Date</div>
            <div>Status</div>
            <div className="text-right">Total</div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No orders found</div>
          ) : (
            <ul className="divide-y divide-gold/10">
              {filtered.map((order) => {
                const isOpen = expanded.has(order.id);
                const draft = trackingDrafts[order.id] ?? trackingDraftFromOrder(order);

                return (
                  <li key={order.id}>
                    <button
                      onClick={() => toggle(order.id)}
                      className="grid w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-surface/40 sm:px-5 lg:grid-cols-[44px_1.25fr_1fr_0.75fr_0.85fr_0.7fr] lg:items-center lg:gap-4"
                    >
                      <div className="hidden lg:block">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-gold" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center justify-between gap-3">
                          <span className="break-words font-medium text-foreground">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="shrink-0 lg:hidden">
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4 text-gold" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {getItemCount(order)} {getItemCount(order) === 1 ? "item" : "items"}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="break-all text-sm text-foreground/90 lg:truncate">
                          {order.email}
                        </div>
                        <div className="mt-1 break-words text-xs text-muted-foreground lg:truncate">
                          {order.shipping_name}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={order.status}>{statusLabel(order.status)}</StatusBadge>
                        {order.tracking_number && (
                          <StatusBadge status="tracking">Tracking added</StatusBadge>
                        )}
                      </div>
                      <div className="border-t border-gold/10 pt-3 font-medium text-gold lg:border-t-0 lg:pt-0 lg:text-right">
                        ${Number(order.total).toFixed(0)}
                      </div>
                    </button>

                    {isOpen && (
                      <OrderDetails
                        order={order}
                        draft={draft}
                        updateStatus={updateStatus}
                        updateDraft={(patch) => updateTrackingDraft(order.id, patch)}
                        saveTracking={() => saveTracking(order)}
                        removeOrder={() => removeOrder(order)}
                        deleting={deletingOrderId === order.id}
                      />
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

function OrderDetails({
  order,
  draft,
  updateStatus,
  updateDraft,
  saveTracking,
  removeOrder,
  deleting,
}: {
  order: Order;
  draft: TrackingDraft;
  updateStatus: (id: string, status: Order["status"]) => void;
  updateDraft: (patch: Partial<TrackingDraft>) => void;
  saveTracking: () => void;
  removeOrder: () => void;
  deleting: boolean;
}) {
  return (
    <div className="border-t border-gold/10 bg-obsidian/35 p-4 sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <Panel title="Items">
            <OrderItems order={order} />
          </Panel>
          <Panel title="Shipping">
            <ShippingDetails order={order} />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Fulfillment">
            <FulfillmentControls order={order} updateStatus={updateStatus} />
          </Panel>
          <Panel title="Courier tracking">
            <TrackingEditor
              order={order}
              draft={draft}
              updateDraft={updateDraft}
              save={saveTracking}
            />
          </Panel>
          <Panel title="Admin actions">
            <RemoveOrderAction removeOrder={removeOrder} deleting={deleting} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 border border-gold/10 bg-charcoal/70 p-4">
      <div className="mb-3 text-sm font-medium text-gold">{title}</div>
      {children}
    </section>
  );
}

function OrderItems({ order }: { order: Order }) {
  return (
    <div className="space-y-3 text-sm">
      {order.order_items?.map((item, index) => (
        <div
          key={`${item.product_name}-${index}`}
          className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)] gap-3 border-b border-gold/10 pb-3 last:border-b-0 sm:grid-cols-[56px_1fr_auto] sm:items-start"
        >
          <OrderItemImage item={item} />
          <div className="min-w-0">
            <div className="break-words text-foreground/90">{item.product_name}</div>
            <div className="mt-1 text-xs text-muted-foreground">Quantity: {item.quantity}</div>
          </div>
          <div className="col-start-2 text-gold sm:col-start-auto sm:text-right">
            ${(Number(item.unit_price) * item.quantity).toFixed(0)}
          </div>
        </div>
      ))}
      <div className="flex justify-between border-t border-gold/10 pt-3 text-sm font-medium">
        <span>Total</span>
        <span className="text-gold">${Number(order.total).toFixed(0)}</span>
      </div>
    </div>
  );
}

function OrderItemImage({ item }: { item: Item }) {
  const imageSrc = imageForOrderItem(item);

  if (imageSrc) {
    return (
      <div className="flex h-14 w-14 items-center justify-center border border-gold/10 bg-obsidian p-1.5">
        <img
          src={imageSrc}
          alt={item.product_name}
          loading="lazy"
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center border border-gold/10 bg-obsidian text-gold/70">
      <Package className="h-5 w-5" />
    </div>
  );
}

function ShippingDetails({ order }: { order: Order }) {
  return (
    <div className="grid gap-4 text-sm sm:grid-cols-2">
      <InfoBlock label="Customer" value={order.shipping_name} />
      <InfoBlock label="Email" value={order.email} />
      <InfoBlock label="Address" value={order.shipping_address} />
      <InfoBlock
        label="City"
        value={`${order.shipping_city}${order.shipping_state ? `, ${order.shipping_state}` : ""} ${order.shipping_zip}`}
      />
    </div>
  );
}

function FulfillmentControls({
  order,
  updateStatus,
}: {
  order: Order;
  updateStatus: (id: string, status: Order["status"]) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => updateStatus(order.id, status)}
            disabled={order.status === status}
            className={`min-h-11 border px-3 py-2 text-sm transition-colors ${
              order.status === status
                ? "cursor-default border-gold bg-gold text-obsidian"
                : "border-gold/20 text-muted-foreground hover:border-gold hover:text-gold"
            }`}
          >
            {statusLabel(status)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <InfoBlock label="Courier status" value={trackingLabel(order.tracking_status)} />
        <InfoBlock label="Tracking number" value={order.tracking_number || "Not added"} />
        {order.tracking_url && (
          <a
            href={order.tracking_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light"
          >
            Open courier tracking <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function TrackingEditor({
  order,
  draft,
  updateDraft,
  save,
}: {
  order: Order;
  draft: TrackingDraft;
  updateDraft: (patch: Partial<TrackingDraft>) => void;
  save: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Shipping company</FieldLabel>
          <input
            value={draft.tracking_carrier}
            onChange={(event) => updateDraft({ tracking_carrier: event.target.value })}
            placeholder="UPS, FedEx, DHL, LBC"
            className={fieldClassName}
          />
        </label>

        <label className="block">
          <FieldLabel>Tracking number</FieldLabel>
          <input
            value={draft.tracking_number}
            onChange={(event) => updateDraft({ tracking_number: event.target.value })}
            placeholder="Courier tracking number"
            className={fieldClassName}
          />
        </label>
      </div>

      <label className="block">
        <FieldLabel>Tracking link</FieldLabel>
        <input
          value={draft.tracking_url}
          onChange={(event) => updateDraft({ tracking_url: event.target.value })}
          placeholder="https://courier.com/track/..."
          className={fieldClassName}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Courier status</FieldLabel>
          <select
            value={draft.tracking_status}
            onChange={(event) =>
              updateDraft({ tracking_status: event.target.value as TrackingStatus })
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

        <div className="block">
          <FieldLabel>Delivery estimate</FieldLabel>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                updateDraft({
                  estimated_delivery_date: "",
                  shipment_note: draft.shipment_note.trim()
                    ? draft.shipment_note
                    : noEstimatedDeliveryNote,
                })
              }
              className={`min-h-11 border px-3 py-2 text-left text-sm transition-colors ${
                !draft.estimated_delivery_date
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-gold/15 text-muted-foreground hover:border-gold/40"
              }`}
            >
              No date yet
            </button>
            <input
              type="date"
              value={draft.estimated_delivery_date}
              onChange={(event) => updateDraft({ estimated_delivery_date: event.target.value })}
              className={fieldClassName}
              aria-label="Estimated delivery date"
            />
          </div>
        </div>
      </div>

      <label className="block">
        <FieldLabel>Customer note</FieldLabel>
        <textarea
          value={draft.shipment_note}
          onChange={(event) => updateDraft({ shipment_note: event.target.value })}
          rows={3}
          placeholder="Package has been handed to the courier."
          className={`${fieldClassName} h-auto resize-none py-2`}
        />
      </label>

      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <button
          onClick={save}
          className="inline-flex min-h-11 items-center justify-center gap-2 bg-gold px-4 py-2 text-sm font-medium text-obsidian transition-colors hover:bg-gold-light"
        >
          <Save className="h-3.5 w-3.5" />
          Save tracking
        </button>

        {order.shipped_at && (
          <div className="text-xs text-muted-foreground">
            First shipped{" "}
            {new Date(order.shipped_at).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RemoveOrderAction({
  removeOrder,
  deleting,
}: {
  removeOrder: () => void;
  deleting: boolean;
}) {
  return (
    <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        Remove only test or try orders. This permanently deletes the order from the admin list.
      </p>
      <button
        onClick={removeOrder}
        disabled={deleting}
        className="inline-flex min-h-11 items-center justify-center gap-2 border border-destructive/40 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {deleting ? "Removing..." : "Remove order"}
      </button>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm text-foreground/90">{value}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-xs text-muted-foreground">{children}</span>;
}

function StatusBadge({
  status,
  children,
}: {
  status: Order["status"] | "tracking";
  children: ReactNode;
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

function trackingDraftFromOrder(order: Order): TrackingDraft {
  return {
    tracking_carrier: order.tracking_carrier ?? "",
    tracking_number: order.tracking_number ?? "",
    tracking_url: order.tracking_url ?? "",
    tracking_status: isTrackingStatus(order.tracking_status) ? order.tracking_status : "processing",
    estimated_delivery_date: order.estimated_delivery_date?.slice(0, 10) ?? "",
    shipment_note: order.shipment_note ?? "",
  };
}

function trackingPayloadFromDraft(draft: TrackingDraft, shippedAt?: string | null) {
  const payload: Record<string, string | null> = {
    tracking_carrier: draft.tracking_carrier,
    tracking_number: draft.tracking_number,
    tracking_url: draft.tracking_url,
    tracking_status: draft.tracking_status,
    shipment_note: draft.shipment_note,
    shipped_at: shippedAt ?? null,
  };

  if (draft.estimated_delivery_date) {
    payload.estimated_delivery_date = draft.estimated_delivery_date;
  }

  return payload;
}

function isTrackingStatus(status: unknown): status is TrackingStatus {
  return TRACKING_STATUSES.some((item) => item.value === status);
}

function trackingLabel(status: string | null | undefined) {
  return TRACKING_STATUSES.find((item) => item.value === status)?.label ?? "Preparing";
}

function statusLabel(status: "all" | Order["status"]) {
  if (status === "all") return "All";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getItemCount(order: Order) {
  return order.order_items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
}

const fieldClassName =
  "min-h-11 w-full border border-gold/15 bg-obsidian px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-gold/60";
