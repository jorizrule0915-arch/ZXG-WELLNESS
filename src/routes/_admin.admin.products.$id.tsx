import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm, type ProductInput } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_admin/admin/products/$id")({
  head: () => ({ meta: [{ title: "Edit Product — ZXG Admin" }] }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const [initial, setInitial] = useState<ProductInput | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (!data) {
        setMissing(true);
        return;
      }
      setInitial({
        id: data.id,
        slug: data.slug,
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        price: Number(data.price),
        category: data.category,
        image: data.image,
        ingredients: data.ingredients ?? [],
        benefits: data.benefits ?? [],
        featured: data.featured,
        active: data.active,
      });
    })();
  }, [id]);

  return (
    <div className="px-6 lg:px-10 py-10">
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-luxury text-muted-foreground hover:text-gold mb-6"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to catalog
      </Link>
      <h1 className="font-display text-4xl md:text-5xl mb-2">
        Edit <span className="text-gradient-gold italic">{initial?.name ?? "…"}</span>
      </h1>
      <p className="text-sm text-muted-foreground mb-10">Refine the details of this creation.</p>
      {missing ? (
        <div className="text-sm text-muted-foreground">Product not found.</div>
      ) : !initial ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <ProductForm initial={initial} />
      )}
    </div>
  );
}
