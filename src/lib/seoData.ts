export const siteName = "ZXG Wellness";
export const siteUrl = "https://www.zxgwellness.com";
export const defaultSeoDescription =
  "Premium wellness essentials from ZXG Wellness, including creatine, recovery care, reusable pens, cartridges, and accessories.";
export const defaultOgImage = "/Creatine Products/front Creatine.png";

export function absoluteUrl(path: string) {
  if (!path) return siteUrl;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return new URL(path.startsWith("/") ? path : `/${path}`, siteUrl).toString();
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    email: "g@zxgwellness.com",
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
