import creatineFront from "@/assets/Creatine Products/front Creatine.png";
import creatineBack from "@/assets/Creatine Products/back Creatine.png";
import bodyBalm from "@/assets/Body Balm/Body Balm.jpg";
import bodyBalmBack from "@/assets/Body Balm/backbalm.png";
import bodyBalmLifestyle from "@/assets/Body Balm/lifestylebalm.png";

export const productImages: Record<string, string> = {
  "creatine": creatineFront,
  "body-balm": bodyBalm,
};

export const productGallery: Record<string, string[]> = {
  "creatine": [creatineFront, creatineBack],
  "body-balm": [bodyBalm, bodyBalmBack, bodyBalmLifestyle],
};

export const fallbackImage = creatineFront;

export const imageFor = (slug: string) => productImages[slug] ?? fallbackImage;
export const galleryFor = (slug: string) => productGallery[slug] ?? [imageFor(slug)];
