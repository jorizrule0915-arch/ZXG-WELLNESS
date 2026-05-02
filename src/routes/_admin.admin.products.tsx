import { createFileRoute, Link } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/products")({ component: AdminProducts });

type Row = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
  featured: boolean;
};

function AdminProducts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, category, price, active, featured")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("products").update({ active: !current }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Product ${!current ? "published" : "hidden"}`);
    load();
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product removed");
    load();
  };

  return (
    <>
      <Helmet><title>Products — ZXG Admin</title></Helmet>
      <div className="px-6 lg:px-10 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">Catalog</div>
            <h1 className="font-display text-4xl md:text-5xl">The Collection</h1>
          </div>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 bg-gold text-obsidian px-6 py-3 text-[11px] uppercase tracking-luxury hover:bg-gold-light transition-colors"
          >
            <Plus className="h-4 w-4" /> New Product
          </Link>
        </div>
      </motion.div>

      <div className="mt-10 border border-gold/15 bg-charcoal overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No products yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gold/15">
                <tr className="text-left text-[10px] uppercase tracking-luxury text-muted-foreground">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-display text-lg">{r.name}</div>
                      <div className="text-xs text-muted-foreground">/{r.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-xs uppercase tracking-luxury text-muted-foreground">
                      {r.category}
                    </td>
                    <td className="px-6 py-4 font-display text-lg text-gold">
                      ${Number(r.price).toFixed(0)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-[10px] uppercase tracking-luxury w-fit px-2 py-0.5 border ${r.active ? "text-gold border-gold/40" : "text-muted-foreground border-muted-foreground/30"}`}
                        >
                          {r.active ? "Active" : "Hidden"}
                        </span>
                        {r.featured && (
                          <span className="text-[10px] uppercase tracking-luxury w-fit px-2 py-0.5 border border-gold/40 text-gold">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActive(r.id, r.active)}
                          className="p-2 hover:bg-surface text-muted-foreground hover:text-gold transition-colors"
                          aria-label={r.active ? "Hide" : "Publish"}
                        >
                          {r.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <Link
                          to="/admin/products/$id"
                          params={{ id: r.id }}
                          className="p-2 hover:bg-surface text-muted-foreground hover:text-gold transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => remove(r.id, r.name)}
                          className="p-2 hover:bg-surface text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
