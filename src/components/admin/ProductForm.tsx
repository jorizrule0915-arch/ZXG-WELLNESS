import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Star, Video, X } from "lucide-react";
import { authFetch, readApiJson } from "@/lib/api";
import { imageRefFor, imageRefsFrom } from "@/lib/productImages";
import { supabase } from "@/integrations/supabase/client";

export type ProductOption = {
  name: string;   // e.g. "Size"
  values: string[]; // e.g. ["50ml", "100ml"]
};

export type ProductInput = {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  category: string;
  image: string;
  galleryImages: string[];
  featuredVideo: string;
  ingredients: string[];
  benefits: string[];
  featured: boolean;
  active: boolean;
  track_stock: boolean;
  stock_qty: number;
  options: ProductOption[];
};

const empty: ProductInput = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  price: 0,
  category: "elixir",
  image: "",
  galleryImages: [],
  featuredVideo: "",
  ingredients: [],
  benefits: [],
  featured: false,
  active: true,
  track_stock: false,
  stock_qty: 0,
  options: [],
};

const inputCls =
  "w-full bg-obsidian border border-gold/20 px-4 py-3 text-sm font-body focus:border-gold focus:outline-none transition-colors";
const labelCls = "block text-[10px] uppercase tracking-luxury text-gold mb-2";

