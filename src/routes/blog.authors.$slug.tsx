import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { formatBlogDate, getArticlesByAuthor, getBlogAuthor } from "@/lib/blog";
import { JsonLd, Seo } from "@/lib/seo";
import { absoluteUrl, breadcrumbSchema } from "@/lib/seoData";

export const Route = createFileRoute("/blog/authors/$slug")({ component: BlogAuthorPage });

function BlogAuthorPage() {
  const { slug } = useParams({ from: "/blog/authors/$slug" });
  const author = getBlogAuthor(slug);

  if (!author) return <AuthorNotFound />;

  const articles = getArticlesByAuthor(author.slug);
  const authorPath = `/blog/authors/${author.slug}`;

  return (
    <>
      <Seo
        title={`${author.name} Author Profile`}
        description={`${author.name} writes ZXG Wellness educational articles about ${author.expertise.join(", ")}.`}
        path={authorPath}
      />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: author.name,
            url: absoluteUrl(authorPath),
            description: author.bio,
            knowsAbout: author.expertise,
          },
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: author.name, path: authorPath },
          ]),
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-16 lg:px-10">
        <Link
          to="/blog"
          className="text-sm text-muted-foreground transition-colors hover:text-gold"
        >
          ← Back to Journal
        </Link>

        <section className="mt-8 grid gap-8 border border-gold/15 bg-charcoal p-5 sm:p-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="text-xs uppercase tracking-luxury text-gold">Author profile</div>
            <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{author.name}</h1>
            <p className="mt-3 text-sm font-medium text-gold">{author.role}</p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">{author.bio}</p>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">
              {author.credentials}
            </p>
          </div>

          <aside className="border border-gold/10 bg-obsidian/60 p-5">
            <div className="text-xs uppercase tracking-luxury text-gold">Areas of focus</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {author.expertise.map((topic) => (
                <span
                  key={topic}
                  className="border border-gold/20 px-3 py-2 text-sm text-muted-foreground"
                >
                  {topic}
                </span>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-10">
          <div className="mb-5 text-xs uppercase tracking-luxury text-gold">Published articles</div>
          <div className="grid gap-5 md:grid-cols-2">
            {articles.map((article) => (
              <article key={article.slug} className="border border-gold/15 bg-charcoal p-5">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="text-gold">{article.category}</span>
                  <span>•</span>
                  <time dateTime={article.updatedAt}>
                    Updated {formatBlogDate(article.updatedAt)}
                  </time>
                  <span>•</span>
                  <span>{article.readingTime}</span>
                </div>
                <h2 className="mt-4 text-xl font-medium leading-7 text-foreground">
                  <Link
                    to="/blog/$slug"
                    params={{ slug: article.slug }}
                    className="transition-colors hover:text-gold"
                  >
                    {article.title}
                  </Link>
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {article.summaryAnswer}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function AuthorNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <Seo
        title="Author Not Found"
        description="The requested ZXG Wellness author profile was not found."
        path="/blog"
        noIndex
      />
      <div className="font-display text-4xl text-gold">Author not found</div>
      <p className="mt-4 text-sm text-muted-foreground">
        This author profile may have moved. Return to the journal to continue reading.
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
