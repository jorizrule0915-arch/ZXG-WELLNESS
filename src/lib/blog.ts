import creatineImage from "@/assets/creatine-products/front-creatine.png";
import bodyBalmImage from "@/assets/body-balm/body-balm.png";
import penImage from "@/assets/reusable-pen-black.png";

const hydrationProductImage =
  "https://uppjyjifjffdqiyqvdgh.supabase.co/storage/v1/object/public/product-images/products/1780636260936-fc3d9bae-471e-4488-9f29-49c21d7dfb5b.png";

export type BlogCategory =
  | "Creatine"
  | "Recovery"
  | "Wellness"
  | "Hydration"
  | "Weight Management"
  | "Product Guides"
  | "Accessories";

export type BlogAuthor = {
  slug: string;
  name: string;
  role: string;
  credentials: string;
  bio: string;
  expertise: string[];
};

export type BlogArticle = {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  author: string;
  authorSlug: string;
  reviewedBy: string;
  reviewedAt: string;
  summaryAnswer: string;
  image: string;
  imageAlt: string;
  keywords: string[];
  takeaways: string[];
  intro: string[];
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
  faqs: Array<{ question: string; answer: string }>;
  references: Array<{ title: string; source: string; url: string }>;
  relatedLinks: Array<{ label: string; path: string; description: string }>;
};

export const blogCategories: BlogCategory[] = [
  "Creatine",
  "Recovery",
  "Wellness",
  "Hydration",
  "Weight Management",
  "Product Guides",
  "Accessories",
];

export const blogAuthors: BlogAuthor[] = [
  {
    slug: "zxg-wellness-editorial-team",
    name: "ZXG Wellness Editorial Team",
    role: "Product education and wellness editorial team",
    credentials:
      "ZXG Wellness product research, customer education, and brand review. Articles are written for general education, use conservative wellness language, and reference external scientific or public-health sources where relevant.",
    bio: "The ZXG Wellness Editorial Team creates practical guides that help customers understand wellness routines, recovery habits, supplements, and product accessories before they buy. The team focuses on plain-language education, transparent sourcing, and clear safety notes rather than replacing professional medical advice.",
    expertise: [
      "Product education",
      "Creatine and supplement shopping guidance",
      "Recovery routine planning",
      "Reusable pen accessory education",
      "Customer support content",
    ],
  },
];

