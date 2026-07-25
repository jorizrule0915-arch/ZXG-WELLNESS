export const siteName = "ZXG Wellness";
export const siteUrl = "https://www.zxgwellness.com";
export const defaultSeoDescription =
  "Shop ZXG Wellness reusable peptide injection pens, 3mL cartridges, pen needles, creatine, hydration, and premium recovery products.";
export const defaultOgImage = "/og/zxg-wellness-products.webp";

export function absoluteUrl(path: string) {
  if (!path) return siteUrl;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return new URL(path.startsWith("/") ? path : `/${path}`, siteUrl).toString();
}

export function organizationSchema() {
  const sameAs = [
    import.meta.env.VITE_INSTAGRAM_URL,
    import.meta.env.VITE_FACEBOOK_URL,
    import.meta.env.VITE_TIKTOK_URL,
  ].filter((url): url is string => Boolean(url));

  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl("/android-chrome-512x512.png"),
    email: "g@zxgwellness.com",
    ...(sameAs.length > 0 ? { sameAs } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "g@zxgwellness.com",
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
