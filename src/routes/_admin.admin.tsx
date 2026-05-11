import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Package, ShoppingCart, Users, TrendingUp } from "lucide-react";
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

export const Route = createFileRoute("/_admin/admin")({ component: AdminDashboard });

type Stats = {
  revenue: number;
  orderCount: number;
  productCount: number;
  customerCount: number;
  recentOrders: { id: string; created_at: string; total: number; status: string; email: string }[];
  revenueByDay: { day: string; revenue: number }[];
  topProducts: { name: string; qty: number }[];
};

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin-data?resource=dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data as Stats);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error)
    return (
      <div className="p-12 text-center text-destructive text-sm">Error: {error}</div>
    );

  if (!stats)
    return (
      <div className="p-12 text-center text-muted-foreground text-sm">Loading metrics…</div>
    );

  const cards = [
    { label: "Total Revenue", value: `$${stats.revenue.toFixed(0)}`, icon: DollarSign },
    { label: "Orders", value: stats.orderCount.toString(), icon: ShoppingCart },
    { label: "Products", value: stats.productCount.toString(), icon: Package },
    { label: "Customers", value: stats.customerCount.toString(), icon: Users },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard — ZXG Admin</title>
      </Helmet>
      <div className="px-6 lg:px-10 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">Overview</div>
          <h1 className="font-display text-4xl md:text-5xl">
            Welcome to the <span className="text-gradient-gold italic">Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Real-time pulse of the house.</p>
        </motion.div>

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className="border border-gold/15 bg-charcoal p-6 hover:border-gold/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-luxury text-muted-foreground">
                      {c.label}
                    </div>
                    <div className="font-display text-3xl mt-3 text-gradient-gold">{c.value}</div>
                  </div>
                  <div className="p-2 border border-gold/30">
                    <Icon className="h-4 w-4 text-gold" strokeWidth={1.5} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-gold/15 bg-charcoal p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-4 w-4 text-gold" />
              <div className="text-[10px] uppercase tracking-luxury text-gold">
                Revenue · 14 days
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueByDay}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.13 80)" stopOpacity={0.5} />
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
                    fill="url(#g)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-gold/15 bg-charcoal p-6">
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">Top Products</div>
            {stats.topProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">No sales yet</div>
            ) : (
              <div className="h-72">
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

        <div className="mt-10 border border-gold/15 bg-charcoal">
          <div className="flex items-center justify-between p-6 border-b border-gold/15">
            <div className="text-[10px] uppercase tracking-luxury text-gold">Recent Orders</div>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No orders yet</div>
          ) : (
            <ul className="divide-y divide-gold/10">
              {stats.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <div className="font-display text-lg">#{o.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {o.email} · {new Date(o.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase tracking-luxury text-gold/80 border border-gold/30 px-2 py-1">
                      {o.status}
                    </span>
                    <div className="font-display text-xl text-gold">
                      ${Number(o.total).toFixed(0)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
