import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Mail, Package, RefreshCw, Save, Search, Trash2, Truck } from "lucide-react";
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
  tracking_location?: string | null;
  tracking_updated_at?: string | null;
  order_items: Item[];
};

type TrackingDraft = {
  tracking_carrier: string;
  tracking_number: string;
  tracking_url: string;
  tracking_status: TrackingStatus;
  estimated_delivery_date: string;
  shipment_note: string;
  tracking_location: string;
  tracking_updated_at: string;
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
const TRACKING_CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Canada Post", "Royal Mail", "Other"];

const emptyTrackingDraft: TrackingDraft = {
  tracking_carrier: "",
  tracking_number: "",
  tracking_url: "",
  tracking_status: "processing",
  estimated_delivery_date: "",
  shipment_note: "",
  tracking_location: "",
  tracking_updated_at: "",
};

const noEstimatedDeliveryNote =
  "Shipping label has been created. USPS will show an estimated delivery date once they receive and scan the package.";

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, TrackingDraft>>({});
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [resendingOrderId, setResendingOrderId] = useState<string | null>(null);
  const [sendingTrackingOrderId, setSendingTrackingOrderId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin-data?resource=orders");
      const data = await readApiJson<Order[]>(res);
      const rows = Array.isArray(data) ? data : [];
      setOrders(rows);
      setSelectedOrderId((current) =>
        current && rows.some((order) => order.id === current) ? current : (rows[0]?.id ?? null),
      );
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

    setSendingTrackingOrderId(order.id);
    try {
      const res = await authFetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-and-send-tracking",
          id: order.id,
          payload,
        }),
      });
      const result = await readApiJson<{
        order: Order;
        emailSent: boolean;
        recipients: string[];
      }>(res);
      if (!result.emailSent) throw new Error("Email delivery was not confirmed");
      const updated = { ...order, ...result.order };
      toast.success("Tracking saved and email sent successfully");
      setOrders((prev) =>
        prev.map((item) => (item.id === order.id ? { ...item, ...updated } : item)),
      );
      setTrackingDrafts((prev) => ({
        ...prev,
        [order.id]: trackingDraftFromOrder(updated),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save and send tracking");
    } finally {
      setSendingTrackingOrderId(null);
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
      setSelectedOrderId((current) => (current === order.id ? null : current));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove order");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const resendOrderEmail = async (order: Order) => {
    const confirmed = window.confirm(
      `Resend order details for #${order.id.slice(0, 8)} to ${order.email}?`,
    );
    if (!confirmed) return;

    setResendingOrderId(order.id);
    try {
      const res = await authFetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      await readApiJson(res);
      toast.success(`Order details sent to ${order.email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend order details");
    } finally {
      setResendingOrderId(null);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = orders.filter((order) => {
    if (filter !== "all" && order.status !== filter) return false;
    if (!normalizedSearch) return true;
    return [
      order.id,
      order.email,
      order.shipping_name,
      order.tracking_number,
      order.tracking_carrier,
    ].some((value) => value?.toLowerCase().includes(normalizedSearch));
  });
  const selectedOrder =
    filtered.find((order) => order.id === selectedOrderId) ?? filtered[0] ?? null;
  const needsTracking = orders.filter(
    (order) => order.status === "paid" && !order.tracking_number,
  ).length;

  return (
    <>
      <Helmet>
        <title>Orders - GXZ Admin</title>
      </Helmet>
      <div className="overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="grid gap-4 border-b border-white/[0.08] pb-6 sm:flex sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a84c]">
                Commerce operations
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Orders</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Review purchases, manage fulfillment, and send confirmed delivery updates.
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-300 transition hover:bg-white/[0.07] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </motion.div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Total orders" value={orders.length} detail="All recorded orders" />
          <MetricCard
            label="Paid"
            value={orders.filter((order) => order.status === "paid").length}
            detail="Ready for fulfillment"
          />
          <MetricCard
            label="Needs tracking"
            value={needsTracking}
            detail="Paid without a tracking number"
            alert={needsTracking > 0}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-white/[0.08] bg-[#101318] p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, customer, email, or tracking"
              className="min-h-10 w-full rounded-md border border-white/10 bg-[#0b0d10] pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#c9a84c]/60"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto" aria-label="Filter orders by status">
            {(["all", ...STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`min-h-9 shrink-0 rounded-md px-3 text-xs font-medium transition-colors ${
                  filter === status
                    ? "bg-[#c9a84c] text-[#0b0d10]"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {statusLabel(status)}
                <span className="ml-1.5 opacity-60">
                  {status === "all"
                    ? orders.length
                    : orders.filter((order) => order.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(360px,0.72fr)_minmax(620px,1.28fr)]">
          <section className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#101318]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Order queue</h2>
              <span className="text-xs text-slate-500">{filtered.length} shown</span>
            </div>
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">Loading orders...</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">No matching orders</div>
            ) : (
              <ul className="max-h-[calc(100vh-340px)] min-h-[360px] divide-y divide-white/[0.06] overflow-y-auto">
                {filtered.map((order) => {
                  const active = selectedOrder?.id === order.id;
                  return (
                    <li key={order.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`w-full border-l-2 px-4 py-4 text-left transition-colors ${
                          active
                            ? "border-l-[#c9a84c] bg-[#c9a84c]/[0.07]"
                            : "border-l-transparent hover:bg-white/[0.035]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-white">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <StatusBadge status={order.status}>
                                {statusLabel(order.status)}
                              </StatusBadge>
                            </div>
                            <p className="mt-2 truncate text-sm text-slate-300">
                              {order.shipping_name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">{order.email}</p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-[#d8b85b]">
                            ${Number(order.total).toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {new Date(order.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span>
                            {getItemCount(order)} {getItemCount(order) === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="min-w-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#101318] xl:sticky xl:top-5">
            {selectedOrder ? (
              <>
                <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-500">Selected order</div>
                    <h2 className="mt-1 text-lg font-semibold text-white">
                      #{selectedOrder.id.slice(0, 8).toUpperCase()}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedOrder.tracking_number && (
                      <StatusBadge status="tracking">Tracking added</StatusBadge>
                    )}
                    <StatusBadge status={selectedOrder.status}>
                      {statusLabel(selectedOrder.status)}
                    </StatusBadge>
                  </div>
                </div>
                <OrderDetails
                  order={selectedOrder}
                  draft={trackingDrafts[selectedOrder.id] ?? trackingDraftFromOrder(selectedOrder)}
                  updateStatus={updateStatus}
                  updateDraft={(patch) => updateTrackingDraft(selectedOrder.id, patch)}
                  saveTracking={() => saveTracking(selectedOrder)}
                  resendOrderEmail={() => resendOrderEmail(selectedOrder)}
                  removeOrder={() => removeOrder(selectedOrder)}
                  deleting={deletingOrderId === selectedOrder.id}
                  resending={resendingOrderId === selectedOrder.id}
                  savingTracking={sendingTrackingOrderId === selectedOrder.id}
                />
              </>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <Truck className="h-8 w-8 text-slate-700" />
                <p className="mt-3 text-sm text-slate-400">Select an order to view its details.</p>
              </div>
            )}
          </section>
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
  resendOrderEmail,
  removeOrder,
  deleting,
  resending,
  savingTracking,
}: {
  order: Order;
  draft: TrackingDraft;
  updateStatus: (id: string, status: Order["status"]) => void;
  updateDraft: (patch: Partial<TrackingDraft>) => void;
  saveTracking: () => void;
  resendOrderEmail: () => void;
  removeOrder: () => void;
  deleting: boolean;
  resending: boolean;
  savingTracking: boolean;
}) {
  return (
    <div className="p-4 sm:p-5">
      <div className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">
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
              saving={savingTracking}
            />
          </Panel>
          <Panel title="Customer email">
            <ResendOrderEmailAction
              email={order.email}
              resendOrderEmail={resendOrderEmail}
              resending={resending}
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
    <section className="min-w-0 rounded-lg border border-white/[0.08] bg-[#0d1014] p-4">
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {title}
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  alert = false,
}: {
  label: string;
  value: number;
  detail: string;
  alert?: boolean;
}) {
  return (
    <section className="rounded-lg border border-white/[0.08] bg-[#101318] px-4 py-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${alert ? "text-amber-300" : "text-white"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-600">{detail}</div>
    </section>
  );
}

function OrderItems({ order }: { order: Order }) {
  return (
    <div className="space-y-3 text-sm">
      {order.order_items?.map((item, index) => (
        <div
          key={`${item.product_name}-${index}`}
          className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)] gap-3 border-b border-white/[0.07] pb-3 last:border-b-0 sm:grid-cols-[56px_1fr_auto] sm:items-start"
        >
          <OrderItemImage item={item} />
          <div className="min-w-0">
            <div className="break-words text-slate-200">{item.product_name}</div>
            <div className="mt-1 text-xs text-slate-500">Quantity: {item.quantity}</div>
          </div>
          <div className="col-start-2 text-[#d8b85b] sm:col-start-auto sm:text-right">
            ${(Number(item.unit_price) * item.quantity).toFixed(0)}
          </div>
        </div>
      ))}
      <div className="flex justify-between border-t border-white/[0.07] pt-3 text-sm font-medium text-slate-200">
        <span>Total</span>
        <span className="text-[#d8b85b]">${Number(order.total).toFixed(2)}</span>
      </div>
    </div>
  );
}

function OrderItemImage({ item }: { item: Item }) {
  const imageSrc = imageForOrderItem(item);

  if (imageSrc) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-md border border-white/[0.08] bg-white p-1.5">
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
    <div className="flex h-14 w-14 items-center justify-center rounded-md border border-white/[0.08] bg-[#090b0e] text-[#c9a84c]">
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
            className={`min-h-10 rounded-md border px-3 py-2 text-sm transition-colors ${
              order.status === status
                ? "cursor-default border-[#c9a84c] bg-[#c9a84c] text-[#0b0d10]"
                : "border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {statusLabel(status)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 border-t border-white/[0.07] pt-4 text-sm sm:grid-cols-2">
        <InfoBlock label="Courier status" value={trackingLabel(order.tracking_status)} />
        <InfoBlock label="Tracking number" value={order.tracking_number || "Not added"} />
        {order.tracking_url && (
          <a
            href={order.tracking_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#d8b85b] hover:text-[#ecd783]"
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
  saving,
}: {
  order: Order;
  draft: TrackingDraft;
  updateDraft: (patch: Partial<TrackingDraft>) => void;
  save: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Shipping carrier</FieldLabel>
          <select
            value={draft.tracking_carrier}
            onChange={(event) => updateDraft({ tracking_carrier: event.target.value })}
            className={fieldClassName}
          >
            <option value="">Select carrier</option>
            {!TRACKING_CARRIERS.includes(draft.tracking_carrier) && draft.tracking_carrier && (
              <option value={draft.tracking_carrier}>{draft.tracking_carrier}</option>
            )}
            {TRACKING_CARRIERS.map((carrier) => (
              <option key={carrier} value={carrier}>
                {carrier}
              </option>
            ))}
          </select>
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
        <FieldLabel>Custom tracking link (only needed for Other)</FieldLabel>
        <input
          value={draft.tracking_url}
          onChange={(event) => updateDraft({ tracking_url: event.target.value })}
          placeholder="Known carriers use their official tracking page automatically"
          className={fieldClassName}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Shipment status</FieldLabel>
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
              className={`min-h-11 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                !draft.estimated_delivery_date
                  ? "border-[#c9a84c]/60 bg-[#c9a84c]/10 text-[#dfc46e]"
                  : "border-white/10 text-slate-400 hover:border-white/20"
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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Current shipment location</FieldLabel>
          <input
            value={draft.tracking_location}
            onChange={(event) => updateDraft({ tracking_location: event.target.value })}
            placeholder="Albuquerque, NM distribution center"
            className={fieldClassName}
          />
        </label>

        <label className="block">
          <FieldLabel>Update date and time</FieldLabel>
          <input
            type="datetime-local"
            value={draft.tracking_updated_at}
            onChange={(event) => updateDraft({ tracking_updated_at: event.target.value })}
            className={fieldClassName}
          />
        </label>
      </div>

      <label className="block">
        <FieldLabel>Latest shipment update</FieldLabel>
        <textarea
          value={draft.shipment_note}
          onChange={(event) => updateDraft({ shipment_note: event.target.value })}
          rows={3}
          placeholder="Package arrived at the carrier facility."
          className={`${fieldClassName} h-auto resize-none py-2`}
        />
      </label>

      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-[#0b0d10] transition-colors hover:bg-[#dfc46e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving & sending..." : "Save & Send"}
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

function ResendOrderEmailAction({
  email,
  resendOrderEmail,
  resending,
}: {
  email: string;
  resendOrderEmail: () => void;
  resending: boolean;
}) {
  return (
    <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm leading-6 text-muted-foreground">
          Resend the Outlook-safe order confirmation and receipt to this customer.
        </p>
        <p className="mt-1 break-all text-xs text-foreground/70">{email}</p>
      </div>
      <button
        onClick={resendOrderEmail}
        disabled={resending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Mail className="h-3.5 w-3.5" />
        {resending ? "Sending..." : "Resend order details"}
      </button>
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
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-red-400/25 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
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
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm text-slate-200">{value}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-slate-400">{children}</span>;
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
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${classes[status]}`}
    >
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
    tracking_location: order.tracking_location ?? "",
    tracking_updated_at: toDateTimeLocal(order.tracking_updated_at),
  };
}

function trackingPayloadFromDraft(draft: TrackingDraft, shippedAt?: string | null) {
  const payload: Record<string, string | null> = {
    tracking_carrier: draft.tracking_carrier,
    tracking_number: draft.tracking_number,
    tracking_url: draft.tracking_url,
    tracking_status: draft.tracking_status,
    shipment_note: draft.shipment_note,
    tracking_location: draft.tracking_location,
    tracking_updated_at: draft.tracking_updated_at
      ? new Date(draft.tracking_updated_at).toISOString()
      : null,
    shipped_at: shippedAt ?? null,
  };

  if (draft.estimated_delivery_date) {
    payload.estimated_delivery_date = draft.estimated_delivery_date;
  }

  return payload;
}

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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
  "min-h-11 w-full rounded-md border border-white/10 bg-[#090b0e] px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-[#c9a84c]/60";
