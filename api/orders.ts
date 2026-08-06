import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "crypto";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { Resend } from "resend";
import { loadLocalEnv } from "./local-env";
import {
  getOrderNotificationEmails,
  brandFromEmail,
  brandReplyToEmail,
} from "../server/email-config";
import { publicErrorMessage, rejectDisallowedOrigin, setApiHeaders } from "../server/http-security";

const SHIPPING_FEE = 10;
const FREE_SHIPPING_THRESHOLD = 50;
const PEN_DISCOUNT_MIN_QTY = 5;
const PEN_DISCOUNT_RATE = 0.1;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

type CheckoutItemInput = {
  slug: string;
  quantity: number;
  optionLabel?: string;
  name?: string;
};

type TrustedProduct = {
  slug: string;
  name: string;
  price: number;
  active: boolean;
};

type ProductPriceRow = Pick<TrustedProduct, "slug" | "name" | "price" | "active">;

type OrderEmailItem = {
  product_name: string;
  product_slug?: string | null;
  quantity: number;
  unit_price: number;
};

type OrderEmail = {
  id: string;
  email: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state?: string | null;
  shipping_zip: string;
  total: number;
  created_at: string;
  items: OrderEmailItem[];
};

type OrderEmailResult = {
  customerSent: boolean;
  adminSent: boolean;
  errors: string[];
};

const localProducts: Array<TrustedProduct & { optionPrices?: Record<string, number> }> = [
  {
    slug: "pen",
    name: "GXZ Health and Wellness Reusable Injection Pen",
    price: 20,
    active: true,
    optionPrices: {
      Blue: 20,
      Black: 20,
      Gold: 20,
      Gray: 20,
      Pink: 20,
      Purple: 20,
      Red: 20,
      Green: 20,
      Bronze: 20,
      Silver: 20,
    },
  },
  {
    slug: "syringe",
    name: "GXZ Health and Wellness Syringe",
    price: 15,
    active: true,
    optionPrices: {
      "Small (1ml 30g)": 15,
      "Mini (0.5ml 30g)": 15,
      "Large (3ml 23g)": 15,
    },
  },
  {
    slug: "cartridge",
    name: "GXZ Health and Wellness Disposable 3mL Cartridges",
    price: 10,
    active: true,
  },
  {
    slug: "needles",
    name: "GXZ Health and Wellness Single-Use Pen Needles",
    price: 10,
    active: true,
    optionPrices: {
      "32G x 4mm - Box of 100": 10,
      "31G x 6mm - Box of 100": 10,
      "31G x 8mm - Box of 100": 10,
      "32Gx4mm": 10,
      "31Gx6mm": 10,
      "31Gx8mm": 10,
      "32g x 4mm": 10,
      "31g x 8mm": 10,
      "32g × 4mm": 10,
      "31g × 8mm": 10,
      "32g Ã— 4mm": 10,
      "31g Ã— 8mm": 10,
      "6mm 31G": 10,
      "6mm x 31G": 10,
      "31G x 6mm": 10,
    },
  },
  {
    slug: "creatine",
    name: "GXZ Health and Wellness Creatine Performance Matrix Powder",
    price: 29.99,
    active: true,
  },
  {
    slug: "body-balm",
    name: "GXZ Health and Wellness Nourishing Body Balm",
    price: 16.99,
    active: true,
    optionPrices: {
      "Aloe Scent": 16.99,
      Unscented: 16.99,
      "Pack (Both)": 23.99,
    },
  },
];

function getSupabaseAdmin(): SupabaseClient {
  loadLocalEnv();
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
  return res.status(status).json({ error: publicErrorMessage(error, "Order request failed") });
}

function normalizeOption(item: CheckoutItemInput) {
  if (item.optionLabel) return item.optionLabel;
  const name = item.name ?? "";
  const separators = [" — ", " â€” ", " Ã¢â‚¬â€ ", " - "];
  for (const sep of separators) {
    if (name.includes(sep)) return name.split(sep).pop()?.trim();
  }
  return undefined;
}