export function ProductForm({ initial }: { initial?: ProductInput }) {
  const nav = useNavigate();
  const [form, setForm] = useState<ProductInput>(() => {
    const base = initial ?? empty;
    return {
      ...base,
      featuredVideo: base.featuredVideo ?? "",
      galleryImages: base.galleryImages?.length
        ? base.galleryImages
        : imageRefsFrom(base.image),
    };
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [newOptName, setNewOptName] = useState("");

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const gallery = form.galleryImages.length ? form.galleryImages : imageRefsFrom(form.image);

  const updateGalleryImage = (idx: number, value: string) => {
    set(
      "galleryImages",
      gallery.map((item, itemIdx) => (itemIdx === idx ? value : item)),
    );
  };

  const removeGalleryImage = (idx: number) => {
    set(
      "galleryImages",
      gallery.filter((_, itemIdx) => itemIdx !== idx),
    );
  };

  const moveGalleryImage = (idx: number, direction: -1 | 1) => {
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= gallery.length) return;
    const next = [...gallery];
    [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
    set("galleryImages", next);
  };

  // ── Options helpers ──────────────────────────────────────────
  const addOption = () => {
    const name = newOptName.trim();
    if (!name) return;
    if (form.options.find((o) => o.name.toLowerCase() === name.toLowerCase())) return;
    set("options", [...form.options, { name, values: [] }]);
    setNewOptName("");
  };

  const removeOption = (idx: number) => {
    set("options", form.options.filter((_, i) => i !== idx));
  };

  const addOptionValue = (idx: number, raw: string) => {
    const val = raw.trim();
    if (!val) return;
    const opts = form.options.map((o, i) =>
      i === idx ? { ...o, values: [...o.values, val] } : o
    );
    set("options", opts);
  };

  const removeOptionValue = (optIdx: number, valIdx: number) => {
    const opts = form.options.map((o, i) =>
      i === optIdx ? { ...o, values: o.values.filter((_, vi) => vi !== valIdx) } : o
    );
    set("options", opts);
  };

  // ── Submit ───────────────────────────────────────────────────
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
      image: (form.galleryImages.length > 0 ? form.galleryImages : [form.image])
        .map((item) => item.trim())
        .filter(Boolean)
        .join("\n") || form.slug.trim(),
      ingredients: form.ingredients,
      benefits: form.benefits,
      featured_video: form.featuredVideo.trim() || null,
      featured: form.featured,
      active: form.active,
      track_stock: form.track_stock,
      stock_qty: form.track_stock ? Number(form.stock_qty) : 0,
      options: form.options,
    };

    try {
      const res = await authFetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: form.id ? "update-product" : "create-product",
          id: form.id,
          payload,
        }),
      });
      await readApiJson(res);
      toast.success(form.id ? "Product updated" : "Product created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save product");
      setSaving(false);
      return;
    }
    nav({ to: "/admin/products" });
  };

  const uploadImages = async (files: FileList | null) => {
    const selected = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (selected.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of selected) {
        const res = await authFetch("/api/admin-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create-product-image-upload",
            payload: { fileName: file.name, contentType: file.type },
          }),
        });
        const upload = await readApiJson<{ path: string; token: string; publicUrl: string }>(res);
        const { error } = await supabase.storage
          .from("product-images")
          .uploadToSignedUrl(upload.path, upload.token, file);
        if (error) throw error;
        uploadedUrls.push(upload.publicUrl);
      }

      setForm((current) => ({
        ...current,
        galleryImages: [...current.galleryImages, ...uploadedUrls],
      }));
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const uploadVideo = async (files: FileList | null) => {
    const file = Array.from(files ?? []).find((item) => item.type.startsWith("video/"));
    if (!file) return;

    setUploadingVideo(true);
    try {
      const res = await authFetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-product-video-upload",
          payload: { fileName: file.name, contentType: file.type },
        }),
      });
      const upload = await readApiJson<{ path: string; token: string; publicUrl: string }>(res);
      const { error } = await supabase.storage
        .from("product-videos")
        .uploadToSignedUrl(upload.path, upload.token, file);
      if (error) throw error;

      set("featuredVideo", upload.publicUrl);
      toast.success("Featured video uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-8 max-w-3xl">

      {/* Basic Info */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>Name</label>
          <input className={inputCls} required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Slug</label>
          <input className={inputCls} required value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="adaptogenic-elixir" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Tagline</label>
        <input className={inputCls} required value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea rows={5} className={inputCls} required value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>Price (USD)</label>
          <input type="number" step="0.01" min="0" required className={inputCls} value={form.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <input className={inputCls} required value={form.category} onChange={(e) => set("category", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Images / Carousel</label>
        <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-gold/30 bg-obsidian px-4 py-6 text-center text-[11px] uppercase tracking-luxury text-gold transition-colors hover:border-gold hover:bg-gold/5">
          <ImagePlus className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Images"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              uploadImages(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </label>

        {gallery.length > 0 ? (
          <div className="space-y-3">
            {gallery.map((ref, idx) => (
              <div
                key={`${ref}-${idx}`}
                className="grid gap-3 border border-gold/15 bg-obsidian p-3 sm:grid-cols-[112px_1fr_auto]"
              >
                <div className="relative h-28 w-28 overflow-hidden border border-gold/20 bg-black">
                  <img
                    src={imageRefFor(ref, form.slug)}
                    alt={`${form.name || "Product"} image ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {idx === 0 && (
                    <div className="absolute left-1 top-1 flex items-center gap-1 bg-gold px-2 py-1 text-[9px] uppercase tracking-luxury text-obsidian">
                      <Star className="h-3 w-3 fill-current" />
                      Main
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-luxury text-gold">
                      Image {idx + 1}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] uppercase tracking-luxury text-muted-foreground">
                        Product card image
                      </span>
                    )}
                  </div>
                  <input
                    className={inputCls}
                    value={ref}
                    onChange={(e) => updateGalleryImage(idx, e.target.value)}
                    placeholder="Image key or uploaded URL"
                  />
                </div>

                <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(idx, -1)}
                    disabled={idx === 0}
                    className="border border-gold/30 p-3 text-gold transition-colors hover:bg-gold hover:text-obsidian disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label={`Move image ${idx + 1} earlier`}
                    title="Move earlier"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(idx, 1)}
                    disabled={idx === gallery.length - 1}
                    className="border border-gold/30 p-3 text-gold transition-colors hover:bg-gold hover:text-obsidian disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label={`Move image ${idx + 1} later`}
                    title="Move later"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(idx)}
                    className="border border-destructive/40 p-3 text-destructive transition-colors hover:bg-destructive hover:text-white"
                    aria-label={`Remove image ${idx + 1}`}
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-gold/15 bg-obsidian p-6 text-center text-sm text-muted-foreground">
            No images yet. Upload images to build the product carousel.
          </div>
        )}

        <p className="mt-2 text-[11px] text-muted-foreground">
          Use the arrow buttons to control the carousel order. The first image is used on product cards.
        </p>
      </div>

      <div>
        <label className={labelCls}>Featured Video</label>
        <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-gold/30 bg-obsidian px-4 py-6 text-center text-[11px] uppercase tracking-luxury text-gold transition-colors hover:border-gold hover:bg-gold/5">
          <Video className="h-4 w-4" />
          {uploadingVideo ? "Uploading..." : "Upload Video"}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="sr-only"
            disabled={uploadingVideo}
            onChange={(e) => {
              uploadVideo(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </label>

        {form.featuredVideo ? (
          <div className="space-y-3 border border-gold/15 bg-obsidian p-3">
            <div className="aspect-video overflow-hidden border border-gold/20 bg-black">
              <video
                src={form.featuredVideo}
                controls
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={form.featuredVideo}
                onChange={(e) => set("featuredVideo", e.target.value)}
                placeholder="Uploaded video URL or external video URL"
              />
              <button
                type="button"
                onClick={() => set("featuredVideo", "")}
                className="border border-destructive/40 px-4 text-destructive transition-colors hover:bg-destructive hover:text-white"
                aria-label="Remove featured video"
                title="Remove featured video"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <input
            className={inputCls}
            value={form.featuredVideo}
            onChange={(e) => set("featuredVideo", e.target.value)}
            placeholder="Optional video URL"
          />
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Add one product video. It appears under the product details on the storefront.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className={labelCls}>Ingredients (comma separated)</label>
          <input className={inputCls} value={form.ingredients.join(", ")} onChange={(e) => set("ingredients", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
        </div>
        <div>
          <label className={labelCls}>Benefits (comma separated)</label>
          <input className={inputCls} value={form.benefits.join(", ")} onChange={(e) => set("benefits", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
        </div>
      </div>

      {/* Stock */}
      <div className="border border-gold/20 p-6 space-y-5">
        <h3 className="text-[10px] uppercase tracking-luxury text-gold">Inventory</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.track_stock} onChange={(e) => set("track_stock", e.target.checked)} className="accent-gold w-4 h-4" />
          <span className="text-[11px] uppercase tracking-luxury">Track stock quantity</span>
        </label>
        {form.track_stock && (
          <div className="max-w-xs">
            <label className={labelCls}>Stock Quantity</label>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={form.stock_qty}
              onChange={(e) => set("stock_qty", parseInt(e.target.value) || 0)}
            />
            <p className="mt-2 text-[10px] text-muted-foreground">
              {form.stock_qty === 0 ? "⚠ Out of stock" : form.stock_qty <= 5 ? `⚠ Low stock (${form.stock_qty} left)` : `✓ In stock (${form.stock_qty} units)`}
            </p>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="border border-gold/20 p-6 space-y-5">
        <h3 className="text-[10px] uppercase tracking-luxury text-gold">Product Options</h3>
        <p className="text-[11px] text-muted-foreground">e.g. Size, Flavor, Strength — customers pick one value per option at checkout.</p>

        {form.options.map((opt, oi) => (
          <div key={oi} className="border border-gold/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium">{opt.name}</span>
              <button type="button" onClick={() => removeOption(oi)} className="text-destructive hover:text-destructive/80 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {opt.values.map((val, vi) => (
                <span key={vi} className="flex items-center gap-1 bg-gold/10 border border-gold/20 px-3 py-1.5 text-sm">
                  {val}
                  <button type="button" onClick={() => removeOptionValue(oi, vi)} className="text-muted-foreground hover:text-destructive ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-obsidian border border-gold/20 px-3 py-2 text-sm focus:border-gold focus:outline-none"
                placeholder={`Add ${opt.name} value…`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOptionValue(oi, (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const inp = (e.currentTarget.previousSibling as HTMLInputElement);
                  addOptionValue(oi, inp.value);
                  inp.value = "";
                }}
                className="px-4 py-2 border border-gold/40 text-gold text-[11px] uppercase tracking-luxury hover:bg-gold hover:text-obsidian transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <input
            className="flex-1 bg-obsidian border border-gold/20 px-3 py-2 text-sm focus:border-gold focus:outline-none"
            placeholder="Option name (e.g. Size)"
            value={newOptName}
            onChange={(e) => setNewOptName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
          />
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-2 px-4 py-2 border border-gold/40 text-gold text-[11px] uppercase tracking-luxury hover:bg-gold hover:text-obsidian transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Option
          </button>
        </div>
      </div>

      {/* Visibility */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="accent-gold w-4 h-4" />
          <span className="text-[11px] uppercase tracking-luxury">Active (visible on storefront)</span>
        </label>
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="accent-gold w-4 h-4" />
          <span className="text-[11px] uppercase tracking-luxury">Featured on home</span>
        </label>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gold/15">
        <button type="submit" disabled={saving} className="bg-gold text-obsidian px-8 py-3 text-[11px] uppercase tracking-luxury hover:bg-gold-light transition-colors disabled:opacity-50">
          {saving ? "Saving…" : form.id ? "Save Changes" : "Create Product"}
        </button>
        <button type="button" onClick={() => nav({ to: "/admin/products" })} className="border border-gold/40 text-gold px-8 py-3 text-[11px] uppercase tracking-luxury hover:bg-gold hover:text-obsidian transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
