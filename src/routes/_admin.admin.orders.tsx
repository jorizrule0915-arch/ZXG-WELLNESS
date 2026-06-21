import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { authFetch, readApiJson } from "@/lib/api";

export const Route = createFileRoute("/_admin/admin/orders")({ component: AdminOrders });

type Item = { product_name: string; quantity: number; unit_price: number };
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

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, TrackingDraft>>({});

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

    try {
      const res = await authFetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-order-tracking",
          id: order.id,
          payload: {
            ...draft,
            shipped_at: order.shipped_at,
          },
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
        <title>Orders — ZXG Admin</title>
      </Helmet>
      <div className="px-5 py-8 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="border-b border-gold/15 pb-6">
            <div className="mb-2 text-[10px] uppercase tracking-luxury text-gold">Fulfillment</div>
            <h1 className="font-display text-3xl md:text-4xl">Orders</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Review payment status, shipping details, courier tracking, and fulfillment progress.
            </p>
          </div>
        </motion.div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`border px-4 py-2 text-[10px] uppercase tracking-luxury transition-colors ${
                filter === status
                  ? "border-gold bg-gold text-obsidian"
                  : "border-gold/30 text-muted-foreground hover:border-gold/60 hover:text-gold"
              }`}
            >
              {status}
              {status !== "all" && (
                <span className="ml-2 opacity-60">
                  {orders.filter((order) => order.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 border border-gold/15 bg-charcoal">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No orders</div>
          ) : (
            <ul className="divide-y divide-gold/10">
              {filtered.map((order) => {
                const isOpen = expanded.has(order.id);
                const draft = trackingDrafts[order.id] ?? trackingDraftFromOrder(order);

                return (
                  <li key={order.id}>
                    <button
                      onClick={() => toggle(order.id)}
                      className="grid w-full grid-cols-12 items-center px-6 py-5 text-left transition-colors hover:bg-surface/40"
                    >
                      <div className="col-span-1">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-gold" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="col-span-11 md:col-span-4">
                        <div className="font-display text-lg">#{order.id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground">{order.email}</div>
                      </div>
                      <div className="hidden text-xs text-muted-foreground md:col-span-3 md:block">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </div>
                      <div className="hidden md:col-span-2 md:block">
                        <span className="border border-gold/40 px-2 py-1 text-[10px] uppercase tracking-luxury text-gold">
                          {order.status}
                        </span>
                      </div>
                      <div className="hidden text-right font-display text-xl text-gold md:col-span-2 md:block">
                        ${Number(order.total).toFixed(0)}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="grid gap-8 border-t border-gold/10 bg-obsidian/40 px-6 pb-6 xl:grid-cols-[1fr_1fr_1fr_1.25fr]">
                        <OrderItems order={order} />
                        <ShippingDetails order={order} />
                        <FulfillmentControls order={order} updateStatus={updateStatus} />
                        <TrackingEditor
                          order={order}
                          draft={draft}
                          updateDraft={(patch) => updateTrackingDraft(order.id, patch)}
                          save={() => saveTracking(order)}
                        />
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

function OrderItems({ order }: { order: Order }) {
  return (
    <div>
      <div className="mb-3 mt-4 text-[10px] uppercase tracking-luxury text-gold">Items</div>
      <ul className="space-y-2 text-sm">
        {order.order_items?.map((item, index) => (
          <li key={`${item.product_name}-${index}`} className="flex justify-between gap-4">
            <span>
              {item.product_name} × {item.quantity}
            </span>
            <span className="text-gold">
              ${(Number(item.unit_price) * item.quantity).toFixed(0)}
            </span>
          </li>
        ))}
        <li className="flex justify-between border-t border-gold/15 pt-3 font-display text-lg">
          <span>Total</span>
          <span className="text-gold">${Number(order.total).toFixed(0)}</span>
        </li>
      </ul>
    </div>
  );
}

function ShippingDetails({ order }: { order: Order }) {
  return (
    <div>
      <div className="mb-3 mt-4 text-[10px] uppercase tracking-luxury text-gold">Shipping</div>
      <div className="space-y-1 text-sm text-foreground/80">
        <div>{order.shipping_name}</div>
        <div>{order.shipping_address}</div>
        <div>
          {order.shipping_city}
          {order.shipping_state ? `, ${order.shipping_state}` : ""} {order.shipping_zip}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{order.email}</div>
      </div>
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
      <div className="mb-3 mt-4 text-[10px] uppercase tracking-luxury text-gold">Update Status</div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => updateStatus(order.id, status)}
            disabled={order.status === status}
            className={`border px-3 py-2 text-[10px] uppercase tracking-luxury transition-colors ${
              order.status === status
                ? "cursor-default border-gold bg-gold text-obsidian"
                : "border-gold/30 text-muted-foreground hover:border-gold hover:text-gold"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="mt-6 border border-gold/10 bg-charcoal/70 p-4 text-sm">
        <div className="text-[9px] uppercase tracking-luxury text-muted-foreground">
          Courier Status
        </div>
        <div className="mt-1 text-gold">{trackingLabel(order.tracking_status)}</div>
        {order.tracking_number && (
          <div className="mt-2 text-xs text-muted-foreground">#{order.tracking_number}</div>
        )}
        {order.tracking_url && (
          <a
            href={order.tracking_url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-luxury text-gold hover:text-gold-light"
          >
            Open tracking <ExternalLink className="h-3 w-3" />
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
    <div>
      <div className="mb-3 mt-4 text-[10px] uppercase tracking-luxury text-gold">
        Courier Tracking
      </div>
      <div className="space-y-3">
        <label className="block">
          <FieldLabel>Shipping company</FieldLabel>
          <input
            value={draft.tracking_carrier}
            onChange={(event) => updateDraft({ tracking_carrier: event.target.value })}
            placeholder="UPS, FedEx, DHL, LBC..."
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

          <label className="block">
            <FieldLabel>Estimated delivery</FieldLabel>
            <input
              type="date"
              value={draft.estimated_delivery_date}
              onChange={(event) => updateDraft({ estimated_delivery_date: event.target.value })}
              className={fieldClassName}
            />
          </label>
        </div>

        <label className="block">
          <FieldLabel>Customer note</FieldLabel>
          <textarea
            value={draft.shipment_note}
            onChange={(event) => updateDraft({ shipment_note: event.target.value })}
            rows={3}
            placeholder="Example: Package has been handed to the courier."
            className={`${fieldClassName} resize-none`}
          />
        </label>

        <button
          onClick={save}
          className="inline-flex items-center gap-2 bg-gold px-4 py-2 text-[10px] uppercase tracking-luxury text-obsidian transition-colors hover:bg-gold-light"
        >
          <Save className="h-3.5 w-3.5" />
          Save Tracking
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

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block text-[9px] uppercase tracking-luxury text-muted-foreground">
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

function isTrackingStatus(status: unknown): status is TrackingStatus {
  return TRACKING_STATUSES.some((item) => item.value === status);
}

function trackingLabel(status: string | null | undefined) {
  return TRACKING_STATUSES.find((item) => item.value === status)?.label ?? "Preparing";
}

const fieldClassName =
  "w-full border border-gold/20 bg-obsidian px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-gold";