function cents(amount: number) {
  return Math.round(amount * 100);
}

function money(amount: number) {
  return Math.round(amount * 100) / 100;
}

function getResend() {
  loadLocalEnv();
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(key);
}

function getAdminEmails(customerEmail: string) {
  const customer = customerEmail.toLowerCase();
  return getOrderNotificationEmails().filter((email) => email.toLowerCase() !== customer);
}

function resendErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown Resend error";
  }
}

async function sendEmail(
  resend: Resend,
  payload: Parameters<Resend["emails"]["send"]>[0],
  label: string,
) {
  try {
    const { error } = await resend.emails.send(payload);
    return error ? `${label}: ${resendErrorMessage(error)}` : null;
  } catch (error) {
    return `${label}: ${resendErrorMessage(error)}`;
  }
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(value: number) {
  return `$${(Math.round(Number(value) * 100) / 100).toFixed(2)}`;
}

function getOrderEmailTotals(order: OrderEmail) {
  const discountedSubtotal =
    Math.round(
      order.items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0) *
        100,
    ) / 100;
  const penQuantity = order.items
    .filter((item) => item.product_slug === "pen")
    .reduce((quantity, item) => quantity + Number(item.quantity), 0);
  const penDiscount =
    Math.round(
      (penQuantity >= PEN_DISCOUNT_MIN_QTY
        ? order.items
            .filter((item) => item.product_slug === "pen")
            .reduce(
              (sum, item) =>
                sum +
                Number(item.unit_price) *
                  Number(item.quantity) *
                  (PEN_DISCOUNT_RATE / (1 - PEN_DISCOUNT_RATE)),
              0,
            )
        : 0) * 100,
    ) / 100;
  const merchandiseSubtotal = Math.round((discountedSubtotal + penDiscount) * 100) / 100;
  const orderTotal = Math.round(Number(order.total) * 100) / 100;
  const shipping = Math.round(Math.max(0, orderTotal - discountedSubtotal) * 100) / 100;

  return { discountedSubtotal, penDiscount, merchandiseSubtotal, orderTotal, shipping };
}

