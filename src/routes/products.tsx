import { createFileRoute, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { fetchProducts, type Product } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { JsonLd, Seo } from "@/lib/seo";
import { absoluteUrl, breadcrumbSchema } from "@/lib/seoData";

const categories = ["All", "Supplements", "Skincare", "Accessories"] as const;

export const Route = createFileRoute("/products")({ component: ProductsPage });

function ProductsPage() {
  const matchRoute = useMatchRoute();
  const isSlug = matchRoute({ to: "/products/$slug", fuzzy: true });
  const [filter, setFilter] = useState<(typeof categories)[number]>("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === "All" ? products : products.filter((p) => p.category === filter)),
    [filter, products],
  );

  if (isSlug) return <Outlet />;

  return (
    <>
      <Seo
        title="Wellness Products, Creatine, Recovery Care & Accessories"
        description="Explore the ZXG Wellness collection of creatine, recovery skincare, reusable pens, cartridges, needles, and accessories."
        path="/products"
      />
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "ZXG Wellness Product Collection",
            itemListElement: products.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/products/${product.slug}`),
              name: product.name,
            })),
          },
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 md:py-28">
        <div className="text-center mb-16">
          <div className="text-[10px] uppercase tracking-luxury text-gold mb-4">
            <span className="gold-line">The Collection</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl">
            Considered <span className="text-gradient-gold italic">essentials</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-muted-foreground">
            Two products. Both intentional. Creatine for performance, Body Balm for recovery.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-14">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-5 py-2 text-[10px] uppercase tracking-luxury border transition-all ${
                filter === c
                  ? "border-gold bg-gold text-obsidian"
                  : "border-gold/30 text-foreground/70 hover:border-gold hover:text-gold"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading the collection…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            No products found for this collection.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {filtered.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
