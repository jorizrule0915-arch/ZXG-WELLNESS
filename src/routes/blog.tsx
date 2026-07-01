import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarDays, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  blogArticles,
  blogCategories,
  formatBlogDate,
  getFeaturedBlogArticle,
  type BlogArticle,
  type BlogCategory,
} from "@/lib/blog";
import { JsonLd, Seo } from "@/lib/seo";
import { absoluteUrl, breadcrumbSchema } from "@/lib/seoData";

export const Route = createFileRoute("/blog")({ component: BlogPage });

function BlogPage() {
  const matchRoute = useMatchRoute();
  const isNestedBlogPage =
    matchRoute({ to: "/blog/$slug", fuzzy: true }) ||
    matchRoute({ to: "/blog/authors/$slug", fuzzy: true });
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "All">("All");
  const featuredArticle = getFeaturedBlogArticle();
  const referenceCount = blogArticles.reduce(
    (total, article) => total + article.references.length,
    0,
  );
  const categoryCounts = blogCategories.map((category) => ({
    category,
    count: blogArticles.filter((article) => article.category === category).length,
  }));
  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return blogArticles.filter((article) => {
      const matchesCategory = activeCategory === "All" || article.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        [
          article.title,
          article.description,
          article.category,
          article.summaryAnswer,
          ...article.keywords,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  if (isNestedBlogPage) return <Outlet />;

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

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16 lg:px-10">
        <section className="relative overflow-hidden border border-gold/15 bg-charcoal">
          <div className="absolute right-0 top-0 h-48 w-48 bg-gold/10 blur-3xl" />
          <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 border border-gold/20 bg-gold/10 px-3 py-2 text-xs font-medium uppercase tracking-wide-2 text-gold">
                <Sparkles className="h-4 w-4" />
                ZXG Wellness Journal
              </div>
              <h1 className="mt-5 max-w-2xl font-display text-3xl leading-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
                Clear wellness guides for smarter product choices.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                Read practical articles on hydration, creatine, recovery, wellness routines, and ZXG
                product education before you shop.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="inline-flex min-h-11 items-center justify-center bg-gold px-5 py-2 text-sm font-medium text-obsidian transition-colors hover:bg-gold-light"
                >
                  Shop products
                </Link>
                <a
                  href="#latest-guides"
                  className="inline-flex min-h-11 items-center justify-center border border-gold/25 px-5 py-2 text-sm text-gold transition-colors hover:border-gold hover:bg-gold/10"
                >
                  Read guides
                </a>
              </div>
            </div>

            <aside className="border border-gold/10 bg-obsidian/60 p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-luxury text-gold">
                <ShieldCheck className="h-4 w-4" />
                Editorial standard
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Every guide is written for customer clarity, reviewed for brand accuracy, and
                supported with transparent references when medical or wellness claims are discussed.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gold/10 pt-5">
                <StatBlock label="Guides" value={blogArticles.length} />
                <StatBlock label="Topics" value={blogCategories.length} />
                <StatBlock label="Sources" value={referenceCount} />
              </div>
            </aside>
          </div>
        </section>

        {featuredArticle && <FeaturedArticle article={featuredArticle} />}

        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-luxury text-gold">Browse by topic</div>
              <h2 className="mt-2 font-display text-2xl leading-tight text-foreground sm:text-3xl">
                Find the guide you need
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className={`w-fit border px-4 py-2 text-sm transition-colors ${
                activeCategory === "All"
                  ? "border-gold bg-gold text-obsidian"
                  : "border-gold/20 text-muted-foreground hover:border-gold hover:text-gold"
              }`}
            >
              View all guides
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoryCounts.map(({ category, count }) => (
              <TopicCard
                key={category}
                category={category}
                count={count}
                active={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              />
            ))}
          </div>
        </section>

        <section id="latest-guides" className="mt-12 scroll-mt-24">
          <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="text-xs uppercase tracking-luxury text-gold">Latest guides</div>
              <h2 className="mt-2 font-display text-2xl leading-tight text-foreground sm:text-3xl">
                Helpful reading before checkout
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Search by product, wellness goal, or customer question. Each article includes FAQs,
                product links, and source references where needed.
              </p>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-luxury text-gold">
                Search journal
              </span>
              <span className="flex items-center gap-3 border border-gold/20 bg-obsidian px-4 py-3 transition-colors focus-within:border-gold">
                <Search className="h-4 w-4 text-gold" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search creatine, recovery, hydration..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </span>
            </label>
          </div>

          <div className="mb-6 flex flex-col gap-3 border-y border-gold/10 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredArticles.length}</span>{" "}
              guide{filteredArticles.length === 1 ? "" : "s"}
              {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            </span>
            {(activeCategory !== "All" || query.trim()) && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All");
                  setQuery("");
                }}
                className="w-fit text-sm text-gold transition-colors hover:text-gold-light"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredArticles.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <div className="border border-gold/15 bg-charcoal p-8 text-sm leading-7 text-muted-foreground">
              No articles match that search yet. Try another topic or clear the category filter.
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-lg font-medium text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function FeaturedArticle({ article }: { article: BlogArticle }) {
  return (
    <section className="surface-glow-panel mt-10 overflow-hidden border border-gold/20">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-8">
          <div className="inline-flex w-fit items-center gap-2 border border-gold/20 bg-gold/10 px-3 py-2 text-xs uppercase tracking-wide-2 text-gold">
            <BookOpen className="h-4 w-4" />
            Featured guide
          </div>
          <h2 className="mt-5 max-w-2xl font-display text-2xl leading-tight text-foreground md:text-3xl">
            {article.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            {article.summaryAnswer}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 text-gold">
              <BookOpen className="h-4 w-4" />
              {article.category}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gold" />
              Updated {formatBlogDate(article.updatedAt)}
            </span>
            <span>{article.readingTime}</span>
          </div>
          <Link
            to="/blog/$slug"
            params={{ slug: article.slug }}
            className="mt-6 inline-flex w-fit min-h-11 items-center justify-center gap-2 bg-gold px-5 py-2 text-sm font-medium text-obsidian transition-colors hover:bg-gold-light"
          >
            Read featured article
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="border-t border-gold/10 bg-obsidian/70 lg:border-l lg:border-t-0">
          <img
            src={article.image}
            alt={article.imageAlt}
            className="aspect-[4/3] h-full w-full object-contain p-5 sm:p-8"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

function TopicCard({
  active,
  category,
  count,
  onClick,
}: {
  active: boolean;
  category: BlogCategory;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-32 border p-5 text-left transition-colors ${
        active ? "border-gold bg-gold/10" : "border-gold/10 bg-charcoal hover:border-gold/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-foreground">{category}</div>
        <span className="border border-gold/20 px-2 py-1 text-xs text-gold">{count}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {count > 0
          ? `${count} guide${count === 1 ? "" : "s"} covering customer questions in this topic.`
          : "Planned topic cluster for future education."}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm text-gold transition-transform group-hover:translate-x-1">
        Browse topic
        <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
}

function ArticleCard({ article }: { article: BlogArticle }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden border border-gold/15 bg-charcoal transition-colors hover:border-gold/45">
      <Link to="/blog/$slug" params={{ slug: article.slug }} className="block">
        <div className="aspect-[4/3] overflow-hidden border-b border-gold/10 bg-obsidian/70">
          <img
            src={article.image}
            alt={article.imageAlt}
            className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105 sm:p-7"
            loading="lazy"
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="border border-gold/20 bg-gold/10 px-2.5 py-1 text-gold">
            {article.category}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-gold" />
            <time dateTime={article.publishedAt}>{formatBlogDate(article.publishedAt)}</time>
          </span>
        </div>
        <h3 className="mt-4 text-lg font-medium leading-7 text-foreground md:text-xl">
          <Link
            to="/blog/$slug"
            params={{ slug: article.slug }}
            className="transition-colors hover:text-gold"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{article.description}</p>
        <div className="mt-5 flex flex-wrap gap-3 border-t border-gold/10 pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-gold" />
            {article.readingTime}
          </span>
          <span>
            {article.references.length} source{article.references.length === 1 ? "" : "s"}
          </span>
        </div>
        <Link
          to="/blog/$slug"
          params={{ slug: article.slug }}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 border border-gold/30 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-obsidian"
        >
          Read guide
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
