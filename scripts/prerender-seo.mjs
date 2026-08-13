import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const outputDirectory = join(process.cwd(), "dist", "vercel");
const siteUrl = "https://www.gxzhealthandwellness.com";
const siteName = "GXZ Health and Wellness";
const defaultImage = `${siteUrl}/og/gxz-health-and-wellness.png`;
const merchantReturnPolicy = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "US",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 30,
  merchantReturnLink: `${siteUrl}/returns`,
};
const googleVerification = String(process.env.VITE_GOOGLE_SITE_VERIFICATION ?? "").trim();
const socialProfiles = [
  process.env.VITE_INSTAGRAM_URL,
  process.env.VITE_FACEBOOK_URL,
  process.env.VITE_TIKTOK_URL,
]
  .map((value) => String(value ?? "").trim())
  .filter(Boolean);

const products = [
  {
    path: "/products/pen",
    title: "GXZ Health and Wellness Reusable Injection Pen",
    description:
      "Shop the GXZ Health and Wellness reusable peptide injection pen with a durable metal body, color options, 3mL cartridge compatibility, and adjustable dial.",
    price: "20.00",
  },
  {
    path: "/products/syringe",
    title: "GXZ Health and Wellness Syringe",
    description:
      "Shop GXZ Health and Wellness sterile syringes in multiple size options, packaged for precise handling and convenient wellness accessory use.",
    price: "15.00",
  },
  {
    path: "/products/cartridge",
    title: "GXZ Health and Wellness Disposable 3mL Cartridges",
    description:
      "Shop GXZ Health and Wellness disposable 3mL cartridges, a 10-piece refill set designed for clean fit and consistent replacement with GXZ reusable pens.",
    price: "10.00",
  },
  {
    path: "/products/needles",
    title: "GXZ Health and Wellness Single-Use Pen Needles",
    description:
      "Shop GXZ Health and Wellness single-use pen needles in 100-count boxes with ultra-fine options for compatible reusable pen accessories.",
    price: "10.00",
  },
  {
    path: "/products/creatine",
    title: "GXZ Health and Wellness Creatine Performance Matrix Powder",
    description:
      "Shop GXZ Health and Wellness Creatine Performance Matrix Powder for a clean daily performance routine supporting training strength, endurance, and recovery.",
    price: "29.99",
  },
  {
    path: "/products/body-balm",
    title: "GXZ Health and Wellness Nourishing Body Balm",
    description:
      "Shop GXZ Health and Wellness Nourishing Body Balm, a recovery-focused skin treatment with cocoa butter, shea butter, and squalane for daily moisture.",
    price: "16.99",
  },
];

const articles = [
  {
    path: "/blog/creatine-strength-recovery-daily-routine",
    title: "Creatine for Strength and Recovery: A Practical Daily Routine",
    description:
      "Learn how creatine fits into a consistent performance routine, including timing, hydration, recovery habits, and smart ways to stay consistent.",
    datePublished: "2026-06-29",
    dateModified: "2026-06-29",
  },
  {
    path: "/blog/post-workout-recovery-routine-skin-hydration-rest",
    title: "A Better Post-Workout Recovery Routine: Skin, Hydration, and Rest",
    description:
      "Build a calmer recovery routine after training with hydration, skin care, mobility, rest, and simple wellness habits that are easy to repeat.",
    datePublished: "2026-06-29",
    dateModified: "2026-06-29",
  },
  {
    path: "/blog/reusable-pen-cartridge-needle-setup-guide",
    title: "Reusable Peptide Pen Setup Guide: Cartridges and Pen Needles Explained",
    description:
      "Compare a reusable peptide injection pen, disposable 3mL cartridges, and single-use pen needles so you can shop GXZ accessories with confidence.",
    datePublished: "2026-06-29",
    dateModified: "2026-07-25",
  },
  {
    path: "/blog/hydration-products-water-electrolytes-guide",
    title: "Hydration Products Explained: Water, Electrolytes, and When They Help",
    description:
      "Learn how to choose hydration products with confidence, including when plain water is enough, when electrolytes may help, and what to check on product labels.",
    datePublished: "2026-07-01",
    dateModified: "2026-07-01",
  },
];

