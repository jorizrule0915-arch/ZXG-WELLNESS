import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProductInput = {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  category: string;
  image: string;
  ingredients: string[];
  benefits: string[];
  featured: boolean;
  active: boolean;
};

const empty: ProductInput = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  price: 0,
  category: "elixir",
  image: "",
  ingredients: [],
  benefits: [],
  featured: false,
  active: true,
};

const inputCls =
  "w-full bg-obsidian border border-gold/20 px-4 py-3 text-sm font-body focus:border-gold focus:outline-none transition-colors";
const labelCls = "block text-[10px] uppercase tracking-luxury text-gold mb-2";

export function ProductForm({ initial }: { initial?: ProductInput }) {
  const nav = useNavigate();
  const [form, setForm] = useState<ProductInput>(initial ?? empty);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      image: form.image.trim() || form.slug.trim(),
      ingredients: form.ingredients,
      benefits: form.benefits,
      featured: form.featured,
      active: form.active,
    };

    if (form.id) {
      const { error } = await supabase.from("products").update(payload).eq("id", form.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Product created");
    }
    nav({ to: "/admin/products" });
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>Name</label>
          <input
            className={inputCls}
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Slug</label>
          <input
            className={inputCls}
            required
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="adaptogenic-elixir"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Tagline</label>
        <input
          className={inputCls}
          required
          value={form.tagline}
          onChange={(e) => set("tagline", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          rows={5}
          className={inputCls}
          required
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <div>
          <label className={labelCls}>Price (USD)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            className={inputCls}
            value={form.price}
            onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <input
            className={inputCls}
            required
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Image key</label>
          <input
            className={inputCls}
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
            placeholder="defaults to slug"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>Ingredients (comma separated)</label>
          <input
            className={inputCls}
            value={form.ingredients.join(", ")}
            onChange={(e) =>
              set(
                "ingredients",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
        <div>
          <label className={labelCls}>Benefits (comma separated)</label>
          <input
            className={inputCls}
            value={form.benefits.join(", ")}
            onChange={(e) =>
              set(
                "benefits",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
            className="accent-gold w-4 h-4"
          />
          <span className="text-[11px] uppercase tracking-luxury">
            Active (visible on storefront)
          </span>
        </label>
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="accent-gold w-4 h-4"
          />
          <span className="text-[11px] uppercase tracking-luxury">Featured on home</span>
        </label>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gold/15">
        <button
          type="submit"
          disabled={saving}
          className="bg-gold text-obsidian px-8 py-3 text-[11px] uppercase tracking-luxury hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : form.id ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => nav({ to: "/admin/products" })}
          className="border border-gold/40 text-gold px-8 py-3 text-[11px] uppercase tracking-luxury hover:bg-gold hover:text-obsidian transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
