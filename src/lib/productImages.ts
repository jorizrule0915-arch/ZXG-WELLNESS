import creatineFront from "@/assets/creatine-products/front-creatine.png";
import creatineBack from "@/assets/creatine-products/back-creatine.png";
import bodyBalm from "@/assets/body-balm/body-balm.png";
import bodyBalmBack from "@/assets/body-balm/backbalm.png";
import bodyBalmLifestyle from "@/assets/body-balm/lifestylebalm.png";

export const productImages: Record<string, string> = {
  creatine: creatineFront,
  "body-balm": bodyBalm,
};

export const productGallery: Record<string, string[]> = {
  creatine: [creatineFront, creatineBack],
  "body-balm": [bodyBalm, bodyBalmBack, bodyBalmLifestyle],
};

export const fallbackImage = creatineFront;

export const imageFor = (slug: string) => productImages[slug] ?? fallbackImage;
export const galleryFor = (slug: string) => productGallery[slug] ?? [imageFor(slug)];
