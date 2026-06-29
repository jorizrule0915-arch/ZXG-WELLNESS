import type { Product } from "./products";

export type ProductSeoContent = {
  metaDescription: string;
  overview: string[];
  faqs: Array<{ question: string; answer: string }>;
  internalLinks: Array<{ label: string; path: string; description: string }>;
};

const productSeoContent: Record<string, ProductSeoContent> = {
  creatine: {
    metaDescription:
      "Shop ZXG Wellness Creatine Performance Matrix Powder for a clean daily performance routine supporting training strength, endurance, and recovery.",
    overview: [
      "ZXG Wellness Creatine Performance Matrix Powder is built for athletes and everyday wellness customers who want a simple, consistent creatine routine.",
      "Use it as part of a training plan focused on strength output, workout consistency, hydration support, and post-workout recovery habits.",
    ],
    faqs: [
      {
        question: "What is ZXG creatine best used for?",
        answer:
          "ZXG creatine is designed for daily performance routines, especially strength training, workout consistency, and recovery-focused wellness habits.",
      },
      {
        question: "How should I add creatine to my routine?",
        answer:
          "Follow the product label and use it consistently as part of your nutrition and training plan. If you have medical questions, ask a qualified healthcare professional.",
      },
      {
        question: "Is this product part of the recovery category?",
        answer:
          "Yes. Creatine sits inside the ZXG performance and recovery collection because it supports a consistent training routine.",
      },
    ],
    internalLinks: [
      {
        label: "Browse recovery essentials",
        path: "/products",
        description: "Explore products that support training, recovery, and daily care.",
      },
      {
        label: "Read the return policy",
        path: "/returns",
        description: "Understand shipping, returns, and customer care before ordering.",
      },
    ],
  },
  "body-balm": {
    metaDescription:
      "Shop ZXG Wellness Nourishing Body Balm, a recovery-focused skin treatment with cocoa butter, shea butter, and squalane for daily moisture.",
    overview: [
      "ZXG Wellness Nourishing Body Balm is made for daily recovery care when skin feels dry, stressed, or in need of extra comfort.",
      "The formula combines cocoa butter, shea butter, and squalane for a smooth, non-greasy feel that fits easily into morning or evening routines.",
    ],
    faqs: [
      {
        question: "What skin concern is this balm made for?",
        answer:
          "It is made for dry skin and daily body care, especially when you want a richer moisturizer without a heavy greasy finish.",
      },
      {
        question: "Can I use the balm every day?",
        answer:
          "Yes. It is positioned as a daily-use body balm. Apply as needed and avoid use on irritated or broken skin unless advised by a professional.",
      },
      {
        question: "Which ZXG category does Body Balm belong to?",
        answer:
          "Body Balm belongs to the ZXG recovery and skincare collection because it supports comfortable skin care after training, travel, or everyday dryness.",
      },
    ],
    internalLinks: [
      {
        label: "Shop the wellness collection",
        path: "/products",
        description: "Compare ZXG skincare, recovery, and performance essentials.",
      },
      {
        label: "Contact customer care",
        path: "/contact",
        description: "Ask a product or order question before purchasing.",
      },
    ],
  },
  pen: {
    metaDescription:
      "Shop the ZXG Wellness Reusable Injection Pen with a durable metal body, color options, refillable cartridge compatibility, and premium everyday handling.",
    overview: [
      "The ZXG Wellness Reusable Injection Pen is designed for customers who want a durable, premium-feeling refillable pen setup.",
      "Pair it with compatible ZXG cartridges and single-use pen needles to build a cleaner, easier-to-understand accessory system.",
    ],
    faqs: [
      {
        question: "What makes the ZXG reusable pen different?",
        answer:
          "It uses a reusable metal body, color options, an adjustable dial, and a setup built around replaceable cartridges and single-use needles.",
      },
      {
        question: "Does the reusable pen work with ZXG cartridges?",
        answer:
          "Yes. The reusable pen is presented alongside ZXG disposable 3mL cartridges and single-use pen needles for a complete accessory setup.",
      },
      {
        question: "Where can I compare reusable pen options?",
        answer:
          "Use the reusable pen difference guide to compare reusable construction, handling, refill options, and accessory compatibility.",
      },
    ],
    internalLinks: [
      {
        label: "Compare reusable pens",
        path: "/reusable-pen-difference",
        description: "See how reusable pen styles and compatible accessories compare.",
      },
      {
        label: "Learn how to use the pen",
        path: "/how-to-use",
        description: "Review setup and handling guidance before using your accessories.",
      },
    ],
  },
  syringe: {
    metaDescription:
      "Shop ZXG Wellness sterile syringes in multiple size options, packaged for precise handling and convenient wellness accessory use.",
    overview: [
      "ZXG Wellness Syringes are packaged as practical accessories for customers who need clean, precise handling and easy size selection.",
      "Each box includes multiple sterile syringes with clear sizing options so customers can choose the format that fits their intended use.",
    ],
    faqs: [
      {
        question: "What sizes are available?",
        answer:
          "The product page lists small, mini, and large syringe options so customers can select the size that matches their needs.",
      },
      {
        question: "How many syringes come in a box?",
        answer:
          "The ZXG syringe product is presented as a 100-count box, with size options shown on the product page.",
      },
      {
        question: "Where can I learn more before buying?",
        answer:
          "Visit the how-to-use page for general handling guidance and contact ZXG Wellness if you have order or product questions.",
      },
    ],
    internalLinks: [
      {
        label: "View how-to guides",
        path: "/how-to-use",
        description: "Review safe handling and setup resources.",
      },
      {
        label: "Shop compatible accessories",
        path: "/products",
        description: "Browse the full accessories collection.",
      },
    ],
  },
  cartridge: {
    metaDescription:
      "Shop ZXG Wellness disposable 3mL cartridges, a 10-piece refill set designed for clean fit and consistent replacement with ZXG reusable pens.",
    overview: [
      "ZXG disposable 3mL cartridges are built as a refill accessory for the ZXG reusable pen system.",
      "Each set includes 10 cartridges, making replacement planning simpler for customers who want an organized wellness accessory routine.",
    ],
    faqs: [
      {
        question: "How many cartridges are included?",
        answer:
          "Each ZXG disposable cartridge set includes 10 cartridges with a standard 3mL capacity.",
      },
      {
        question: "Are these made for the ZXG reusable pen?",
        answer:
          "Yes. The cartridges are positioned as replacement accessories for the ZXG reusable injection pen.",
      },
      {
        question: "What should I buy with cartridges?",
        answer:
          "Customers often view the reusable pen and single-use pen needles alongside cartridges to understand the complete accessory setup.",
      },
    ],
    internalLinks: [
      {
        label: "Shop the reusable pen",
        path: "/products/pen",
        description: "Pair cartridges with the reusable ZXG pen.",
      },
      {
        label: "Shop pen needles",
        path: "/products/needles",
        description: "Complete the accessory setup with single-use pen needles.",
      },
    ],
  },
  needles: {
    metaDescription:
      "Shop ZXG Wellness single-use pen needles in 100-count boxes with ultra-fine options for compatible reusable pen accessories.",
    overview: [
      "ZXG Wellness Single-Use Pen Needles are designed as a convenient accessory for compatible pen setups.",
      "The product page includes size options and a 100-count box format, helping customers choose the right refill accessory before checkout.",
    ],
    faqs: [
      {
        question: "How many pen needles come in a box?",
        answer:
          "The product is presented as a 100-count box with size options available on the product page.",
      },
      {
        question: "Are these compatible with ZXG pens?",
        answer:
          "They are designed to work with compatible ZXG reusable pen accessories. Review product details before purchasing.",
      },
      {
        question: "Can I compare these with other accessories?",
        answer:
          "Yes. Browse the full ZXG accessories collection or review the reusable pen difference guide for context.",
      },
    ],
    internalLinks: [
      {
        label: "Compare reusable pen setup",
        path: "/reusable-pen-difference",
        description: "Understand how pen, cartridge, and needle accessories fit together.",
      },
      {
        label: "Shop cartridges",
        path: "/products/cartridge",
        description: "View compatible replacement cartridges.",
      },
    ],
  },
};

export function getProductSeoContent(product: Product): ProductSeoContent {
  return (
    productSeoContent[product.slug] ?? {
      metaDescription: product.description,
      overview: [
        product.description,
        `Explore ${product.name} as part of the ZXG Wellness ${product.category.toLowerCase()} collection.`,
      ],
      faqs: [
        {
          question: `What is ${product.name}?`,
          answer: product.description,
        },
        {
          question: "Where can I find related ZXG products?",
          answer: "Browse the ZXG Wellness collection to compare related products and accessories.",
        },
      ],
      internalLinks: [
        {
          label: "Browse all products",
          path: "/products",
          description: "Explore the full ZXG Wellness collection.",
        },
      ],
    }
  );
}
