import { Helmet } from "react-helmet-async";
import type { ReactNode } from "react";
import { absoluteUrl, defaultOgImage, defaultSeoDescription, siteName } from "@/lib/seoData";

type SeoProps = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
  children?: ReactNode;
};

export function Seo({
  title,
  description = defaultSeoDescription,
  path = "/",
  image = defaultOgImage,
  type = "website",
  noIndex = false,
  children,
}: SeoProps) {
  const fullTitle = title.includes(siteName) ? title : `${title} — ${siteName}`;
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const robots = noIndex ? "noindex,nofollow" : "index,follow";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {children}
    </Helmet>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}
