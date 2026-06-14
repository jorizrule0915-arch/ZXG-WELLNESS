import { supabase } from "@/integrations/supabase/client";
import { imageFor, galleryFor, imageRefFor, imageRefsFrom, penColorImages } from "./productImages";

export type ProductVariant = {
  label: string;
  price: number;
};

export type ProductColorVariant = {
  label: string;
  value: string;
  price: number;
  image?: string;
  inStock?: boolean;
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
  gallery?: string[];
  featuredVideo?: string | null;
  ingredients: string[];
  benefits: string[];
  featured: boolean;
  variants?: ProductVariant[];
  colorVariants?: ProductColorVariant[];
  selectedOptionLabel?: string;
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
  featured_video?: string | null;
  ingredients?: unknown;
  benefits?: unknown;
  featured?: boolean | null;
  variants?: ProductVariant[];
  options?: unknown;
};

const penColorVariants: ProductColorVariant[] = [
  { label: "Blue", value: "blue", price: 20, image: penColorImages.blue, inStock: true },
  { label: "Black", value: "black", price: 20, image: penColorImages.black, inStock: true },
  { label: "Gold", value: "gold", price: 20, image: penColorImages.gold, inStock: true },
  { label: "Gray", value: "gray", price: 20, image: penColorImages.gray, inStock: true },
  { label: "Pink", value: "pink", price: 20, image: penColorImages.pink, inStock: true },
  { label: "Purple", value: "purple", price: 20, image: penColorImages.purple, inStock: true },
  { label: "Red", value: "red", price: 20, image: penColorImages.red, inStock: true },
  { label: "Green", value: "green", price: 20, image: penColorImages.green, inStock: true },
  { label: "Bronze", value: "bronze", price: 20, image: penColorImages.bronze, inStock: true },
  { label: "Silver", value: "silver", price: 20, image: penColorImages.silver, inStock: true },
];

const needleVariants: ProductVariant[] = [
  { label: "32G x 4mm - Box of 100", price: 10 },
  { label: "31G x 6mm - Box of 100", price: 10 },
  { label: "31G x 8mm - Box of 100", price: 10 },
];

const toStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item ?? "").trim()).filter(Boolean) : [];

const toFinitePrice = (value: unknown, fallback = 0) => {
  const price = Number(value);
  return Number.isFinite(price) ? price : fallback;
};

const toOptionValue = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const penColorAliases: Record<string, string> = {
  "light-grey": "gray",
  lightgrey: "gray",
  grey: "gray",
  "matte-black": "black",
  "rose-gold": "gold",
};

const normalizePenColorValue = (value: string) => {
  const normalized = toOptionValue(value);
  return penColorAliases[normalized] ?? normalized;
};

const isPenColorValue = (value: string) =>
  Object.prototype.hasOwnProperty.call(penColorImages, value);

function optionVariantsFrom(options: unknown, slug: string, basePrice: number) {
  const variants: ProductVariant[] = [];
  const colorVariants = new Map<string, ProductColorVariant>();

  if (!Array.isArray(options)) {
    return { variants, colorVariants: [] };
  }

  options.forEach((option) => {
    if (!option || typeof option !== "object" || Array.isArray(option)) return;
    const source = option as Record<string, unknown>;
    const optionType = String(source.type ?? "")
      .trim()
      .toLowerCase();
    const optionName = String(source.name ?? "")
      .trim()
      .toLowerCase();
    const rawValues = source.values;

    if (Array.isArray(rawValues)) {
      rawValues.forEach((value) => {
        const valueSource =
          value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : null;
        const label = String(
          valueSource?.label ?? valueSource?.name ?? valueSource?.value ?? value ?? "",
        ).trim();
        if (!label) return;
        const rawValue = String(valueSource?.value ?? label).trim();
        const colorValue = normalizePenColorValue(rawValue);
        const price = toFinitePrice(valueSource?.price, basePrice);
        const imageRef = String(valueSource?.image ?? "").trim();
        const inStock = typeof valueSource?.inStock === "boolean" ? valueSource.inStock : true;

        if ((slug === "pen" || optionName.includes("color")) && isPenColorValue(colorValue)) {
          colorVariants.set(colorValue, {
            label,
            value: colorValue,
            price,
            image: imageRef ? imageRefFor(imageRef, slug) : penColorImages[colorValue],
            inStock,
          });
          return;
        }

        if (slug === "pen" && optionName.includes("color")) return;

        variants.push({ label, price });
      });
      return;
    }

    const label = String(source.label ?? "").trim();
    if (!label) return;
    const rawValue = String(source.value ?? label).trim();
    const value = normalizePenColorValue(rawValue);
    const price = toFinitePrice(source.price, basePrice);
    const isColor = optionType === "color" || (slug === "pen" && isPenColorValue(value));

    if (isColor) {
      colorVariants.set(value, {
        label,
        value,
        price,
        image: penColorImages[value],
        inStock: typeof source.inStock === "boolean" ? source.inStock : true,
      });
      return;
    }

    if (slug === "pen" && optionName.includes("color")) return;

    variants.push({ label, price });
  });

  return {
    variants,
    colorVariants: [...colorVariants.values()],
  };
}

const mergePenColorVariants = (colorVariants: ProductColorVariant[]) => {
  const existingByValue = new Map(colorVariants.map((variant) => [variant.value, variant]));

  return penColorVariants.map((defaultVariant) => {
    const existing = existingByValue.get(defaultVariant.value);

    return {
      ...defaultVariant,
      ...existing,
      value: defaultVariant.value,
      image: existing?.image || defaultVariant.image,
    };
  });
};

const mapRow = (r: Row): Product => {
  const refs = imageRefsFrom(r.image);
  const gallery =
    refs.length > 0 ? refs.map((ref) => imageRefFor(ref, r.slug)) : galleryFor(r.slug);
  const price = toFinitePrice(r.price);
  const optionVariants = optionVariantsFrom(r.options, r.slug, price);
  const colorVariants =
    r.slug === "pen"
      ? mergePenColorVariants(optionVariants.colorVariants)
      : optionVariants.colorVariants;

  return {
    ...r,
    price,
    image: gallery[0] ?? imageFor(r.slug),
    gallery,
    featuredVideo: r.featured_video ?? null,
    ingredients: toStringList(r.ingredients),
    benefits: toStringList(r.benefits),
    featured: Boolean(r.featured),
    variants:
      r.slug === "pen"
        ? undefined
        : r.slug === "needles"
          ? needleVariants
          : optionVariants.variants.length > 0
            ? optionVariants.variants
            : r.variants,
    colorVariants:
      colorVariants.length > 0 ? colorVariants : r.slug === "pen" ? penColorVariants : undefined,
  };
};

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
    colorVariants: penColorVariants,
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
    price: 10,
    category: "Accessories",
    image: imageFor("needles"),
    ingredients: ["Ultra-fine micro-tip", "100 per box", "Clean sterile finish"],
    benefits: ["Works with ZXG pens", "Designed for controlled use", "Easy-to-store packaging"],
    featured: false,
    variants: needleVariants,
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

    const rows = Array.isArray(data) ? (data as Row[]) : [];
    const products = rows.map(mapRow);
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
