import creatineFront from "@/assets/creatine-products/front-creatine.png";
import creatineBack from "@/assets/creatine-products/back-creatine.png";
import bodyBalm from "@/assets/body-balm/body-balm.png";
import bodyBalmBack from "@/assets/body-balm/backbalm.png";
import bodyBalmLifestyle from "@/assets/body-balm/lifestylebalm.png";

import penBlue from "@/assets/reusable-pen.png";
import penBlack from "@/assets/reusable-pen-black.png";
import penDarkGray from "@/assets/reusable-pen-darkgray.png";
import penGold from "@/assets/reusable-pen-gold.png";
import penGray from "@/assets/reusable-pen-gray.png";
import penLightBlue from "@/assets/reusable-pen-lightblue.png";
import penPink from "@/assets/reusable-pen-pink.png";
import penRed from "@/assets/reusable-pen-red.png";
import penSilver from "@/assets/reusable-pen-silver.png";
import syringe from "@/assets/syringe.png";
import cartridge from "@/assets/cartridge.png";
import needles from "@/assets/needles.png";

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
  pen: [penBlue, penBlack, penDarkGray, penGold, penGray, penLightBlue, penPink, penRed, penSilver],
  syringe: [syringe],
  cartridge: [cartridge],
  needles: [needles],
};

/** Map pen colour value → image */
export const penColorImages: Record<string, string> = {
  blue: penBlue,
  black: penBlack,
  "dark-gray": penDarkGray,
  gold: penGold,
  gray: penGray,
  "light-blue": penLightBlue,
  pink: penPink,
  red: penRed,
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
  return productImages[value] ?? (fallbackSlug ? imageFor(fallbackSlug) : fallbackImage);
}

export function imageRefsFrom(value?: string | null) {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}
