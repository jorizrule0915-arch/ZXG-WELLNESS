import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "crypto";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

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

const localProducts: Array<TrustedProduct & { optionPrices?: Record<string, number> }> = [
  {
    slug: "pen",
    name: "ZXG Wellness Reusable Injection Pen",
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
    name: "ZXG Wellness Syringe",
    price: 15,
    active: true,
    optionPrices: {
      "Small (1ml 30g)": 15,
      "Mini (0.5ml 30g)": 15,
      "Large (3ml 23g)": 15,
    },
  },
  { slug: "cartridge", name: "ZXG Wellness Disposable 3mL Cartridges", price: 10, active: true },
  {
    slug: "needles",
    name: "ZXG Wellness Single-Use Pen Needles",
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
    name: "ZXG Wellness Creatine Performance Matrix Powder",
    price: 29.99,
    active: true,
  },
  {
    slug: "body-balm",
    name: "ZXG Wellness Nourishing Body Balm",
    price: 16.99,
    active: true,
    optionPrices: {
      "Aloe Scent": 16.99,
      Unscented: 16.99,
      "Pack (Both)": 23.99,
    },
  },
];

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
    (data ?? []).map((product: any) => [
      product.slug,
      {
        slug: product.slug,
        name: product.name,
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
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return secretKey;
}

async function createPaymentIntent(
  amountCents: number,
  email: string,
  metadata: Record<string, string>,
) {
  const body = new URLSearchParams();
  body.set("amount", String(amountCents));
  body.set("currency", "usd");
  body.set("receipt_email", email);
  body.append("payment_method_types[]", "card");
  Object.entries(metadata).forEach(([key, value]) => {
    body.set(`metadata[${key}]`, value);
  });

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Stripe payment intent creation failed");
  }

  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setJsonHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    enforceRateLimit(req, "payment", { limit: 20, windowMs: 60_000 });
    const { supabase, user } = await requireUser(req);
    const { email, items } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email is required" });

    const trustedCart = await calculateTrustedCart(supabase, items);
    const paymentIntent = await createPaymentIntent(trustedCart.amountCents, email, {
      userId: user.id,
      customerEmail: String(email),
      cartTotal: trustedCart.total.toFixed(2),
      discount: trustedCart.discount.toFixed(2),
      shipping: trustedCart.shipping.toFixed(2),
      cartHash: trustedCart.cartHash,
    });
    if (!paymentIntent.client_secret)
      return res.status(500).json({ error: "Failed to get payment secret" });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: trustedCart.total,
    });
  } catch (error) {
    console.error("[api/payment]", error);
    return sendApiError(res, error);
  }
}