function buildOrderEmailHtml(order: OrderEmail) {
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortId = order.id.slice(0, 8).toUpperCase();
  const { discountedSubtotal, penDiscount, merchandiseSubtotal, orderTotal, shipping } =
    getOrderEmailTotals(order);
  const freeShippingApplies = shipping === 0 && merchandiseSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingState = order.shipping_state ? `, ${escapeHtml(order.shipping_state)}` : "";

  const itemRows = order.items
    .map((item) => {
      const itemTotal = Number(item.unit_price) * Number(item.quantity);
      return `
        <tr>
          <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">${escapeHtml(item.product_name)}</td>
          <td align="center" style="padding:12px 10px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">${Number(item.quantity)}</td>
          <td align="right" style="padding:12px 10px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">${formatMoney(Number(item.unit_price))}</td>
          <td align="right" style="padding:12px 10px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">${formatMoney(itemTotal)}</td>
        </tr>`;
    })
    .join("");

  const summaryRow = (label: string, value: string, bold = false) => `
    <tr>
      <td align="right" style="padding:5px 10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#374151;${bold ? "font-weight:bold;" : ""}">${label}</td>
      <td align="right" width="120" style="padding:5px 10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;${bold ? "font-weight:bold;" : ""}">${value}</td>
    </tr>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed — GXZ Health and Wellness</title>
</head>
<body bgcolor="#f6f4ef" style="margin:0;padding:0;background-color:#f6f4ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6f4ef" style="border-collapse:collapse;background-color:#f6f4ef;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:640px;max-width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:24px 28px;border-bottom:4px solid #c9a84c;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 8px 0;font-size:12px;line-height:18px;color:#8a6f24;font-weight:bold;">GXZ Health and Wellness</p>
              <h1 style="margin:0 0 8px 0;font-size:24px;line-height:30px;color:#111827;font-weight:bold;">Order Confirmed</h1>
              <p style="margin:0;font-size:14px;line-height:22px;color:#374151;">Payment status: <strong style="color:#047857;">Paid</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 28px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:0 0 8px 0;font-size:14px;line-height:22px;color:#374151;"><strong style="color:#111827;">Order:</strong> #${shortId}</td>
                </tr>
                <tr>
                  <td style="padding:0 0 8px 0;font-size:14px;line-height:22px;color:#374151;"><strong style="color:#111827;">Date:</strong> ${orderDate}</td>
                </tr>
              </table>

              <h2 style="margin:22px 0 10px 0;font-size:16px;line-height:22px;color:#111827;font-weight:bold;">Items ordered</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e5e7eb;">
                <tr bgcolor="#f3f4f6" style="background-color:#f3f4f6;">
                  <td style="padding:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#374151;font-weight:bold;">Item</td>
                  <td align="center" width="70" style="padding:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#374151;font-weight:bold;">Qty</td>
                  <td align="right" width="90" style="padding:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#374151;font-weight:bold;">Price</td>
                  <td align="right" width="90" style="padding:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#374151;font-weight:bold;">Total</td>
                </tr>
                ${itemRows}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;border-collapse:collapse;">
                ${summaryRow("Merchandise subtotal", formatMoney(merchandiseSubtotal))}
                ${penDiscount > 0 ? summaryRow("Reusable pen discount", `-${formatMoney(penDiscount)}`) : ""}
                ${penDiscount > 0 ? summaryRow("Subtotal after discount", formatMoney(discountedSubtotal)) : ""}
                ${summaryRow(`Shipping${freeShippingApplies ? " ($50+ free shipping)" : ""}`, shipping === 0 ? "Free" : formatMoney(shipping))}
                ${summaryRow("Order total", formatMoney(orderTotal), true)}
              </table>

              <h2 style="margin:24px 0 8px 0;font-size:16px;line-height:22px;color:#111827;font-weight:bold;">Shipping to</h2>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#374151;">
                ${escapeHtml(order.shipping_name)}<br />
                ${escapeHtml(order.shipping_address)}<br />
                ${escapeHtml(order.shipping_city)}${shippingState} ${escapeHtml(order.shipping_zip)}
              </p>

              <p style="margin:24px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#374151;">Your order is being prepared. You can review updates from your account page.</p>
              <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#6b7280;">Questions? Reply to this email or contact admin@zxgwellness.com.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOrderEmailText(order: OrderEmail) {
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortId = order.id.slice(0, 8).toUpperCase();
  const { discountedSubtotal, penDiscount, merchandiseSubtotal, orderTotal, shipping } =
    getOrderEmailTotals(order);
  const shippingState = order.shipping_state ? `, ${order.shipping_state}` : "";
  const itemLines = order.items
    .map(
      (item) =>
        `- ${item.product_name} | Qty ${item.quantity} | ${formatMoney(Number(item.unit_price))} each | ${formatMoney(Number(item.unit_price) * Number(item.quantity))}`,
    )
    .join("\n");

  return `GXZ Health and Wellness Order Confirmed

Order: #${shortId}
Date: ${orderDate}
Payment status: Paid

Items ordered:
${itemLines}

Merchandise subtotal: ${formatMoney(merchandiseSubtotal)}
${penDiscount > 0 ? `Reusable pen discount: -${formatMoney(penDiscount)}\nSubtotal after discount: ${formatMoney(discountedSubtotal)}\n` : ""}Shipping: ${shipping === 0 ? "Free" : formatMoney(shipping)}
Order total: ${formatMoney(orderTotal)}

Shipping to:
${order.shipping_name}
${order.shipping_address}
${order.shipping_city}${shippingState} ${order.shipping_zip}

Your order is being prepared. Questions? Reply to this email or contact admin@zxgwellness.com.`;
}

function buildLegacyOrderEmailHtml(order: OrderEmail) {
  const money = (amount: number) => Math.round(amount * 100) / 100;
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortId = order.id.slice(0, 8).toUpperCase();
  const orderTotal = money(Number(order.total));
  const discountedSubtotal = money(
    order.items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0),
  );
  const penQuantity = order.items
    .filter((item) => item.product_slug === "pen")
    .reduce((quantity, item) => quantity + Number(item.quantity), 0);
  const penDiscount = money(
    penQuantity >= PEN_DISCOUNT_MIN_QTY
      ? order.items
          .filter((item) => item.product_slug === "pen")
          .reduce(
            (sum, item) =>
              sum +
              Number(item.unit_price) *
                Number(item.quantity) *
                (PEN_DISCOUNT_RATE / (1 - PEN_DISCOUNT_RATE)),
            0,
          )
      : 0,
  );
  const merchandiseSubtotal = money(discountedSubtotal + penDiscount);
  const shipping = money(Math.max(0, orderTotal - discountedSubtotal));
  const freeShippingApplies = shipping === 0 && merchandiseSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingState = order.shipping_state ? `, ${escapeHtml(order.shipping_state)}` : "";

  const summaryRow = (label: string, value: string, color = "#f5f0e8") => `
    <tr>
      <td bgcolor="#111111" style="padding:4px 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#b8b0a4;text-align:right;">${label}</td>
      <td bgcolor="#111111" width="120" style="padding:4px 0 4px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${color};text-align:right;white-space:nowrap;">${value}</td>
    </tr>`;

  const itemRows = order.items
    .map((item) => {
      const itemTotal = Number(item.unit_price) * Number(item.quantity);
      return `
        <tr>
          <td bgcolor="#111111" width="52%" style="padding:14px 10px 14px 0;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#f5f0e8;">${escapeHtml(item.product_name)}</td>
          <td bgcolor="#111111" width="12%" style="padding:14px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#f5f0e8;text-align:center;">${Number(item.quantity)}</td>
          <td bgcolor="#111111" width="18%" style="padding:14px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#f5f0e8;text-align:right;white-space:nowrap;">$${Number(item.unit_price).toFixed(2)}</td>
          <td bgcolor="#111111" width="18%" style="padding:14px 0 14px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#c9a84c;text-align:right;white-space:nowrap;">$${itemTotal.toFixed(2)}</td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Order Confirmed — GXZ Health and Wellness</title>
</head>
<body bgcolor="#0a0a0a" style="margin:0;padding:0;background-color:#0a0a0a;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <center style="width:100%;background-color:#0a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#0a0a0a;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <!--[if mso]><table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#111111" style="width:100%;max-width:640px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#111111;border:1px solid #2a2a2a;">
            <tr>
              <td align="center" bgcolor="#0d0d0d" style="padding:38px 32px 34px 32px;background-color:#0d0d0d;border-bottom:2px solid #c9a84c;">
                <p style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;">GXZ HEALTH AND WELLNESS</p>
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:38px;font-weight:400;color:#f5f0e8;">Order Confirmed</h1>
                <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#b8b0a4;">Payment status: <strong style="color:#7ee787;font-weight:700;">Paid</strong></p>
              </td>
            </tr>
            <tr>
              <td bgcolor="#c9a84c" style="height:3px;font-size:0;line-height:0;background-color:#c9a84c;">&nbsp;</td>
            </tr>
            <tr>
              <td bgcolor="#111111" style="padding:30px 32px 24px 32px;background-color:#111111;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                  <tr>
                    <td width="50%" valign="top" bgcolor="#111111" style="padding:0 12px 0 0;">
                      <p style="margin:0 0 5px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:2px;text-transform:uppercase;color:#8c8378;">Order Number</p>
                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#c9a84c;font-weight:700;">#${shortId}</p>
                    </td>
                    <td width="50%" valign="top" align="right" bgcolor="#111111" style="padding:0 0 0 12px;text-align:right;">
                      <p style="margin:0 0 5px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:2px;text-transform:uppercase;color:#8c8378;">Order Date</p>
                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#f5f0e8;">${orderDate}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="#111111" style="padding:0 32px;background-color:#111111;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                  <tr><td style="height:1px;font-size:0;line-height:0;background-color:#2a2a2a;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="#111111" style="padding:30px 32px;background-color:#111111;">
                <p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;font-weight:700;">Invoice</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#111111" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#111111;">
                  <tr>
                    <td bgcolor="#111111" width="52%" style="padding:0 10px 10px 0;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:1px;text-transform:uppercase;color:#8c8378;">Item</td>
                    <td bgcolor="#111111" width="12%" style="padding:0 6px 10px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:1px;text-transform:uppercase;color:#8c8378;text-align:center;">Qty</td>
                    <td bgcolor="#111111" width="18%" style="padding:0 6px 10px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:1px;text-transform:uppercase;color:#8c8378;text-align:right;">Unit</td>
                    <td bgcolor="#111111" width="18%" style="padding:0 0 10px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:1px;text-transform:uppercase;color:#8c8378;text-align:right;">Total</td>
                  </tr>
                  ${itemRows}
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#111111" style="margin-top:22px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#111111;">
                  ${summaryRow("Merchandise Subtotal", `$${merchandiseSubtotal.toFixed(2)}`)}
                  ${penDiscount > 0 ? summaryRow("Reusable Pen Discount", `-$${penDiscount.toFixed(2)}`, "#7ee787") : ""}
                  ${penDiscount > 0 ? summaryRow("Subtotal After Discount", `$${discountedSubtotal.toFixed(2)}`) : ""}
                  ${summaryRow(`Shipping${freeShippingApplies ? " ($50+ Free Shipping)" : ""}`, shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`)}
                  <tr>
                    <td bgcolor="#111111" style="padding:14px 0 0 0;border-top:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:#b8b0a4;text-align:right;">Total</td>
                    <td bgcolor="#111111" width="120" style="padding:14px 0 0 18px;border-top:1px solid #2a2a2a;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:28px;color:#c9a84c;text-align:right;white-space:nowrap;">$${orderTotal.toFixed(2)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="#111111" style="padding:0 32px;background-color:#111111;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                  <tr><td style="height:1px;font-size:0;line-height:0;background-color:#2a2a2a;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="#111111" style="padding:28px 32px;background-color:#111111;">
                <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;font-weight:700;">Shipping To</p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;color:#f5f0e8;">
                  ${escapeHtml(order.shipping_name)}<br />
                  ${escapeHtml(order.shipping_address)}<br />
                  ${escapeHtml(order.shipping_city)}${shippingState} ${escapeHtml(order.shipping_zip)}
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" bgcolor="#0d0d0d" style="padding:26px 32px;background-color:#0d0d0d;border-top:1px solid #2a2a2a;">
                <p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#b8b0a4;">Your order is being prepared with care. You can review updates from your account.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                  <tr>
                    <td align="center" bgcolor="#c9a84c" style="background-color:#c9a84c;">
                      <a href="https://www.gxzhealthandwellness.com/account" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:14px;letter-spacing:2px;text-transform:uppercase;color:#0a0a0a;text-decoration:none;font-weight:700;">View My Orders</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#746b61;">Questions? Reply to this email or contact <a href="mailto:admin@zxgwellness.com" style="color:#c9a84c;text-decoration:none;">admin@zxgwellness.com</a>.</p>
              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

async function sendOrderConfirmationEmail(order: OrderEmail): Promise<OrderEmailResult> {
  const resend = getResend();
  const shortId = order.id.slice(0, 8).toUpperCase();
  const html = buildOrderEmailHtml(order);
  const text = buildOrderEmailText(order);
  const adminEmails = getAdminEmails(order.email);
  const result: OrderEmailResult = {
    customerSent: false,
    adminSent: adminEmails.length === 0,
    errors: [],
  };

  const customerError = await sendEmail(
    resend,
    {
      from: brandFromEmail,
      to: order.email,
      replyTo: brandReplyToEmail,
      subject: `Order Confirmed & Paid — #${shortId} | GXZ Health and Wellness`,
      html,
      text,
    },
    "customer confirmation",
  );

  if (customerError) {
    result.errors.push(customerError);
  } else {
    result.customerSent = true;
  }

  if (adminEmails.length > 0) {
    const adminError = await sendEmail(
      resend,
      {
        from: brandFromEmail,
        to: adminEmails,
        replyTo: order.email,
        subject: `Paid Order Received — #${shortId} | GXZ Health and Wellness`,
        html,
        text,
      },
      `admin notification (${adminEmails.join(", ")})`,
    );

    if (adminError) {
      result.errors.push(adminError);
    } else {
      result.adminSent = true;
    }
  }

  if (result.errors.length > 0) {
    console.error("Resend order email error:", result.errors.join("; "));
  }

  return result;
}

