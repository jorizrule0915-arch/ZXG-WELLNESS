import creatineImage from "@/assets/creatine-products/front-creatine.png";
import bodyBalmImage from "@/assets/body-balm/body-balm.png";
import penImage from "@/assets/reusable-pen-black.png";

export type BlogArticle = {
  slug: string;
  title: string;
  description: string;
  category: "Creatine" | "Recovery" | "Wellness" | "Accessories";
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  author: string;
  image: string;
  imageAlt: string;
  keywords: string[];
  intro: string[];
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
  faqs: Array<{ question: string; answer: string }>;
  relatedLinks: Array<{ label: string; path: string; description: string }>;
};

export const blogArticles: BlogArticle[] = [
  {
    slug: "creatine-strength-recovery-daily-routine",
    title: "Creatine for Strength and Recovery: A Practical Daily Routine",
    description:
      "Learn how creatine fits into a consistent performance routine, including timing, hydration, recovery habits, and smart ways to stay consistent.",
    category: "Creatine",
    publishedAt: "2026-06-29",
    updatedAt: "2026-06-29",
    readingTime: "6 min read",
    author: "ZXG Wellness Editorial Team",
    image: creatineImage,
    imageAlt: "ZXG Wellness Creatine Performance Matrix Powder",
    keywords: [
      "creatine routine",
      "creatine recovery",
      "creatine for strength",
      "wellness supplements",
    ],
    intro: [
      "Creatine is one of the most familiar performance supplements because it is simple, practical, and easy to build into a daily routine. The biggest advantage for most people is not complexity. It is consistency.",
      "A strong creatine routine works best when it sits beside the basics: regular training, hydration, enough food, good sleep, and recovery habits you can repeat without overthinking.",
    ],
    sections: [
      {
        heading: "What creatine supports in a routine",
        paragraphs: [
          "Creatine is commonly used by people who want to support strength output, repeated training effort, and recovery-focused performance habits. It does not replace training or nutrition, but it can be a useful part of a broader plan.",
          "Think of it as one piece of the system. Your workouts create the stimulus. Food, rest, hydration, and recovery help you adapt. Creatine fits into that larger rhythm as a daily performance support.",
        ],
        bullets: [
          "Strength-focused training routines",
          "Consistent gym performance over time",
          "Recovery habits after demanding sessions",
          "Simple daily supplement planning",
        ],
      },
      {
        heading: "Timing matters less than consistency",
        paragraphs: [
          "Many people worry about the perfect time to take creatine. For everyday routines, consistency usually matters more than a narrow timing window. Pick a moment that is easy to repeat, such as with breakfast, after training, or with your usual hydration ritual.",
          "The best schedule is the one you can follow. Pairing creatine with an existing habit makes the routine easier to maintain and easier to remember.",
        ],
      },
      {
        heading: "Build the routine around hydration and recovery",
        paragraphs: [
          "Creatine works best inside a routine that already respects hydration. Keep water intake steady through the day, especially around training or warm weather.",
          "Recovery also matters. A practical plan includes sleep, mobility, skin care after showers or training, and enough food to support your goals. The small daily habits are what make the routine feel sustainable.",
        ],
      },
      {
        heading: "A simple weekly approach",
        paragraphs: [
          "Start with a repeatable daily rhythm instead of constantly changing your approach. Keep the product visible, choose a consistent time, and check in weekly with how your training and recovery feel.",
          "If you have a medical condition, take medications, are pregnant, or have questions about whether creatine is appropriate for you, speak with a qualified healthcare professional before starting.",
        ],
        bullets: [
          "Choose one daily time you can repeat",
          "Keep water intake consistent",
          "Track training performance and recovery notes",
          "Review your routine weekly instead of changing it daily",
        ],
      },
    ],
    faqs: [
      {
        question: "Should creatine be taken before or after workouts?",
        answer:
          "For many everyday users, taking creatine consistently is more important than perfect timing. Choose a repeatable time that fits your routine.",
      },
      {
        question: "Can creatine replace good nutrition?",
        answer:
          "No. Creatine should sit alongside balanced nutrition, hydration, training, sleep, and recovery habits.",
      },
      {
        question: "Who should ask a professional first?",
        answer:
          "Anyone with a medical condition, medication questions, pregnancy-related questions, or kidney-health concerns should speak with a qualified healthcare professional before using creatine.",
      },
    ],
    relatedLinks: [
      {
        label: "Shop ZXG Creatine",
        path: "/products/creatine",
        description: "View the ZXG Wellness creatine product page and product details.",
      },
      {
        label: "Browse wellness products",
        path: "/products",
        description: "Explore creatine, recovery care, and wellness accessories.",
      },
    ],
  },
  {
    slug: "post-workout-recovery-routine-skin-hydration-rest",
    title: "A Better Post-Workout Recovery Routine: Skin, Hydration, and Rest",
    description:
      "Build a calmer recovery routine after training with hydration, skin care, mobility, rest, and simple wellness habits that are easy to repeat.",
    category: "Recovery",
    publishedAt: "2026-06-29",
    updatedAt: "2026-06-29",
    readingTime: "7 min read",
    author: "ZXG Wellness Editorial Team",
    image: bodyBalmImage,
    imageAlt: "ZXG Wellness Nourishing Body Balm",
    keywords: [
      "post workout recovery routine",
      "recovery skincare",
      "hydration after training",
      "wellness recovery",
    ],
    intro: [
      "A good recovery routine should feel like a reset, not a chore. After training, your body and skin both benefit from a few simple habits repeated consistently.",
      "The goal is not to add ten more tasks to your day. The goal is to create a short ritual that helps you cool down, rehydrate, care for your skin, and prepare for the next session.",
    ],
    sections: [
      {
        heading: "Start with the transition",
        paragraphs: [
          "The first few minutes after training set the tone. Instead of rushing straight into the rest of the day, use a short transition: breathe, walk, stretch lightly, and let your heart rate come down.",
          "This does not need to be elaborate. Even five quiet minutes can make the routine feel more intentional and easier to repeat.",
        ],
      },
      {
        heading: "Hydration is part of recovery",
        paragraphs: [
          "Hydration supports how you feel after training, especially if the session was long, sweaty, or done in warm conditions. Keep it simple: drink water steadily and pair it with meals or snacks that fit your nutrition needs.",
          "If you use supplements, place them inside the same repeatable recovery rhythm so they become part of the routine instead of something you remember randomly.",
        ],
        bullets: [
          "Drink water after training and throughout the day",
          "Pair recovery with a balanced meal or snack",
          "Keep your routine visible and easy to repeat",
          "Avoid making recovery depend on perfect conditions",
        ],
      },
      {
        heading: "Do not ignore skin recovery",
        paragraphs: [
          "Sweat, showering, weather, and frequent training can leave skin feeling dry or tight. A body balm can help make recovery feel more complete by adding moisture back into the skin after cleansing.",
          "Use a balm after a shower or before bed when you want a richer moisturizing step. Focus on dry areas such as arms, legs, elbows, knees, and hands.",
        ],
      },
      {
        heading: "End the routine with rest cues",
        paragraphs: [
          "Recovery is not only what happens after the workout. It is also the way you prepare your body to rest. Dim lights, put your recovery products in one place, and create a predictable evening rhythm.",
          "If pain, swelling, or unusual symptoms appear after training, do not rely on a wellness routine alone. Speak with a qualified professional for personal guidance.",
        ],
      },
    ],
    faqs: [
      {
        question: "How long should a recovery routine take?",
        answer:
          "A useful routine can take 10 to 20 minutes. The best routine is short enough to repeat and complete enough to cover hydration, cooling down, and skin care.",
      },
      {
        question: "When should I apply body balm?",
        answer:
          "A practical time is after showering or before bed, especially on dry areas that need a richer moisturizing step.",
      },
      {
        question: "Can recovery products replace rest?",
        answer:
          "No. Products can support a routine, but sleep, nutrition, hydration, and appropriate training load remain foundational.",
      },
    ],
    relatedLinks: [
      {
        label: "Shop Body Balm",
        path: "/products/body-balm",
        description: "See ZXG Wellness Nourishing Body Balm for daily recovery skin care.",
      },
      {
        label: "Shop Creatine",
        path: "/products/creatine",
        description: "Add a simple performance product to your recovery routine.",
      },
    ],
  },
  {
    slug: "reusable-pen-cartridge-needle-setup-guide",
    title: "Reusable Pen Setup Guide: Pen, Cartridge, and Needle Accessories Explained",
    description:
      "Understand how reusable pens, disposable cartridges, and single-use pen needles fit together so customers can shop ZXG accessories with confidence.",
    category: "Accessories",
    publishedAt: "2026-06-29",
    updatedAt: "2026-06-29",
    readingTime: "8 min read",
    author: "ZXG Wellness Editorial Team",
    image: penImage,
    imageAlt: "ZXG Wellness reusable injection pen accessory",
    keywords: [
      "reusable injection pen",
      "pen cartridges",
      "single use pen needles",
      "wellness accessories",
    ],
    intro: [
      "Reusable pen accessories can feel confusing at first because there are several pieces: the pen body, cartridges, pen needles, and supporting supplies.",
      "This guide explains the shopping logic in plain language so customers can understand what each accessory does before they buy.",
    ],
    sections: [
      {
        heading: "The reusable pen is the main body",
        paragraphs: [
          "The reusable pen is the durable outer accessory. It is designed to be kept and reused rather than treated as a single-use item.",
          "Customers often choose a reusable pen when they want a more premium feel, a cleaner setup, and a system that can be restocked with compatible accessories.",
        ],
      },
      {
        heading: "Cartridges are the refill component",
        paragraphs: [
          "Disposable cartridges are the replacement piece that fits into the reusable pen system. ZXG cartridges are presented as a 3mL, 10-piece set for simple restocking.",
          "If you are buying a reusable pen for the first time, it is helpful to check whether cartridges are needed for your intended setup.",
        ],
        bullets: [
          "Reusable pen: durable outer body",
          "Cartridge: refill component",
          "Pen needle: single-use attachment",
          "How-to guide: setup and handling resource",
        ],
      },
      {
        heading: "Pen needles are single-use attachments",
        paragraphs: [
          "Pen needles are the small single-use accessory that attaches to compatible pen systems. They should be selected carefully based on the available product options and handled according to the instructions provided with the product.",
          "Do not reuse single-use accessories. If you are unsure what you need, review the product pages and contact customer care before ordering.",
        ],
      },
      {
        heading: "Shop the system, not just one item",
        paragraphs: [
          "The easiest way to shop is to think in systems. If you are comparing accessories, look at the reusable pen, cartridges, and needles together so the full setup makes sense.",
          "For any medical, dosing, or personal-use questions, speak with a qualified healthcare professional. ZXG product pages are designed to explain accessories and shopping details, not to replace professional guidance.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need cartridges with a reusable pen?",
        answer:
          "The reusable pen is designed around compatible refill accessories. Review the cartridge product page to understand the 3mL, 10-piece cartridge set.",
      },
      {
        question: "Are pen needles reusable?",
        answer: "No. Pen needles are presented as single-use accessories and should not be reused.",
      },
      {
        question: "Where should I start if I am confused?",
        answer:
          "Start with the reusable pen difference page, then review the product pages for the pen, cartridges, and needles.",
      },
    ],
    relatedLinks: [
      {
        label: "Compare reusable pens",
        path: "/reusable-pen-difference",
        description: "See the reusable pen comparison and accessory overview.",
      },
      {
        label: "Shop reusable pen",
        path: "/products/pen",
        description: "View ZXG Wellness reusable pen colors and product details.",
      },
      {
        label: "View setup guides",
        path: "/how-to-use",
        description: "Review videos and handling resources before using accessories.",
      },
    ],
  },
];

export function getBlogArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug) ?? null;
}

export function getRelatedBlogArticles(slug: string, category: BlogArticle["category"]) {
  return blogArticles
    .filter((article) => article.slug !== slug)
    .sort((a, b) => {
      if (a.category === category && b.category !== category) return -1;
      if (a.category !== category && b.category === category) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 2);
}

export function formatBlogDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}
