import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const siteUrl = String(
  process.env.SITE_URL || process.env.VITE_SITE_URL || "https://www.zxgwellness.com",
).replace(/\/+$/, "");
const defaultLastmod = "2026-06-29";
const fallbackProductSlugs = ["pen", "syringe", "cartridge", "needles", "creatine", "body-balm"];
const blogRoutes = [
  "/blog/creatine-strength-recovery-daily-routine",
  "/blog/post-workout-recovery-routine-skin-hydration-rest",
  "/blog/reusable-pen-cartridge-needle-setup-guide",
  "/blog/hydration-products-water-electrolytes-guide",
  "/blog/authors/zxg-wellness-editorial-team",
];

const staticRoutes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/products", priority: "0.9", changefreq: "weekly" },
  { path: "/blog", priority: "0.8", changefreq: "weekly" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/returns", priority: "0.4", changefreq: "monthly" },
  { path: "/how-to-use", priority: "0.7", changefreq: "monthly" },
  { path: "/reusable-pen-difference", priority: "0.8", changefreq: "monthly" },
];

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const productRoutes = await getProductRoutes();
  const routes = [
    ...staticRoutes,
    ...productRoutes,
    ...blogRoutes.map((path) => ({
      path,
      priority: "0.7",
      changefreq: "weekly",
      lastmod: defaultLastmod,
    })),
  ];

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(renderSitemap(routes));
}

async function getProductRoutes() {
  const fallback = fallbackProductSlugs.map((slug) => ({
    path: `/products/${slug}`,
    priority: "0.8",
    changefreq: "weekly",
    lastmod: defaultLastmod,
  }));

  try {
    const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(
      ".supabase.com",
      ".supabase.co",
    );
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return fallback;

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("products")
      .select("slug, updated_at, created_at")
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (error || !Array.isArray(data) || data.length === 0) return fallback;

    return data
      .filter((product) => typeof product.slug === "string" && product.slug.trim())
      .map((product) => ({
        path: `/products/${product.slug}`,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: toDateOnly(product.updated_at || product.created_at) ?? defaultLastmod,
      }));
  } catch {
    return fallback;
  }
}

function renderSitemap(
  routes: Array<{ path: string; priority: string; changefreq: string; lastmod?: string }>,
) {
  const urls = routes
    .map(
      (route) => `  <url>
    <loc>${escapeXml(`${siteUrl}${route.path}`)}</loc>
    <lastmod>${route.lastmod ?? defaultLastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function toDateOnly(value: unknown) {
  const text = String(value ?? "");
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