function hashCart(
  items: Array<{
    product_slug: string;
    product_name: string;
    unit_price: number;
    quantity: number;
  }>,
) {
  const canonicalItems = [...items].sort((a, b) =>
    `${a.product_slug}:${a.product_name}`.localeCompare(`${b.product_slug}:${b.product_name}`),
  );
  return createHash("sha256").update(JSON.stringify(canonicalItems)).digest("hex");
}

const legacyInitials = ["Z", "X", "G"].join("");
const rebrandProductName = (name: string) =>
  name
    .replaceAll(`${legacyInitials} Wellness`, "GXZ Health and Wellness")
    .replace(new RegExp(`\\b${legacyInitials}\\b`, "g"), "GXZ");

async function calculateTrustedCart(supabase: SupabaseClient, rawItems: CheckoutItemInput[]) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw Object.assign(new Error("Cart is empty"), { statusCode: 400 });
  }

  const normalized = rawItems.map((item) => ({
    slug: String(item.slug ?? "").trim(),
    quantity: Number(item.quantity),
    optionLabel: normalizeOption(item),
  }));

  if (
    normalized.some(
      (item) =>
        !item.slug || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99,
    )
  ) {
    throw Object.assign(new Error("Invalid cart item"), { statusCode: 400 });
  }

  const slugs = [...new Set(normalized.map((item) => item.slug))];
  const { data } = await supabase
    .from("products")
    .select("slug, name, price, active")
    .in("slug", slugs);

  const dbProducts = new Map(
    (data ?? []).map((product: ProductPriceRow) => [
      product.slug,
      {
        slug: product.slug,
        name: rebrandProductName(product.name),
        price: Number(product.price),
        active: Boolean(product.active),
      } satisfies TrustedProduct,
    ]),
  );
  const localProductMap = new Map(localProducts.map((product) => [product.slug, product]));

  const pricedItems = normalized.map((item) => {
    const dbProduct = dbProducts.get(item.slug);
    const localProduct = localProductMap.get(item.slug);
    const product = dbProduct ?? localProduct;

    if (!product || !product.active) {
      throw Object.assign(new Error(`Product is not available: ${item.slug}`), { statusCode: 400 });
    }

    const optionPrice =
      item.optionLabel && localProduct?.optionPrices
        ? localProduct.optionPrices[item.optionLabel]
        : undefined;
    const unitPrice = optionPrice ?? product.price;
    const productName = item.optionLabel ? `${product.name} - ${item.optionLabel}` : product.name;

    return {
      product_slug: product.slug,
      product_name: productName,
      unit_price: unitPrice,
      quantity: item.quantity,
    };
  });

  const merchandiseSubtotal = money(
    pricedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
  );
  const penQuantity = pricedItems
    .filter((item) => item.product_slug === "pen")
    .reduce((quantity, item) => quantity + item.quantity, 0);
  const penDiscountApplies = penQuantity >= PEN_DISCOUNT_MIN_QTY;
  const trustedItems = pricedItems.map((item) =>
    penDiscountApplies && item.product_slug === "pen"
      ? { ...item, unit_price: money(item.unit_price * (1 - PEN_DISCOUNT_RATE)) }
      : item,
  );
  const subtotal = money(
    trustedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
  );
  const discount = money(merchandiseSubtotal - subtotal);
  const shipping = merchandiseSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = money(subtotal + shipping);

  return {
    items: trustedItems,
    merchandiseSubtotal,
    subtotal,
    discount,
    shipping,
    total,
    amountCents: cents(total),
    cartHash: hashCart(trustedItems),
  };
}

