import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  formatBlogDate,
  getBlogArticle,
  getRelatedBlogArticles,
  type BlogArticle,
} from "@/lib/blog";
import { JsonLd, Seo } from "@/lib/seo";
import { absoluteUrl, breadcrumbSchema, faqSchema } from "@/lib/seoData";

export const Route = createFileRoute("/blog/$slug")({ component: BlogArticlePage });

function BlogArticlePage() {
  const { slug } = useParams({ from: "/blog/$slug" });
  const article = getBlogArticle(slug);

  if (!article) return <ArticleNotFound />;

  const relatedArticles = getRelatedBlogArticles(article.slug, article.category);
  const articlePath = `/blog/${article.slug}`;

  return (
    <>
      <Seo
        title={article.title}
        description={article.description}
        path={articlePath}
        image={article.image}
        type="article"
      />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: article.title,
            description: article.description,
            image: [absoluteUrl(article.image)],
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            author: {
              "@type": "Organization",
              name: article.author,
            },
            publisher: {
              "@type": "Organization",
              name: "ZXG Wellness",
            },
            mainEntityOfPage: absoluteUrl(articlePath),
            keywords: article.keywords.join(", "),
          },
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: article.title, path: articlePath },
          ]),
          faqSchema(article.faqs),
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-16 lg:px-10">
        <Link
          to="/blog"
          className="text-sm text-muted-foreground transition-colors hover:text-gold"
        >
          ← Back to Journal
        </Link>

        <article className="mt-8">
          <header className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
            <div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="text-gold">{article.category}</span>
                <span>•</span>
                <time dateTime={article.publishedAt}>{formatBlogDate(article.publishedAt)}</time>
                <span>•</span>
                <span>{article.readingTime}</span>
              </div>
              <h1 className="mt-5 font-display text-4xl leading-tight md:text-6xl">
                {article.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
                {article.description}
              </p>
              <div className="mt-6 text-sm text-muted-foreground">By {article.author}</div>
            </div>

            <div className="overflow-hidden border border-gold/15 bg-charcoal">
              <img
                src={article.image}
                alt={article.imageAlt}
                className="aspect-[4/3] h-full w-full object-contain p-8"
              />
            </div>
          </header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-10">
              <section className="space-y-5 border border-gold/15 bg-charcoal p-5 sm:p-7">
                {article.intro.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-8 text-foreground/85">
                    {paragraph}
                  </p>
                ))}
              </section>

              {article.sections.map((section) => (
                <section key={section.heading} className="min-w-0">
                  <h2 className="font-display text-3xl text-foreground">{section.heading}</h2>
                  <div className="mt-5 space-y-5">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-base leading-8 text-foreground/80">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.bullets && (
                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="border border-gold/10 bg-charcoal px-4 py-3 text-sm leading-6 text-foreground/80"
                        >
                          <span className="mr-2 text-gold">✓</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              <section className="border-t border-gold/10 pt-10">
                <div className="text-xs uppercase tracking-luxury text-gold">Article FAQ</div>
                <div className="mt-5 space-y-4">
                  {article.faqs.map((faq) => (
                    <article key={faq.question} className="border border-gold/15 bg-charcoal p-5">
                      <h2 className="text-base font-medium text-foreground">{faq.question}</h2>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="border border-gold/15 bg-gold/5 p-5 text-sm leading-7 text-muted-foreground">
                <strong className="font-medium text-foreground">Educational note:</strong> This
                article is for general product education and wellness planning. It is not medical
                advice. For personal medical, dosing, or treatment questions, speak with a qualified
                healthcare professional.
              </section>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <ArticleLinks article={article} />
              {relatedArticles.length > 0 && <RelatedArticles articles={relatedArticles} />}
            </aside>
          </div>
        </article>
      </main>
    </>
  );
}

function ArticleLinks({ article }: { article: BlogArticle }) {
  return (
    <section className="border border-gold/15 bg-charcoal p-5">
      <div className="text-xs uppercase tracking-luxury text-gold">Helpful links</div>
      <div className="mt-4 space-y-3">
        {article.relatedLinks.map((link) => (
          <a
            key={link.path}
            href={link.path}
            className="block border border-gold/10 bg-obsidian/60 p-4 transition-colors hover:border-gold/50"
          >
            <span className="block text-sm font-medium text-gold">{link.label}</span>
            <span className="mt-2 block text-sm leading-6 text-muted-foreground">
              {link.description}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function RelatedArticles({ articles }: { articles: BlogArticle[] }) {
  return (
    <section className="border border-gold/15 bg-charcoal p-5">
      <div className="text-xs uppercase tracking-luxury text-gold">Read next</div>
      <div className="mt-4 space-y-4">
        {articles.map((article) => (
          <Link
            key={article.slug}
            to="/blog/$slug"
            params={{ slug: article.slug }}
            className="block text-sm leading-6 text-foreground transition-colors hover:text-gold"
          >
            {article.title}
          </Link>
        ))}
      </div>
    </section>
  );
}

function ArticleNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <Seo
        title="Article Not Found"
        description="The requested ZXG Wellness article was not found."
        path="/blog"
        noIndex
      />
      <div className="font-display text-4xl text-gold">Article not found</div>
      <p className="mt-4 text-sm text-muted-foreground">
        This article may have moved. Return to the journal to continue reading.
      </p>
      <Link
        to="/blog"
        className="mt-8 inline-flex min-h-11 items-center justify-center bg-gold px-5 py-2 text-sm font-medium text-obsidian"
      >
        Back to Journal
      </Link>
    </main>
  );
}