export const featuredArticleSlug = "creatine-strength-recovery-daily-routine";

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
    authorSlug: "zxg-wellness-editorial-team",
    reviewedBy: "ZXG Wellness Editorial Team",
    reviewedAt: "2026-06-29",
    summaryAnswer:
      "Creatine fits best as a consistent daily habit inside a broader routine that includes resistance training, hydration, food, sleep, and recovery.",
    image: creatineImage,
    imageAlt: "ZXG Wellness Creatine Performance Matrix Powder",
    keywords: [
      "creatine routine",
      "creatine recovery",
      "creatine for strength",
      "wellness supplements",
    ],
    takeaways: [
      "Consistency matters more than perfect timing for most everyday creatine routines.",
      "Creatine works best beside training, hydration, nutrition, and sleep habits.",
      "People with medical questions should ask a qualified healthcare professional before use.",
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
    references: [
      {
        title: "Dietary Supplements for Exercise and Athletic Performance",
        source: "NIH Office of Dietary Supplements",
        url: "https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-Consumer/",
      },
      {
        title:
          "International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine",
        source: "Journal of the International Society of Sports Nutrition / PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/28615996/",
      },
      {
        title: "Common questions and misconceptions about creatine supplementation",
        source: "Journal of the International Society of Sports Nutrition",
        url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-021-00412-w",
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
    authorSlug: "zxg-wellness-editorial-team",
    reviewedBy: "ZXG Wellness Editorial Team",
    reviewedAt: "2026-06-29",
    summaryAnswer:
      "A strong post-workout recovery routine is short, repeatable, and built around cooling down, rehydrating, caring for dry skin, eating appropriately, and getting enough rest.",
    image: bodyBalmImage,
    imageAlt: "ZXG Wellness Nourishing Body Balm",
    keywords: [
      "post workout recovery routine",
      "recovery skincare",
      "hydration after training",
      "wellness recovery",
    ],
    takeaways: [
      "Recovery routines work best when they are short enough to repeat consistently.",
      "Hydration, nutrition, skin care, and rest all support the post-workout reset.",
      "Persistent pain, swelling, or unusual symptoms should be discussed with a professional.",
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
    references: [
      {
        title: "Dietary Supplements for Exercise and Athletic Performance",
        source: "NIH Office of Dietary Supplements",
        url: "https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-Consumer/",
      },
      {
        title: "Dermatologists' top tips for relieving dry skin",
        source: "American Academy of Dermatology",
        url: "https://www.aad.org/public/everyday-care/skin-care-basics/dry/dermatologists-tips-relieve-dry-skin",
      },
      {
        title: "Dry skin self-care",
        source: "MedlinePlus Medical Encyclopedia",
        url: "https://medlineplus.gov/ency/patientinstructions/000751.htm",
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
    authorSlug: "zxg-wellness-editorial-team",
    reviewedBy: "ZXG Wellness Editorial Team",
    reviewedAt: "2026-06-29",
    summaryAnswer:
      "A reusable pen setup is easiest to understand as a system: the reusable pen body, compatible cartridges, and single-use pen needles each serve a different role.",
    image: penImage,
    imageAlt: "ZXG Wellness reusable injection pen accessory",
    keywords: [
      "reusable injection pen",
      "pen cartridges",
      "single use pen needles",
      "wellness accessories",
    ],
    takeaways: [
      "Think in systems: pen body, cartridge, and single-use needle accessory.",
      "Do not reuse single-use accessories.",
      "Used sharps should be handled and disposed of safely according to local guidance.",
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
    references: [
      {
        title: "Safely using sharps, needles, and syringes at home, at work, and on travel",
        source: "U.S. Food and Drug Administration",
        url: "https://www.fda.gov/medical-devices/consumer-products/safely-using-sharps-needles-and-syringes-home-work-and-travel",
      },
      {
        title: "Best way to get rid of used needles and other sharps",
        source: "U.S. Food and Drug Administration",
        url: "https://www.fda.gov/medical-devices/safely-using-sharps-needles-and-syringes-home-work-and-travel/best-way-get-rid-used-needles-and-other-sharps",
      },
      {
        title: "Sharps disposal containers",
        source: "U.S. Food and Drug Administration",
        url: "https://www.fda.gov/medical-devices/safely-using-sharps-needles-and-syringes-home-work-and-travel/sharps-disposal-containers",
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
  {
    slug: "hydration-products-water-electrolytes-guide",
    title: "Hydration Products Explained: Water, Electrolytes, and When They Help",
    description:
      "Learn how to choose hydration products with confidence, including when plain water is enough, when electrolytes may help, and what to check on product labels.",
    category: "Hydration",
    publishedAt: "2026-07-01",
    updatedAt: "2026-07-01",
    readingTime: "9 min read",
    author: "ZXG Wellness Editorial Team",
    authorSlug: "zxg-wellness-editorial-team",
    reviewedBy: "ZXG Wellness Editorial Team",
    reviewedAt: "2026-07-01",
    summaryAnswer:
      "Most people can support daily hydration with water and regular meals, while electrolyte or sports-drink products may be useful during heavy sweating, prolonged exercise, heat exposure, or fluid loss from illness.",
    image: hydrationProductImage,
    imageAlt: "GXZ Health Hydration electrolyte and amino formula packets",
    keywords: [
      "hydration products",
      "electrolyte drinks",
      "water and hydration",
      "sports drinks",
      "hydration for recovery",
    ],
    takeaways: [
      "Water is usually the best daily hydration choice for healthy everyday routines.",
      "Electrolyte products are most relevant when fluid and mineral losses are higher than normal.",
      "A good hydration product should match the situation, not replace meals, medical care, or common sense.",
    ],
    intro: [
      "Hydration products are everywhere: bottled water, electrolyte packets, sports drinks, flavored waters, recovery drinks, and powders that promise better energy or performance. The useful question is not which product sounds the most advanced. The useful question is what your body actually needs in the moment.",
      "For most everyday routines, plain water and balanced meals are enough. In situations with heavy sweating, long training sessions, hot weather, travel, vomiting, or diarrhea, a product that contains electrolytes may be more useful. This guide explains the difference in plain language so you can choose hydration support without falling for exaggerated claims.",
    ],
    sections: [
      {
        heading: "What hydration products actually do",
        paragraphs: [
          "Hydration products are designed to help replace fluid, and some also provide electrolytes such as sodium, potassium, chloride, magnesium, or calcium. Electrolytes are minerals that help the body maintain fluid balance, nerve signaling, and muscle function.",
          "A product does not need to be complicated to be useful. Water replaces fluid. Electrolyte drinks can help replace fluid plus minerals lost through sweat or illness. Sports drinks may also contain carbohydrates, which can be useful for longer or more intense activity but may be unnecessary for everyday sipping.",
        ],
        bullets: [
          "Water: best default option for daily hydration",
          "Electrolyte drinks: useful when mineral losses are higher",
          "Sports drinks: fluid, electrolytes, and often sugar for longer activity",
          "Oral rehydration solutions: used for specific dehydration situations and illness-related fluid loss",
        ],
      },
      {
        heading: "Why hydration matters for daily wellness",
        paragraphs: [
          "The CDC explains that getting enough water every day helps prevent dehydration, which can affect thinking, mood, body temperature regulation, digestion, and kidney-stone risk. Hydration is not only a workout topic. It is part of normal daily function.",
          "NIH News in Health also emphasizes getting fluids mainly from water or other low-calorie beverages. Sugary drinks can add calories quickly, so they are not the best everyday foundation for hydration unless there is a specific activity or recovery reason to use them.",
        ],
      },
      {
        heading: "When plain water is usually enough",
        paragraphs: [
          "For everyday work, light activity, short walks, normal meals, and casual hydration, water is usually enough. Many people also get fluid from foods, coffee or tea, milk or milk alternatives, soups, fruits, and vegetables.",
          "A practical routine is simple: drink steadily through the day, pay attention to thirst, and increase fluids when heat, training, travel, or sweat makes fluid loss higher. The goal is consistency rather than forcing extreme amounts of water at once.",
        ],
        bullets: [
          "Keep water visible during work or errands",
          "Drink before, during, and after workouts when needed",
          "Use low-calorie drinks if plain water is hard to repeat",
          "Avoid relying on sugary drinks as your main daily fluid source",
        ],
      },
      {
        heading: "When electrolytes may be useful",
        paragraphs: [
          "Electrolyte products can make sense when fluid loss is higher than normal. Examples include long or intense exercise, hot or humid conditions, heavy sweating, or illness-related fluid loss. MedlinePlus notes that water or sports drinks with electrolytes may be used for dehydration, while more serious dehydration needs medical care.",
          "Exercise hydration guidance from the American College of Sports Medicine focuses on replacing fluid losses around physical activity. The exact amount varies by sweat rate, heat, body size, training duration, and personal tolerance, so one universal serving size will not fit everyone.",
        ],
        bullets: [
          "Long or intense workouts",
          "Training in hot or humid weather",
          "Heavy sweating at work or during sport",
          "Fluid loss from vomiting or diarrhea",
        ],
      },
      {
        heading: "How to read a hydration product label",
        paragraphs: [
          "A hydration product label should help you understand what you are getting. Check the serving size first, then look at sodium, potassium, sugar, calories, caffeine, and any added stimulants or herbal ingredients. More ingredients do not automatically mean better hydration.",
          "Sodium is often the main electrolyte included for sweat replacement, but people with blood pressure concerns, kidney disease, heart conditions, medication questions, or sodium restrictions should ask a healthcare professional before using electrolyte products regularly.",
        ],
        bullets: [
          "Serving size: how many scoops, packets, or bottles count as one serving",
          "Sodium and potassium: the main electrolyte details to review",
          "Sugar and calories: useful for long activity, unnecessary for many casual uses",
          "Caffeine or stimulants: not always appropriate for hydration-focused products",
        ],
      },
      {
        heading: "Hydration and creatine routines",
        paragraphs: [
          "Creatine routines work best when they are built around consistent training, meals, recovery, and hydration. That does not mean everyone taking creatine needs a special electrolyte product every day. It means hydration should not be ignored while building a performance routine.",
          "If you use creatine, the practical approach is to keep water intake steady, drink around workouts, and pay attention to how your body responds in heat or during higher sweat sessions. If you have kidney-health concerns, medication questions, or personal medical conditions, ask a qualified professional before using supplements.",
        ],
      },
      {
        heading: "Signs a hydration issue needs more attention",
        paragraphs: [
          "Mild dehydration may improve with fluids, but severe symptoms should not be managed with a product alone. MedlinePlus lists dehydration warning signs such as dry mouth, decreased urination, dark urine, dizziness, confusion, and rapid heartbeat depending on severity.",
          "Seek medical help for severe dehydration symptoms, fainting, confusion, inability to keep fluids down, heat illness concerns, or dehydration in infants, older adults, or anyone with significant medical risk. Hydration products are tools, not emergency treatment.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need an electrolyte drink every day?",
        answer:
          "Most healthy people do not need an electrolyte drink every day. Water and regular meals are usually enough unless sweat, heat, long exercise, illness, or a medical situation changes fluid and electrolyte needs.",
      },
      {
        question: "Are sports drinks better than water?",
        answer:
          "Not always. Water is usually best for daily hydration and light activity. Sports drinks may be useful for longer or more intense activity because they can provide fluid, electrolytes, and carbohydrates.",
      },
      {
        question: "What should I look for in a hydration product?",
        answer:
          "Start with serving size, sodium, potassium, sugar, calories, caffeine, and added ingredients. Choose the product based on the situation rather than assuming the most complex formula is best.",
      },
      {
        question: "Can hydration products replace medical care for dehydration?",
        answer:
          "No. Mild dehydration may improve with fluids, but severe dehydration, confusion, fainting, inability to keep fluids down, or heat illness symptoms need medical attention.",
      },
      {
        question: "Does creatine require a special hydration drink?",
        answer:
          "Not necessarily. Creatine routines should include steady hydration, but most people can start with water and normal meals unless training, heat, sweat, or personal needs make electrolytes useful.",
      },
    ],
    references: [
      {
        title: "About Water and Healthier Drinks",
        source: "Centers for Disease Control and Prevention",
        url: "https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html",
      },
      {
        title: "Hydrating for Health",
        source: "NIH News in Health",
        url: "https://newsinhealth.nih.gov/2023/05/hydrating-health",
      },
      {
        title: "Dehydration",
        source: "MedlinePlus Medical Encyclopedia",
        url: "https://medlineplus.gov/ency/article/000982.htm",
      },
      {
        title: "Fluid and Electrolyte Balance",
        source: "MedlinePlus",
        url: "https://medlineplus.gov/fluidandelectrolytebalance.html",
      },
      {
        title: "American College of Sports Medicine position stand: Exercise and fluid replacement",
        source: "Medicine & Science in Sports & Exercise / PubMed",
        url: "https://pubmed.ncbi.nlm.nih.gov/17277604/",
      },
      {
        title: "Hydration to Maximize Performance and Recovery",
        source: "Nutrients / PubMed Central",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8336541/",
      },
    ],
    relatedLinks: [
      {
        label: "Creatine routine guide",
        path: "/blog/creatine-strength-recovery-daily-routine",
        description: "See how hydration fits into a consistent creatine and training routine.",
      },
      {
        label: "Recovery routine guide",
        path: "/blog/post-workout-recovery-routine-skin-hydration-rest",
        description:
          "Build a repeatable post-workout routine around hydration, skin care, and rest.",
      },
      {
        label: "Shop ZXG Creatine",
        path: "/products/creatine",
        description: "Explore ZXG Wellness Creatine Performance Matrix Powder.",
      },
    ],
  },
];

export function getBlogArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug) ?? null;
}

export function getBlogAuthor(slug: string) {
  return blogAuthors.find((author) => author.slug === slug) ?? null;
}

export function getArticlesByAuthor(authorSlug: string) {
  return blogArticles.filter((article) => article.authorSlug === authorSlug);
}

export function getFeaturedBlogArticle() {
  return getBlogArticle(featuredArticleSlug) ?? blogArticles[0] ?? null;
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

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function getArticleToc(article: BlogArticle) {
  return article.sections.map((section) => ({
    id: slugifyHeading(section.heading),
    label: section.heading,
  }));
}

export function formatBlogDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}
