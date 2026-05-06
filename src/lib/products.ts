import { supabase } from "@/integrations/supabase/client";
import { imageFor } from "./productImages";

export type ProductVariant = {
  label: string;
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
