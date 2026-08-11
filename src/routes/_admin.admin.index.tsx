import { createFileRoute, Link } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock3,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { authFetch, readApiJson } from "@/lib/api";

export const Route = createFileRoute("/_admin/admin/")({ component: AdminDashboard });

type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";

type AdminOrder = {
  id: string;
  created_at: string;
  email: string;
  status: OrderStatus;
  total: number;
  shipping_name?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  tracking_number?: string | null;
  tracking_status?: string | null;
};

type Stats = {
  revenue: number;
  orderCount: number;
  pendingOrderCount: number;
  needsFulfillmentCount: number;
  productCount: number;
  customerCount: number;
  recentOrders: AdminOrder[];
  fulfillmentOrders: AdminOrder[];
  revenueByDay: { day: string; revenue: number }[];
  topProducts: { name: string; qty: number }[];
};

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

  useEffect(() => {
    authFetch("/api/admin-data?resource=dashboard")
      .then((response) => readApiJson<Stats>(response))
      .then((data) => setStats(normalizeStats(data)))
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Unable to load the dashboard"),
      );
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="text-sm text-destructive">The dashboard could not be loaded.</p>
        <p className="mt-2 text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="px-5 py-24 text-center text-sm text-muted-foreground">Loading dashboard…</div>
    );
  }

  const cards = [
    {
      label: "Revenue",
      value: formatMoney(stats.revenue),
      detail: "Paid orders",
      icon: DollarSign,
    },
    {
      label: "Orders",
      value: stats.orderCount.toLocaleString(),
      detail: "All store orders",
      icon: ShoppingCart,
    },
    {
      label: "Needs attention",
      value: stats.needsFulfillmentCount.toLocaleString(),
      detail: `${stats.pendingOrderCount} pending`,
      icon: Clock3,
    },
    {
      label: "Customers",
      value: stats.customerCount.toLocaleString(),
      detail: "Registered accounts",
      icon: Users,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard — GXZ Admin</title>
      </Helmet>

      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 border-b border-gold/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
              Store overview
            </p>
            <h1 className="mt-2 text-2xl font-medium text-foreground sm:text-3xl">Dashboard</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Review store activity and open the orders that need your attention.
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-gold px-4 text-sm font-medium text-obsidian transition-colors hover:bg-gold-light"
          >
            Manage orders
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section
          aria-label="Store totals"
          className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="border border-gold/15 bg-charcoal p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="mt-2 text-2xl font-medium text-foreground">{card.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center border border-gold/20 bg-gold/5">
                    <Icon className="h-4 w-4 text-gold" strokeWidth={1.7} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <OrdersPanel
            title="Orders needing attention"
            description="Open an order to add tracking or update its delivery status."
            orders={stats.fulfillmentOrders.slice(0, 6)}
            emptyMessage="All orders are up to date."
            icon={<Truck className="h-4 w-4" />}
          />
          <QuickActions stats={stats} />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <RevenueChart data={stats.revenueByDay} />
          <TopProducts data={stats.topProducts} />
        </div>

        <div className="mt-6">
          <OrdersPanel
            title="Recent orders"
            description="The latest order activity across the store."
            orders={stats.recentOrders.slice(0, 5)}
            emptyMessage="No orders have been placed yet."
            icon={<ShoppingCart className="h-4 w-4" />}
          />
        </div>
      </div>
    </>
  );
}

function OrdersPanel({
  title,
  description,
  orders,
  emptyMessage,
  icon,
}: {
  title: string;
  description: string;
  orders: AdminOrder[];
  emptyMessage: string;
  icon: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden border border-gold/15 bg-charcoal">
      <div className="flex items-start justify-between gap-4 border-b border-gold/10 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="text-gold">{icon}</span>
            {title}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        <Link
          to="/admin/orders"
          className="shrink-0 text-xs font-medium text-gold hover:text-gold-light"
        >
          View all
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-gold/10">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to="/admin/orders"
                className="grid gap-3 px-5 py-4 transition-colors hover:bg-surface/50 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      #{order.id.slice(0, 8)}
                    </span>
                    <StatusBadge status={order.status} />
                    {order.tracking_number && (
                      <span className="border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-300">
                        Tracking added
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {order.shipping_name || order.email}
                  </p>
                </div>
                <div className="min-w-0 text-xs text-muted-foreground">
                  <p>{formatDate(order.created_at)}</p>
                  <p className="mt-1 truncate">{formatLocation(order)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-sm font-medium text-gold">{formatMoney(order.total)}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function QuickActions({ stats }: { stats: Stats }) {
  const actions = [
    {
      to: "/admin/orders" as const,
      label: "Orders",
      detail: `${stats.needsFulfillmentCount} need attention`,
      icon: ShoppingCart,
    },
    {
      to: "/admin/products" as const,
      label: "Products",
      detail: `${stats.productCount} products listed`,
      icon: Package,
    },
    {
      to: "/admin/users" as const,
      label: "Customers",
      detail: `${stats.customerCount} registered accounts`,
      icon: Users,
    },
  ];

  return (
    <section className="border border-gold/15 bg-charcoal p-5">
      <h2 className="text-sm font-medium text-foreground">Quick actions</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Go directly to daily store tasks.
      </p>
      <div className="mt-4 space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="flex min-h-14 items-center gap-3 border border-gold/10 bg-obsidian/40 px-4 transition-colors hover:border-gold/35 hover:bg-surface"
            >
              <Icon className="h-4 w-4 shrink-0 text-gold" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-foreground">{action.label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {action.detail}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function RevenueChart({ data }: { data: Stats["revenueByDay"] }) {
  return (
    <section className="border border-gold/15 bg-charcoal p-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-gold" />
        <h2 className="text-sm font-medium text-foreground">Revenue — last 14 days</h2>
      </div>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.13 80)" stopOpacity={0.3} />
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
              contentStyle={tooltipStyle}
              formatter={(value) => formatMoney(Number(value))}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="oklch(0.78 0.13 80)"
              strokeWidth={2}
              fill="url(#adminRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function TopProducts({ data }: { data: Stats["topProducts"] }) {
  return (
    <section className="border border-gold/15 bg-charcoal p-5">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-gold" />
        <h2 className="text-sm font-medium text-foreground">Top products</h2>
      </div>
      {data.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">No sales yet</p>
      ) : (
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                stroke="oklch(0.96 0 0)"
                fontSize={10}
                width={105}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="qty" fill="oklch(0.78 0.13 80)" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const classes: Record<OrderStatus, string> = {
    pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    paid: "border-gold/30 bg-gold/10 text-gold",
    fulfilled: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
  };

  return (
    <span className={`border px-2 py-0.5 text-[11px] font-medium capitalize ${classes[status]}`}>
      {status}
    </span>
  );
}

const tooltipStyle = {
  background: "oklch(0.13 0 0)",
  border: "1px solid oklch(0.78 0.13 80 / 0.3)",
  borderRadius: 0,
  fontSize: 12,
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(toFiniteNumber(value));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLocation(order: AdminOrder) {
  return (
    [order.shipping_city, order.shipping_state].filter(Boolean).join(", ") || "Location unavailable"
  );
}
