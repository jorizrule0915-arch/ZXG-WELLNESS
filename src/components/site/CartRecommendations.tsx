import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/cart";
import { isProductInStock } from "@/lib/catalog-options";
import { fetchProducts, type Product } from "@/lib/products";

const PEN_SETUP = ["pen", "cartridge", "needles"];
const WELLNESS_PAIRINGS: Record<string, string[]> = {
  creatine: ["hydration", "body-balm"],
  hydration: ["creatine", "body-balm"],
  "body-balm": ["hydration", "creatine"],
};

function recommendationSlugs(items: CartItem[]) {
  const selected = new Set(items.map((item) => item.slug));
  const slugs: string[] = [];

  if (PEN_SETUP.some((slug) => selected.has(slug))) {
    slugs.push(...PEN_SETUP.filter((slug) => !selected.has(slug)));
  }

  for (const item of items) {
    for (const slug of WELLNESS_PAIRINGS[item.slug] ?? []) {
      if (!selected.has(slug) && !slugs.includes(slug)) slugs.push(slug);
    }
  }

  return slugs.slice(0, 3);
}

function displayPrice(product: Product) {
  const prices = [
    product.price,
    ...(product.variants ?? []).map((variant) => variant.price),
    ...(product.colorVariants ?? []).map((variant) => variant.price),
  ].filter((price) => Number.isFinite(price));
  const minimum = Math.min(...prices);
  return `${new Set(prices).size > 1 ? "From " : ""}$${minimum.toFixed(2)}`;
}

export function CartRecommendations({
  items,
  compact = false,
  onNavigate,
}: {
  items: CartItem[];
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const slugs = useMemo(() => recommendationSlugs(items), [items]);

  useEffect(() => {
    if (slugs.length === 0) {
      setProducts([]);
      return;
    }

    let cancelled = false;
    fetchProducts()
      .then((catalog) => {
        if (cancelled) return;
        setProducts(
          slugs
            .map((slug) => catalog.find((product) => product.slug === slug))
            .filter((product): product is Product => Boolean(product && isProductInStock(product))),
        );
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [slugs]);

  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby={compact ? "cart-drawer-recommendations" : "cart-recommendations"}
      className={compact ? "mt-7 border-t border-gold/15 pt-6" : "mt-10 border border-gold/15 p-6"}
    >
      <div className="text-[10px] uppercase tracking-luxury text-gold">Complete your setup</div>
      <h2
        id={compact ? "cart-drawer-recommendations" : "cart-recommendations"}
        className={`${compact ? "mt-2 text-xl" : "mt-3 text-2xl"} font-display`}
      >
        Helpful additions for this order
      </h2>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Review compatible accessories and related wellness products before checkout. Options are
        selected on each product page.
      </p>
      <div className={`${compact ? "mt-4 space-y-3" : "mt-5 grid gap-4 sm:grid-cols-2"}`}>
        {products.map((product) => (
          <Link
            key={product.slug}
            to="/products/$slug"
            params={{ slug: product.slug }}
            onClick={onNavigate}
            className="flex items-center gap-3 border border-gold/15 bg-obsidian/50 p-3 transition-colors hover:border-gold/50"
          >
            <img
              src={product.image}
              alt=""
              className="h-16 w-14 shrink-0 bg-surface-2 object-contain p-1"
              loading="lazy"
            />
            <span className="min-w-0">
              <span className="block text-sm leading-5 text-foreground">{product.name}</span>
              <span className="mt-1 block text-xs text-gold">{displayPrice(product)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