const staticRoutes = [
  {
    path: "/",
    title: "Reusable Peptide Pens & Wellness Products",
    description:
      "Shop GXZ Health and Wellness reusable peptide injection pens, 3mL cartridges, pen needles, creatine, hydration, and premium recovery products.",
  },
  {
    path: "/products",
    title: "Wellness Products & Reusable Pen Accessories",
    description:
      "Explore the GXZ Health and Wellness collection of creatine, recovery skincare, reusable pens, cartridges, needles, and accessories.",
  },
  {
    path: "/blog",
    title: "GXZ Health and Wellness Journal",
    description:
      "Read GXZ Health and Wellness articles on creatine, recovery routines, wellness habits, reusable pens, cartridges, and accessories.",
  },
  {
    path: "/about",
    title: "About GXZ Health and Wellness",
    description:
      "Learn the GXZ Health and Wellness story, our approach to premium wellness products, and our commitment to considered daily care.",
  },
  {
    path: "/contact",
    title: "Contact GXZ Health and Wellness",
    description:
      "Contact GXZ Health and Wellness customer care for order, shipping, product, and return questions.",
  },
  {
    path: "/returns",
    title: "Returns & Refunds",
    description:
      "Read the GXZ Health and Wellness return, refund, damaged item, cancellation, and customer care policy before ordering.",
  },
  {
    path: "/how-to-use",
    title: "How to Use GXZ Health and Wellness Accessories",
    description:
      "Review GXZ Health and Wellness setup videos, pen guidance, cartridge steps, needle attachment tips, and accessory handling resources.",
  },
  {
    path: "/reusable-pen-difference",
    title: "Reusable Pen Comparison",
    description:
      "Compare reusable pens, refill cartridges, single-use pen needles, and compatible accessory options from GXZ Health and Wellness.",
  },
  {
    path: "/blog/authors/zxg-wellness-editorial-team",
    title: "GXZ Health and Wellness Editorial Team",
    description:
      "Meet the GXZ Health and Wellness editorial team behind practical product, recovery, hydration, and reusable-pen education.",
  },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fullTitle(title) {
  return title.includes(siteName) ? title : `${title} — ${siteName}`;
}

function schemaFor(route) {
  const url = `${siteUrl}${route.path === "/" ? "" : route.path}`;

  if ("price" in route) {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: route.title,
      description: route.description,
      image: defaultImage,
      brand: { "@type": "Brand", name: siteName },
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "USD",
        price: route.price,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        hasMerchantReturnPolicy: merchantReturnPolicy,
      },
    };
  }

  if ("datePublished" in route) {
    const datePublished = `${route.datePublished}T00:00:00Z`;
    const dateModified = `${route.dateModified}T00:00:00Z`;

    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: route.title,
      description: route.description,
      datePublished,
      dateModified,
      mainEntityOfPage: url,
      image: defaultImage,
      author: { "@type": "Organization", name: "GXZ Health and Wellness Editorial Team" },
      publisher: { "@type": "Organization", name: siteName },
    };
  }

  if (route.path === "/") {
    return [
      {
        "@context": "https://schema.org",
        "@type": "OnlineStore",
        name: siteName,
        url: siteUrl,
        logo: `${siteUrl}/android-chrome-512x512.png`,
        email: "g@zxgwellness.com",
        ...(socialProfiles.length > 0 ? { sameAs: socialProfiles } : {}),
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
      },
    ];
  }

  return null;
}

function render(baseHtml, route) {
  const title = fullTitle(route.title);
  const canonical = `${siteUrl}${route.path === "/" ? "" : route.path}`;
  const schema = schemaFor(route);
  const tags = [
    `<link data-rh="true" rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta data-rh="true" property="og:site_name" content="${siteName}" />`,
    `<meta data-rh="true" property="og:type" content="${"datePublished" in route ? "article" : "website"}" />`,
    `<meta data-rh="true" property="og:title" content="${escapeHtml(title)}" />`,
    `<meta data-rh="true" property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta data-rh="true" property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta data-rh="true" property="og:image" content="${defaultImage}" />`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-rh="true" name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta data-rh="true" name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `<meta data-rh="true" name="twitter:image" content="${defaultImage}" />`,
    googleVerification
      ? `<meta name="google-site-verification" content="${escapeHtml(googleVerification)}" />`
      : "",
    schema
      ? `<script data-rh="true" data-prerendered-jsonld="true" type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`
      : "",
  ]
    .filter(Boolean)
    .join("\n    ");

  const fallback = `<main data-prerendered-seo style="max-width:72rem;margin:0 auto;padding:6rem 1.5rem;color:#f5f2e8;background:#050505"><h1>${escapeHtml(route.title)}</h1><p>${escapeHtml(route.description)}</p></main>`;

  return baseHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta data-rh="true" name="description" content="${escapeHtml(route.description)}" />`,
    )
    .replace("</head>", `    ${tags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
}

const builtHtml = await readFile(join(outputDirectory, "index.html"), "utf8");
const baseHtml = builtHtml
  .replace(/\s*<(?:meta|link)\s+data-rh="true"[^>]*\/?>/gi, "")
  .replace(/\s*<script\s+data-rh="true"\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "")
  .replace(/<div id="root">[\s\S]*?<\/main><\/div>/i, '<div id="root"></div>');
const routes = [...staticRoutes, ...products, ...articles];

for (const route of routes) {
  const html = render(baseHtml, route);
  if (route.path === "/") {
    await writeFile(join(outputDirectory, "index.html"), html, "utf8");
    continue;
  }

  const cleanPath = route.path.slice(1);
  const extensionPath = join(outputDirectory, `${cleanPath}.html`);
  const directoryPath = join(outputDirectory, cleanPath, "index.html");
  await mkdir(dirname(extensionPath), { recursive: true });
  await mkdir(dirname(directoryPath), { recursive: true });
  await Promise.all([
    writeFile(extensionPath, html, "utf8"),
    writeFile(directoryPath, html, "utf8"),
  ]);
}

process.stdout.write(`Prerendered SEO HTML for ${routes.length} public routes.\n`);
