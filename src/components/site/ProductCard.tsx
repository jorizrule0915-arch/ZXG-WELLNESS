import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Product } from "@/lib/products";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/products/$slug" params={{ slug: product.slug }} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-2 border border-gold/10 group-hover:border-gold/40 transition-colors duration-500">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 via-transparent to-transparent" />
          <div className="absolute top-4 left-4 text-[9px] uppercase tracking-luxury text-gold/90 border border-gold/40 px-2 py-1 bg-obsidian/40 backdrop-blur-sm">
            {product.category}
          </div>
        </div>
        <div className="pt-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl leading-tight group-hover:text-gold transition-colors">
              {product.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{product.tagline}</p>
          </div>
          <div className="font-display text-xl text-gold whitespace-nowrap">${product.price}</div>
        </div>
      </Link>
    </motion.div>
  );
}
