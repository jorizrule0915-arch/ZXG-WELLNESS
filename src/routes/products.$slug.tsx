import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchProduct, fetchProducts, type Product, type ProductVariant } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/site/ProductCard";
import { galleryFor } from "@/lib/productImages";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/products/$slug")({ component: ProductDetail });

function ProductDetail() {
  const { slug } = useParams({ from: "/products/$slug" });
  const nav = useNavigate();
  const add = useCart((s) => s.add);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProduct(slug).then((p) => {
      if (!p) { nav({ to: "/products" }); return; }
      setProduct(p);
      setSelectedVariant(p.variants?.[0] ?? null);
      setLoading(false);
    });
  }, [slug, nav]);

  useEffect(() => {
    if (!product) return;
    fetchProducts()
      .then((all) => setRelated(all.filter((p) => p.slug !== product.slug).slice(0, 3)))
      .catch(console.error);
  }, [product]);

  if (loading || !product) {
    return <div className="py-32 text-center text-muted-foreground">Loading…</div>;
  }

  const gallery = galleryFor(product.slug);
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;

  return (
    <>
      <Helmet>
        <title>{product.name} — ZXG Wellness</title>
        <meta name="description" content={product.description} />
      </Helmet>

      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 md:py-24">
        <Link to="/products" className="text-[11px] uppercase tracking-luxury text-muted-foreground hover:text-gold">
          ← All Products
        </Link>

        <div className="mt-10 grid lg:grid-cols-2 gap-16">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-4">
            <div className="relative aspect-[4/5] bg-surface-2 border border-gold/15 overflow-hidden">
              <img src={gallery[activeImg]} alt={product.name} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian/30 to-transparent" />
              {gallery.length > 1 && (
                <>
                  <button onClick={() => setActiveImg((i) => (i - 1 + gallery.length) % gallery.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-obsidian/60 border border-gold/30 text-gold hover:bg-obsidian transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setActiveImg((i) => (i + 1) % gallery.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-obsidian/60 border border-gold/30 text-gold hover:bg-obsidian transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-3">
                {gallery.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`relative h-20 w-20 border overflow-hidden transition-colors ${activeImg === i ? "border-gold" : "border-gold/20 hover:border-gold/50"}`}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="flex flex-col">
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-4">{product.category}</div>
            <h1 className="font-display text-4xl md:text-5xl leading-[1.05]">{product.name}</h1>
            <p className="mt-3 text-lg text-foreground/70 italic font-display">{product.tagline}</p>
            <div className="mt-6 font-display text-4xl text-gold">${displayPrice.toFixed(2)}</div>
            <div className="mt-8 hairline" />
            <p className="mt-8 text-base leading-relaxed text-foreground/80">{product.description}</p>

            {product.variants && product.variants.length > 0 && (
              <div className="mt-8">
                <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">Choose Option</div>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => (
                    <button key={v.label} onClick={() => setSelectedVariant(v)} className={`px-4 py-3 text-[11px] uppercase tracking-luxury border transition-colors ${selectedVariant?.label === v.label ? "bg-gold text-obsidian border-gold" : "border-gold/30 text-foreground/70 hover:border-gold hover:text-gold"}`}>
                      {v.label}
                      <span className="block text-[10px] mt-0.5 opacity-80">${v.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">Product Highlights</div>
              <ul className="space-y-2">
                {product.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-foreground/80">
                    <span className="text-gold">✓</span> {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">Tags</div>
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map((b) => (
                  <span key={b} className="text-[10px] uppercase tracking-luxury border border-gold/30 px-3 py-1 text-foreground/70">{b}</span>
                ))}
              </div>
            </div>

            <div className="mt-10 hairline" />
            <div className="mt-8">
              <button
                onClick={() => add({ ...product, price: displayPrice, name: selectedVariant ? `${product.name} — ${selectedVariant.label}` : product.name })}
                className="w-full py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-all glow-gold-sm"
              >
                Add to Cart →
              </button>
            </div>
          </motion.div>
        </div>

        {related.length > 0 && (
          <div className="mt-32 border-t border-gold/10 pt-16">
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-8">You may also like</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
