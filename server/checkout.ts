import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export const SHIPPING_FEE = 10;
export const FREE_SHIPPING_THRESHOLD = 50;
export const PEN_DISCOUNT_MIN_QTY = 5;
export const PEN_DISCOUNT_RATE = 0.1;

type CheckoutItemInput = {
  slug: string;
  quantity: number;
  optionLabel?: string;
  name?: string;
};

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

export async function calculateTrustedCart(
  supabase: SupabaseClient,
  rawItems: CheckoutItemInput[],
) {
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
  const { data, error } = await supabase.from("products").select("*").in("slug", slugs);
  if (error)
    throw Object.assign(new Error("Unable to check product availability. Please try again."), {
      statusCode: 503,
    });
  const dbProducts = new Map((data ?? []).map((product) => [product.slug, product]));
  const quantities = new Map<string, number>();
  normalized.forEach((item) =>
    quantities.set(item.slug, (quantities.get(item.slug) ?? 0) + item.quantity),
  );
  const pricedItems = normalized.map((item) => {
    const product = dbProducts.get(item.slug);
    if (!product || !product.active)
      throw Object.assign(new Error(`Product is not available: ${item.slug}`), { statusCode: 400 });
    if (product.track_stock && Number(product.stock_qty) < (quantities.get(item.slug) ?? 0)) {
      throw Object.assign(new Error(`Not enough stock for ${product.name}`), { statusCode: 400 });
    }
    const choices = catalogOptions(product.options, Number(product.price));
    const choice = choices.find((value) => value.label === item.optionLabel);
    if (choices.length && (!choice || !choice.inStock)) {
      throw Object.assign(
        new Error(
          `Selected option is unavailable for ${product.name}. Please choose an in-stock option.`,
        ),
        { statusCode: 400 },
      );
    }
    if (!choices.length && item.optionLabel) {
      throw Object.assign(
        new Error(
          `Product options have changed for ${product.name}. Please add the product again.`,
        ),
        { statusCode: 400 },
      );
    }
    const unitPrice = choice?.price ?? Number(product.price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("Invalid product price");
    return {
      product_slug: product.slug,
      product_name: choice ? `${product.name} - ${choice.label}` : product.name,
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
import { catalogOptions } from "../src/lib/catalog-options.js";
