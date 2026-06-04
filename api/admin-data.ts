import type { VercelRequest, VercelResponse } from "@vercel/node";
import { enforceRateLimit, requireAdmin, sendApiError, setJsonHeaders } from "../server/security";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setJsonHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const resource = req.query.resource as string;

  try {
    enforceRateLimit(req, "admin-data", { limit: req.method === "GET" ? 120 : 30, windowMs: 60_000 });
    const { supabase } = await requireAdmin(req);

    // ── GET requests ──────────────────────────────────────────────
    if (req.method === "GET") {
      if (resource === "orders") {
        const { data, error } = await supabase
          .from("orders")
          .select("*, order_items(product_name, quantity, unit_price)")
          .order("created_at", { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }

      if (resource === "products") {
        const { data, error } = await supabase
          .from("products")
          .select("id, slug, name, category, price, active, featured, track_stock, stock_qty, options")
          .order("created_at", { ascending: false });
        if (error) {
          // Fallback: columns may not exist yet — fetch without new columns
          const { data: data2, error: error2 } = await supabase
            .from("products")
            .select("id, slug, name, category, price, active, featured")
            .order("created_at", { ascending: false });
          if (error2) return res.status(500).json({ error: error2.message });
          return res.status(200).json((data2 ?? []).map((p: any) => ({
            ...p, track_stock: false, stock_qty: 0, options: []
          })));
        }
        return res.status(200).json(data);
      }

      if (resource === "users") {
        // Get auth users (has email)
        const { data: authData, error: authError } =
          await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (authError) return res.status(500).json({ error: authError.message });

        const authUsers = authData.users;

        // Get profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, created_at, status, admin_notes")
          .order("created_at", { ascending: false });

        // Get roles
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role");

        // Get orders
        const { data: orders } = await supabase
          .from("orders")
          .select("user_id, total");

        const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
        const adminIds = new Set(
          (roles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id),
        );
        const orderMap = new Map<string, { count: number; total: number }>();
        (orders ?? []).forEach((o: any) => {
          const prev = orderMap.get(o.user_id) ?? { count: 0, total: 0 };
          orderMap.set(o.user_id, {
            count: prev.count + 1,
            total: prev.total + Number(o.total),
          });
        });

        const users = authUsers.map((u) => {
          const profile = profileMap.get(u.id) as any;
          return {
            id: u.id,
            email: u.email ?? "",
            full_name: profile?.full_name ?? "",
            status: profile?.status ?? "active",
            admin_notes: profile?.admin_notes ?? "",
            created_at: u.created_at,
            is_admin: adminIds.has(u.id),
            order_count: orderMap.get(u.id)?.count ?? 0,
            total_spent: orderMap.get(u.id)?.total ?? 0,
          };
        });

        return res.status(200).json(users);
      }

      if (resource === "dashboard") {
        const [ordersRes, productsRes, itemsRes, authData] = await Promise.all([
          supabase
            .from("orders")
            .select("id, created_at, total, status, email")
            .order("created_at", { ascending: false }),
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("order_items").select("product_name, quantity"),
          supabase.auth.admin.listUsers({ perPage: 1000 }),
        ]);

        const orders = ordersRes.data ?? [];
        const revenue = orders.reduce((sum: number, o: any) => sum + Number(o.total), 0);

        const days: { day: string; revenue: number }[] = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          const dayRev = orders
            .filter((o: any) => o.created_at.slice(0, 10) === key)
            .reduce((s: number, o: any) => s + Number(o.total), 0);
          days.push({
            day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            revenue: dayRev,
          });
        }

        const map = new Map<string, number>();
        (itemsRes.data ?? []).forEach((i: any) => {
          map.set(i.product_name, (map.get(i.product_name) ?? 0) + i.quantity);
        });
        const topProducts = [...map.entries()]
          .map(([name, qty]) => ({ name, qty }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);

        return res.status(200).json({
          revenue,
          orderCount: orders.length,
          productCount: productsRes.count ?? 0,
          customerCount: authData.data?.users?.length ?? 0,
          recentOrders: orders.slice(0, 5),
          revenueByDay: days,
          topProducts,
        });
      }

      return res.status(400).json({ error: "Unknown resource" });
    }

    // ── POST requests ─────────────────────────────────────────────
    if (req.method === "POST") {
      const { action, id, payload } = req.body || {};

      if (action === "update-order-status") {
        const { error } = await supabase
          .from("orders")
          .update({ status: payload.status })
          .eq("id", id);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
      }

      if (action === "toggle-product-active") {
        const { error } = await supabase
          .from("products")
          .update({ active: payload.active })
          .eq("id", id);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
      }

      if (action === "delete-product") {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
      }

      if (action === "update-user-status") {
        const { error } = await supabase
          .from("profiles")
          .update({ status: payload.status })
          .eq("id", id);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
      }

      if (action === "save-user-notes") {
        const { error } = await supabase
          .from("profiles")
          .update({ admin_notes: payload.notes })
          .eq("id", id);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
      }

      if (action === "toggle-admin") {
        if (payload.isAdmin) {
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", id)
            .eq("role", "admin");
          if (error) return res.status(500).json({ error: error.message });
        } else {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: id, role: "admin" });
          if (error) return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: "Unknown action" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return sendApiError(res, err);
  }
}
