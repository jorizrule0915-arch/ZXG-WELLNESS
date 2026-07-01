import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import {
  formatBlogDate,
  getArticleToc,
  getBlogArticle,
  getBlogAuthor,
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
  const author = getBlogAuthor(article.authorSlug);
  const toc = getArticleToc(article);

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
              url: absoluteUrl(`/blog/authors/${article.authorSlug}`),
            },
            reviewedBy: {
              "@type": "Organization",
              name: article.reviewedBy,
            },
            publisher: {
              "@type": "Organization",
              name: "ZXG Wellness",
            },
            mainEntityOfPage: absoluteUrl(articlePath),
            keywords: article.keywords.join(", "),
            articleSection: article.category,
            citation: article.references.map((reference) => reference.url),
          },
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: article.title, path: articlePath },
          ]),
          faqSchema(article.faqs),
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16 lg:px-10">
        <Link
          to="/blog"
          className="inline-flex min-h-10 items-center gap-2 border border-gold/20 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-gold/50 hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Journal
        </Link>

        <article className="mt-6">
          <header className="overflow-hidden border border-gold/15 bg-charcoal">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div className="p-5 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="border border-gold/20 bg-gold/10 px-3 py-1.5 text-gold">
                    {article.category}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gold" />
                    <time dateTime={article.publishedAt}>
                      {formatBlogDate(article.publishedAt)}
                    </time>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gold" />
                    {article.readingTime}
                  </span>
                </div>
                <h1 className="mt-5 max-w-3xl font-display text-3xl leading-tight text-foreground md:text-4xl">
                  {article.title}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                  {article.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>
                    By{" "}
                    <Link
                      to="/blog/authors/$slug"
                      params={{ slug: article.authorSlug }}
                      className="text-gold transition-colors hover:text-gold-light"
                    >
                      {article.author}
                    </Link>
                  </span>
                  <span>•</span>
                  <span>Reviewed {formatBlogDate(article.reviewedAt)}</span>
                  <span>•</span>
                  <span>Updated {formatBlogDate(article.updatedAt)}</span>
                </div>
              </div>

              <div className="border-t border-gold/10 bg-obsidian/70 lg:border-l lg:border-t-0">
                <img
                  src={article.image}
                  alt={article.imageAlt}
                  className="aspect-[4/3] h-full w-full object-contain p-5 sm:p-8"
                />
              </div>
            </div>
          </header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-10">
              <section className="surface-glow-panel space-y-5 border border-gold/15 p-5 sm:p-7">
                <div>
                  <div className="text-xs uppercase tracking-luxury text-gold">Quick answer</div>
                  <p className="mt-3 text-sm leading-7 text-foreground/90">
                    {article.summaryAnswer}
                  </p>
                </div>
                <div className="grid gap-3 border-t border-gold/10 pt-5 md:grid-cols-3">
                  {article.takeaways.map((takeaway) => (
                    <div
                      key={takeaway}
                      className="border border-gold/10 bg-obsidian/60 p-4 text-sm leading-6 text-muted-foreground"
                    >
                      <CheckCircle2 className="mb-3 h-4 w-4 text-gold" />
                      {takeaway}
                    </div>
                  ))}
                </div>
                {article.intro.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-foreground/85">
                    {paragraph}
                  </p>
                ))}
              </section>

              {article.sections.map((section) => (
                <section key={section.heading} className="min-w-0">
                  <h2
                    id={section.heading
                      .toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, "")
                      .trim()
                      .replace(/\s+/g, "-")}
                    className="scroll-mt-24 font-display text-2xl leading-tight text-foreground md:text-3xl"
                  >
                    {section.heading}
                  </h2>
                  <div className="mt-5 space-y-5">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-7 text-foreground/80">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.bullets && (
                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-3 border border-gold/10 bg-charcoal px-4 py-3 text-sm leading-6 text-foreground/80"
                        >
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-gold" />
                          <span>{bullet}</span>
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
                      <h2 className="text-sm font-medium text-foreground">{faq.question}</h2>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                    </article>
                  ))}
                </div>
              </section>

              {article.references.length > 0 && (
                <section className="border-t border-gold/10 pt-10">
                  <div className="text-xs uppercase tracking-luxury text-gold">References</div>
                  <ol className="mt-5 space-y-3">
                    {article.references.map((reference) => (
                      <li
                        key={reference.url}
                        className="border border-gold/10 bg-charcoal p-4 text-sm leading-6 text-muted-foreground"
                      >
                        <a
                          href={reference.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-start gap-2 font-medium text-foreground transition-colors hover:text-gold"
                        >
                          {reference.title}
                          <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-gold" />
                        </a>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {reference.source}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <section className="border border-gold/15 bg-gold/5 p-5 text-sm leading-7 text-muted-foreground">
                <strong className="font-medium text-foreground">Educational note:</strong> This
                article is for general product education and wellness planning. It is not medical
                advice. For personal medical, dosing, or treatment questions, speak with a qualified
                healthcare professional.
              </section>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              {toc.length > 0 && <TableOfContents items={toc} />}
              {author && <AuthorCard author={author} />}
              <ArticleLinks article={article} />
              {relatedArticles.length > 0 && <RelatedArticles articles={relatedArticles} />}
            </aside>
          </div>
        </article>
      </main>
    </>
  );
}

function TableOfContents({ items }: { items: Array<{ id: string; label: string }> }) {
  return (
    <nav className="border border-gold/15 bg-charcoal p-5" aria-label="Article table of contents">
      <div className="text-xs uppercase tracking-luxury text-gold">In this article</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="block text-sm leading-6 text-muted-foreground transition-colors hover:text-gold"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function AuthorCard({ author }: { author: NonNullable<ReturnType<typeof getBlogAuthor>> }) {
  return (
    <section className="border border-gold/15 bg-charcoal p-5">
      <div className="text-xs uppercase tracking-luxury text-gold">Author profile</div>
      <h2 className="mt-3 text-lg font-medium text-foreground">{author.name}</h2>
      <p className="mt-1 text-sm text-gold">{author.role}</p>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">{author.credentials}</p>
      <Link
        to="/blog/authors/$slug"
        params={{ slug: author.slug }}
        className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 border border-gold/30 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-obsidian"
      >
        View author page
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
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
            <span className="flex items-start gap-2 text-sm font-medium text-gold">
              <LinkIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {link.label}
            </span>
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
            className="flex items-start justify-between gap-3 text-sm leading-6 text-foreground transition-colors hover:text-gold"
          >
            <span>{article.title}</span>
            <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-gold" />
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
      <div className="font-display text-3xl text-gold">Article not found</div>
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