function getStripeSecretKey() {
  loadLocalEnv();
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return secretKey;
}

async function retrieveCheckoutSession(checkoutSessionId: string) {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(checkoutSessionId)}`,
    {
      headers: {
        Authorization: `Bearer ${getStripeSecretKey()}`,
      },
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Stripe Checkout Session lookup failed");
  }

  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setApiHeaders(req, res);

  if (req.method === "OPTIONS") {
    if (rejectDisallowedOrigin(req, res)) return;
    return res.status(204).end();
  }
  if (rejectDisallowedOrigin(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    enforceRateLimit(req, "orders", { limit: 20, windowMs: 60_000 });
    const { supabase, user } = await requireUser(req);
    const { checkoutSessionId, shipping, items } = req.body || {};
    if (!checkoutSessionId) {
      return res.status(400).json({ error: "checkoutSessionId is required" });
    }
    if (
      !shipping?.email ||
      !shipping?.name ||
      !shipping?.address ||
      !shipping?.city ||
      !shipping?.state ||
      !shipping?.zip
    ) {
      return res.status(400).json({ error: "Shipping details are required" });
    }

    const trustedCart = await calculateTrustedCart(supabase, items);
    const checkoutSession = await retrieveCheckoutSession(String(checkoutSessionId));

    if (checkoutSession.status !== "complete" || checkoutSession.payment_status !== "paid") {
      return res.status(400).json({ error: "Checkout payment has not completed" });
    }
    if (checkoutSession.metadata?.userId !== user.id) {
      return res.status(403).json({ error: "Checkout Session does not belong to this user" });
    }
    if (checkoutSession.amount_total !== trustedCart.amountCents) {
      return res.status(400).json({ error: "Checkout amount does not match cart total" });
    }
    if (checkoutSession.metadata?.cartHash !== trustedCart.cartHash) {
      return res.status(400).json({ error: "Checkout cart does not match submitted order" });
    }

    const shippingState = String(shipping.state ?? "").trim();
    const shippingCity = String(shipping.city ?? "").trim();
    const shippingCityLine = shippingState ? `${shippingCity}, ${shippingState}` : shippingCity;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "paid",
        total: trustedCart.total,
        email: String(shipping.email),
        shipping_name: String(shipping.name),
        shipping_address: String(shipping.address),
        shipping_city: shippingCityLine,
        shipping_zip: String(shipping.zip),
      })
      .select("*")
      .single();

    if (orderError || !order) throw orderError ?? new Error("Order creation failed");

    const { error: itemsError } = await supabase.from("order_items").insert(
      trustedCart.items.map((item) => ({
        order_id: order.id,
        ...item,
      })),
    );
    if (itemsError) throw itemsError;

    let emailSent = false;
    let emailError: string | undefined;
    try {
      const emailResult = await sendOrderConfirmationEmail({
        ...order,
        items: trustedCart.items,
      });
      emailSent = emailResult.customerSent;
      if (!emailResult.customerSent) {
        emailError = emailResult.errors.join("; ");
      } else if (!emailResult.adminSent && emailResult.errors.length > 0) {
        console.warn("[api/orders] admin order email failed", emailResult.errors.join("; "));
      }
    } catch (error) {
      emailError = error instanceof Error ? error.message : "Confirmation email failed";
      console.error("[api/orders] confirmation email failed", error);
    }

    return res.status(200).json({ success: true, orderId: order.id, emailSent, emailError });
  } catch (error) {
    console.error("[api/orders]", error);
    return sendApiError(res, error);
  }
}
