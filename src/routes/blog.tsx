import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { blogArticles, formatBlogDate } from "@/lib/blog";
import { JsonLd, Seo } from "@/lib/seo";
import { absoluteUrl, breadcrumbSchema } from "@/lib/seoData";

export const Route = createFileRoute("/blog")({ component: BlogPage });

function BlogPage() {
  const matchRoute = useMatchRoute();
  const isArticle = matchRoute({ to: "/blog/$slug", fuzzy: true });

  if (isArticle) return <Outlet />;

  return (
    <>
      <Seo
        title="Wellness Journal"
        description="Read ZXG Wellness articles on creatine, recovery routines, wellness habits, reusable pens, cartridges, and accessories."
        path="/blog"
      />
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "ZXG Wellness Journal",
            url: absoluteUrl("/blog"),
            blogPost: blogArticles.map((article) => ({
              "@type": "BlogPosting",
              headline: article.title,
              description: article.description,
              url: absoluteUrl(`/blog/${article.slug}`),
              datePublished: article.publishedAt,
              dateModified: article.updatedAt,
              author: {
                "@type": "Organization",
                name: article.author,
              },
            })),
          },
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-10">
        <section className="grid gap-10 border border-gold/15 bg-charcoal p-5 sm:p-8 lg:grid-cols-[1fr_360px] lg:p-10">
          <div>
            <div className="mb-4 text-sm font-medium text-gold">ZXG Wellness Journal</div>
            <h1 className="font-display text-4xl leading-tight md:text-6xl">
              Build topical <span className="text-gradient-gold italic">authority</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              Practical, edited articles around creatine, recovery, wellness, and ZXG accessory
              education. Each article is written to help customers understand the products before
              they buy.
            </p>
          </div>

          <aside className="border border-gold/10 bg-obsidian/60 p-5">
            <div className="text-xs uppercase tracking-luxury text-gold">Publishing cadence</div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Publish 2–3 helpful articles each week. Draft with Somnus AI, then edit for accuracy,
              brand voice, product links, and customer clarity before going live.
            </p>
          </aside>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {["Creatine", "Recovery", "Accessories"].map((topic) => (
            <div key={topic} className="border border-gold/10 bg-charcoal p-5">
              <div className="text-sm font-medium text-gold">{topic}</div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Helpful articles that answer search intent and connect readers to relevant ZXG
                products.
              </p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-luxury text-gold">Latest Articles</div>
              <h2 className="mt-2 font-display text-3xl">Educational buying guides</h2>
            </div>
            <div className="text-sm text-muted-foreground">{blogArticles.length} published</div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {blogArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function ArticleCard({ article }: { article: (typeof blogArticles)[number] }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden border border-gold/15 bg-charcoal">
      <Link to="/blog/$slug" params={{ slug: article.slug }} className="block">
        <div className="aspect-[4/3] overflow-hidden border-b border-gold/10 bg-obsidian">
          <img
            src={article.image}
            alt={article.imageAlt}
            className="h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="text-gold">{article.category}</span>
          <span>•</span>
          <time dateTime={article.publishedAt}>{formatBlogDate(article.publishedAt)}</time>
          <span>•</span>
          <span>{article.readingTime}</span>
        </div>
        <h3 className="mt-4 text-xl font-medium leading-7 text-foreground">
          <Link
            to="/blog/$slug"
            params={{ slug: article.slug }}
            className="transition-colors hover:text-gold"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{article.description}</p>
        <Link
          to="/blog/$slug"
          params={{ slug: article.slug }}
          className="mt-5 inline-flex min-h-11 items-center justify-center border border-gold/30 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-obsidian"
        >
          Read article
        </Link>
      </div>
    </article>
  );
}
