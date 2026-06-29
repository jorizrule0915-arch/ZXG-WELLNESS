import { imageRefFor, penColorImages } from "./productImages";

type OrderImageItem = {
  product_name?: string | null;
  product_slug?: string | null;
  product_image?: string | null;
};

export function imageForOrderItem(item: OrderImageItem) {
  const penColor = item.product_slug === "pen" ? getPenColorFromName(item.product_name) : null;
  if (penColor) return penColorImages[penColor];

  if (item.product_image) {
    return imageRefFor(item.product_image, item.product_slug ?? undefined);
  }

  if (item.product_slug) {
    return imageRefFor(item.product_slug, item.product_slug);
  }

  return null;
}

function getPenColorFromName(productName?: string | null) {
  const tokens = String(productName ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  return Object.keys(penColorImages).find((color) => tokens.includes(color)) ?? null;
}
