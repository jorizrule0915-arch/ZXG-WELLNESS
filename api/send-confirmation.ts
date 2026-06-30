import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { Resend } from "resend";

const DEFAULT_FROM_EMAIL = "ZXG Wellness <orders@zxgwellness.com>";
const ORDER_TEAM_EMAILS = ["jorizrule0@gmail.com", "g@zxgwellness.com"];
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

type OrderEmailItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
};

type OrderEmail = {
  id: string;
  email: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_zip: string;
  total: number;
  created_at: string;
  items: OrderEmailItem[];
};

function setJsonHeaders(res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function getSupabaseAdmin(): SupabaseClient {
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(
    ".supabase.com",
    ".supabase.co",
  );
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

function sendApiError(res: VercelResponse, error: unknown) {
  const err = error as Error & { statusCode?: number };
  const status = err.statusCode ?? 500;
  return res.status(status).json({ error: err.message || "Server error" });
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(key);
}

function getAdminEmails(customerEmail: string) {
  const customer = customerEmail.toLowerCase();
  return ORDER_TEAM_EMAILS.filter((email) => email.toLowerCase() !== customer);
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildOrderEmailHtml(order: OrderEmail) {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#e8e8e8;">${escapeHtml(item.product_name)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#9a9a9a;text-align:center;">${item.quantity}</td>
          <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#c9a84c;text-align:right;">$${Number(item.unit_price).toFixed(2)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="margin:0;padding:32px;background:#0a0a0a;color:#e8e8e8;font-family:Georgia,serif;">
      <div style="max-width:640px;margin:0 auto;background:#111;border:1px solid #2a2a2a;">
        <div style="padding:32px;text-align:center;border-bottom:2px solid #c9a84c;">
          <div style="color:#c9a84c;letter-spacing:6px;font-size:11px;">ZXG WELLNESS</div>
          <h1 style="font-weight:400;color:#f5f0e8;">Order Confirmed</h1>
          <p style="color:#9a9a9a;">Payment status: <span style="color:#7ee787;">Paid</span></p>
        </div>
        <div style="padding:32px;">
          <p><strong style="color:#c9a84c;">Order:</strong> #${shortId}</p>
          <p><strong style="color:#c9a84c;">Date:</strong> ${orderDate}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">${itemRows}</table>
          <div style="margin-top:24px;text-align:right;font-size:22px;color:#c9a84c;">
            Total: $${Number(order.total).toFixed(2)}
          </div>
          <div style="margin-top:28px;">
            <p style="color:#c9a84c;letter-spacing:3px;">SHIPPING TO</p>
            <p>${escapeHtml(order.shipping_name)}<br/>${escapeHtml(order.shipping_address)}<br/>${escapeHtml(order.shipping_city)} ${escapeHtml(order.shipping_zip)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function sendOrderConfirmationEmail(order: OrderEmail) {
  const resend = getResend();
  const shortId = order.id.slice(0, 8).toUpperCase();
  const html = buildOrderEmailHtml(order);
  const { error } = await resend.emails.send({
    from: DEFAULT_FROM_EMAIL,
    to: order.email,
    replyTo: "admin@zxgwellness.com",
    subject: `Order Confirmed & Paid — #${shortId} | ZXG Wellness`,
    html,
  });

  if (error) throw new Error(JSON.stringify(error));

  const adminEmails = getAdminEmails(order.email);
  if (adminEmails.length > 0) {
    const { error: adminError } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: adminEmails,
      replyTo: order.email,
      subject: `Paid Order Received — #${shortId} | ZXG Wellness`,
      html,
    });
    if (adminError) console.warn("Admin order email failed:", adminError);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setJsonHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    enforceRateLimit(req, "send-confirmation", { limit: 10, windowMs: 60_000 });
    const { supabase, user } = await requireUser(req);
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.user_id !== user.id) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) return res.status(403).json({ error: "Forbidden" });
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      return res.status(500).json({ error: "Failed to fetch order items" });
    }

    await sendOrderConfirmationEmail({
      ...order,
      items: items || [],
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("send-confirmation error:", error);
    return sendApiError(res, error);
  }
}
