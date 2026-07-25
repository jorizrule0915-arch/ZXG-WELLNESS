import creatineFront from "@/assets/creatine-products/front-creatine.webp";
import creatineBack from "@/assets/creatine-products/back-creatine.webp";
import bodyBalm from "@/assets/body-balm/body-balm.webp";
import bodyBalmBack from "@/assets/body-balm/backbalm.webp";
import bodyBalmLifestyle from "@/assets/body-balm/lifestylebalm.webp";

import penBlue from "@/assets/reusable-pen.webp";
import penBlack from "@/assets/reusable-pen-black.webp";
import penGold from "@/assets/reusable-pen-gold.webp";
import penGray from "@/assets/reusable-pen-gray.webp";
import penPink from "@/assets/reusable-pen-pink.webp";
import penPurple from "@/assets/reusable-pen-purple.webp";
import penRed from "@/assets/reusable-pen-red.webp";
import penGreen from "@/assets/reusable-pen-green.webp";
import penBronze from "@/assets/reusable-pen-bronze.webp";
import penSilver from "@/assets/reusable-pen-silver.webp";
import syringe from "@/assets/syringe.webp";
import cartridge from "@/assets/cartridge.webp";
import needles from "@/assets/needles.webp";

export const productImages: Record<string, string> = {
  creatine: creatineFront,
  "body-balm": bodyBalm,
  pen: penBlue,
  syringe,
  cartridge,
  needles,
};

export const productGallery: Record<string, string[]> = {
  creatine: [creatineFront, creatineBack],
  "body-balm": [bodyBalm, bodyBalmBack, bodyBalmLifestyle],
  pen: [
    penBlue,
    penBlack,
    penGold,
    penGray,
    penPink,
    penPurple,
    penRed,
    penGreen,
    penBronze,
    penSilver,
  ],
  syringe: [syringe],
  cartridge: [cartridge],
  needles: [needles],
};

/** Map pen colour value → image */
export const penColorImages: Record<string, string> = {
  blue: penBlue,
  black: penBlack,
  gold: penGold,
  gray: penGray,
  pink: penPink,
  purple: penPurple,
  red: penRed,
  green: penGreen,
  bronze: penBronze,
  silver: penSilver,
};

export const fallbackImage = creatineFront;

export const imageFor = (slug: string) => productImages[slug] ?? fallbackImage;
export const galleryFor = (slug: string) => productGallery[slug] ?? [imageFor(slug)];

export function imageRefFor(ref: string, fallbackSlug?: string) {
  const value = ref.trim();
  if (!value) return fallbackSlug ? imageFor(fallbackSlug) : fallbackImage;
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:")
  ) {
    return value;
  }
  return (
    productImages[value] ??
    penColorImages[value] ??
    (fallbackSlug ? imageFor(fallbackSlug) : fallbackImage)
  );
}

export function imageRefsFrom(value?: string | null) {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}
