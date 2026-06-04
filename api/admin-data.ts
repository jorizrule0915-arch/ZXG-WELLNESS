import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

const defaultProducts = [
  {
    slug: "pen",
    name: "ZXG Wellness Reusable Injection Pen",
    tagline: "Precision-engineered metal pen",
    description:
      "Durable reusable injection pen with a premium metal body and adjustable dosing dial.",
    price: 20,
    category: "Accessories",
    image: "pen",
    ingredients: ["Metal construction", "Adjustable dial", "Reusable design"],
    benefits: ["Premium metal finish", "Smooth dose control", "Designed for long-term use"],
    featured: false,
    active: true,
    track_stock: false,
    stock_qty: 0,
    options: [
      { label: "Blue", price: 20 },
      { label: "Black", price: 20 },
      { label: "Dark Gray", price: 20 },
      { label: "Gold", price: 20 },
      { label: "Gray", price: 20 },
      { label: "Light Blue", price: 20 },
      { label: "Pink", price: 20 },
      { label: "Red", price: 20 },
      { label: "Silver", price: 20 },
    ],
  },
  {
    slug: "syringe",
    name: "ZXG Wellness Syringe",
    tagline: "Sterile precision - 100 per box",
    description:
      "Clean, precise syringes with dependable sterile packaging and multiple size choices.",
    price: 15,
    category: "Accessories",
    image: "syringe",
    ingredients: ["Sterile packaging", "Multiple sizes", "100 per box"],
    benefits: ["Small, mini, and large sizes", "Easy-to-read barrel markings", "Reliable handling"],
    featured: false,
    active: true,
    track_stock: false,
    stock_qty: 0,
    options: [
      { label: "Small (1ml 30g)", price: 15 },
      { label: "Mini (0.5ml 30g)", price: 15 },
      { label: "Large (3ml 23g)", price: 15 },
    ],
  },
  {
    slug: "cartridge",
    name: "ZXG Wellness Disposable 3mL Cartridges",
    tagline: "Standard 3mL - 10 per set",
    description:
      "Disposable cartridges built for a clean fit inside reusable ZXG injection pens.",
    price: 10,
    category: "Accessories",
    image: "cartridge",
    ingredients: ["3mL capacity", "Universal ZXG fit", "10 per set"],
    benefits: ["Reliable replacement option", "Built for ZXG reusable pens", "Compact set"],
    featured: false,
    active: true,
    track_stock: false,
    stock_qty: 0,
    options: [],
  },
  {
    slug: "needles",
    name: "ZXG Wellness Single-Use Pen Needles",
    tagline: "Ultra-fine micro-tip - 100 per box",
    description:
      "Single-use pen needles designed for a smoother attachment experience.",
    price: 10,
    category: "Accessories",
    image: "needles",
    ingredients: ["Ultra-fine micro-tip", "100 per box", "Clean sterile finish"],
    benefits: ["Works with ZXG pens", "Designed for controlled use", "Easy-to-store packaging"],
    featured: false,
    active: true,
    track_stock: false,
    stock_qty: 0,
    options: [
      { label: "32g x 4mm", price: 10 },
      { label: "31g x 8mm", price: 10 },
      { label: "6mm 31G", price: 10 },
    ],
  },
  {
    slug: "creatine",
    name: "ZXG Wellness Creatine Performance Matrix Powder",
    tagline: "Pure performance formula",
    description:
      "Creatine formula built to support strength output, workout endurance, and training recovery.",
    price: 29.99,
    category: "Supplements",
    image: "creatine",
    ingredients: ["Creatine Monohydrate"],
    benefits: ["Boosts strength", "Enhances endurance", "Supports recovery"],
    featured: true,
    active: true,
    track_stock: false,
    stock_qty: 0,
    options: [],
  },
  {
    slug: "body-balm",
    name: "ZXG Wellness Nourishing Body Balm",
    tagline: "Deeply moisturizing skin treatment",
    description:
      "Moisturizing body balm formulated with cocoa butter, shea butter, and squalane.",
    price: 16.99,
    category: "Skincare",
    image: "body-balm",
    ingredients: ["Cocoa Butter", "Shea Butter", "Squalane"],
    benefits: ["Deep moisture for dry skin", "Lightweight and non-greasy", "Comfortable daily-use finish"],
    featured: true,
    active: true,
    track_stock: false,
    stock_qty: 0,
    options: [
      { label: "Aloe Scent", price: 16.99 },
      { label: "Unscented", price: 16.99 },
      { label: "Pack (Both)", price: 23.99 },
    ],
  },
];

const defaultProductBaseFields = defaultProducts.map(
  ({ track_stock, stock_qty, options, ...product }) => product,
);

function setJsonHeaders(res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars missing.");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getBearerToken(req: VercelRequest) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function getClientIp(req: VercelRequest) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return firstForwarded?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function enforceRateLimit(
  req: VercelRequest,
  scope: string,
  options: { limit: number; windowMs: number },
) {
  const now = Date.now();
  const key = `${scope}:${getClientIp(req)}`;
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  if (bucket.count >= options.limit) {
    throw Object.assign(new Error("Too many requests"), { statusCode: 429 });
  }

  bucket.count += 1;
}

async function requireUser(req: VercelRequest): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const token = getBearerToken(req);
  if (!token) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });

  return { supabase, user: data.user };
}

async function requireAdmin(req: VercelRequest): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const { supabase, user } = await requireUser(req);
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  return { supabase, user };
}

function sendApiError(res: VercelResponse, error: unknown) {
  const err = error as Error & { statusCode?: number };
  const status = err.statusCode ?? 500;
  return res.status(status).json({ error: err.message || "Server error" });
}

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
          if ((data2 ?? []).length === 0) {
            const { data: seeded, error: seedError } = await supabase
              .from("products")
              .upsert(defaultProductBaseFields, { onConflict: "slug" })
              .select("id, slug, name, category, price, active, featured")
              .order("created_at", { ascending: false });
            if (seedError) return res.status(500).json({ error: seedError.message });
            return res.status(200).json((seeded ?? []).map((p: any) => ({
              ...p, track_stock: false, stock_qty: 0, options: []
            })));
          }
          return res.status(200).json((data2 ?? []).map((p: any) => ({
            ...p, track_stock: false, stock_qty: 0, options: []
          })));
        }
        if ((data ?? []).length === 0) {
          const { data: seeded, error: seedError } = await supabase
            .from("products")
            .upsert(defaultProducts, { onConflict: "slug" })
            .select("id, slug, name, category, price, active, featured, track_stock, stock_qty, options")
            .order("created_at", { ascending: false });
          if (seedError) return res.status(500).json({ error: seedError.message });
          return res.status(200).json(seeded ?? []);
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
