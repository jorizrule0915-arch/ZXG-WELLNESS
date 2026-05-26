import { supabase } from "@/integrations/supabase/client";
import { imageFor, galleryFor } from "./productImages";

export type ProductVariant = {
  label: string;
  price: number;
};

export type ProductColorVariant = {
  label: string;
  value: string;
  price: number;
};

export type Product = {
  id: string;
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
  variants?: ProductVariant[];
  colorVariants?: ProductColorVariant[];
};

type Row = {
  id: string;
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
  variants?: ProductVariant[];
};

const mapRow = (r: Row): Product => ({
  ...r,
  price: Number(r.price),
  image: imageFor(r.slug),
});

export const localProducts: Product[] = [
  {
    id: "local-pen",
    slug: "pen",
    name: "ZXG Wellness Reusable Injection Pen",
    tagline: "Precision-engineered metal pen",
    description:
      "The ZXG reusable injection pen is built for repeat use with a durable metal body and a comfortable adjustable dosing dial. Designed to feel premium in hand while keeping daily use simple and dependable.",
    price: 20,
    category: "Accessories",
    image: imageFor("pen"),
    ingredients: ["Metal construction", "Adjustable dial", "Reusable design"],
    benefits: ["Premium metal finish", "Smooth dose control", "Designed for long-term use"],
    featured: false,
    colorVariants: [
      { label: "Blue", value: "blue", price: 20 },
      { label: "Black", value: "black", price: 20 },
      { label: "Dark Gray", value: "dark-gray", price: 20 },
      { label: "Gold", value: "gold", price: 20 },
      { label: "Gray", value: "gray", price: 20 },
      { label: "Light Blue", value: "light-blue", price: 20 },
      { label: "Pink", value: "pink", price: 20 },
      { label: "Red", value: "red", price: 20 },
      { label: "Silver", value: "silver", price: 20 },
    ],
  },
  {
    id: "local-syringe",
    slug: "syringe",
    name: "ZXG Wellness Syringe",
    tagline: "Sterile precision — 100 per box",
    description:
      "ZXG syringes are designed for clean, precise handling with dependable sterile packaging. Choose from multiple sizes depending on the application, with each box including 100 pieces.",
    price: 15,
    category: "Accessories",
    image: imageFor("syringe"),
    ingredients: ["Sterile packaging", "Multiple sizes", "100 per box"],
    benefits: ["Small, mini, and large sizes", "Easy-to-read barrel markings", "Reliable handling"],
    featured: false,
    variants: [
      { label: "Small (1ml 30g)", price: 15 },
      { label: "Mini (0.5ml 30g)", price: 15 },
      { label: "Large (3ml 23g)", price: 15 },
    ],
  },
  {
    id: "local-cartridge",
    slug: "cartridge",
    name: "ZXG Wellness Disposable 3mL Cartridges",
    tagline: "Standard 3mL — 10 per set",
    description:
      "ZXG disposable cartridges are built for a clean fit inside reusable ZXG injection pens. Each set includes 10 cartridges with a stable 3mL capacity to keep replacements easy and consistent.",
    price: 10,
    category: "Accessories",
    image: imageFor("cartridge"),
    ingredients: ["3mL capacity", "Universal ZXG fit", "10 per set"],
    benefits: ["Reliable replacement option", "Built for ZXG reusable pens", "Compact set"],
    featured: false,
  },
  {
    id: "local-needles",
    slug: "needles",
    name: "ZXG Wellness Single-Use Pen Needles",
    tagline: "Ultra-fine micro-tip — 100 per box",
    description:
      "ZXG single-use pen needles are designed for a smoother, more comfortable attachment experience. Every box includes 100 ultra-fine needles, making them a convenient staple alongside reusable pens.",
    price: 8,
    category: "Accessories",
    image: imageFor("needles"),
    ingredients: ["Ultra-fine micro-tip", "100 per box", "Clean sterile finish"],
    benefits: ["Works with ZXG pens", "Designed for controlled use", "Easy-to-store packaging"],
    featured: false,
    variants: [
      { label: "32g × 4mm", price: 8 },
      { label: "31g × 8mm", price: 8 },
    ],
  },
  {
    id: "local-creatine",
    slug: "creatine",
    name: "ZXG Wellness Creatine Performance Matrix Powder",
    tagline: "Pure performance formula",
    description:
      "ZXG Wellness Creatine Performance Matrix Powder is built to support strength output, workout endurance, and hydration support during training. The formula mixes cleanly and fits easily into a daily performance routine.",
    price: 29.99,
    category: "Supplements",
    image: imageFor("creatine"),
    ingredients: ["Creatine Monohydrate"],
    benefits: ["Boosts strength", "Enhances endurance", "Supports recovery"],
    featured: true,
  },
  {
    id: "local-body-balm",
    slug: "body-balm",
    name: "ZXG Wellness Nourishing Body Balm",
    tagline: "Deeply moisturizing skin treatment",
    description:
      "ZXG Wellness Nourishing Body Balm is a deeply moisturizing skin treatment formulated with cocoa butter, shea butter, and squalane. Its lightweight, fast-absorbing formula leaves skin silky smooth all day long without grease or heavy residue.",
    price: 16.99,
    category: "Skincare",
    image: imageFor("body-balm"),
    ingredients: ["Cocoa Butter", "Shea Butter", "Squalane"],
    benefits: [
      "Deep moisture for dry skin",
      "Lightweight and non-greasy",
      "Comfortable daily-use finish",
    ],
    featured: true,
    variants: [
      { label: "Aloe Scent", price: 16.99 },
      { label: "Unscented", price: 16.99 },
      { label: "Pack (Both)", price: 23.99 },
    ],
  },
];

export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const products = (data as Row[]).map(mapRow);
    return products.length > 0 ? products : localProducts;
  } catch {
    return localProducts;
  }
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;

    return data ? mapRow(data as Row) : (localProducts.find((p) => p.slug === slug) ?? null);
  } catch {
    return localProducts.find((p) => p.slug === slug) ?? null;
  }
}
