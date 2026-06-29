import { Fragment, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, Minus, X } from "lucide-react";
import { penColorImages } from "@/lib/productImages";
import { JsonLd, Seo } from "@/lib/seo";
import { breadcrumbSchema, faqSchema } from "@/lib/seoData";

export const Route = createFileRoute("/reusable-pen-difference")({
  component: ReusablePenDifferencePage,
});

const comparisonProducts = [
  {
    key: "classic",
    name: "ZXG Classic Pen",
    tagline: "Classic feel",
    image: penColorImages.gold,
    cta: "Shop Pen",
    slug: "pen",
    available: false,
  },
  {
    key: "signature",
    name: "ZXG Signature Pen",
    tagline: "Easiest handling",
    image: penColorImages.black,
    cta: "Shop Pen",
    slug: "pen",
    available: true,
    featured: true,
  },
  {
    key: "singleUse",
    name: "ZXG Disposable Pen",
    tagline: "Single-use",
    image: penColorImages.silver,
    cta: "Shop Disposable",
    slug: "pen",
    available: false,
  },
] as const;

type ComparisonProduct = (typeof comparisonProducts)[number];
type ProductKey = (typeof comparisonProducts)[number]["key"];
type ComparisonValue = boolean | string;

const comparisonSections: Array<{
  title: string;
  rows: Array<{
    label: string;
    values: Record<ProductKey, ComparisonValue>;
  }>;
}> = [
  {
    title: "Basics",
    rows: [
      {
        label: "Reusable Construction",
        values: { classic: true, signature: true, singleUse: false },
      },
      {
        label: "Reusability",
        values: { classic: true, signature: true, singleUse: false },
      },
    ],
  },
  {
    title: "Capacity",
    rows: [
      {
        label: "Capacity & Increment Resolution",
        values: {
          classic: "3mL cartridge / adjustable dial",
          signature: "3mL cartridge / adjustable dial",
          singleUse: "Single-use pen format",
        },
      },
    ],
  },
  {
    title: "Design",
    rows: [
      {
        label: "External Design Style",
        values: {
          classic: "Traditional pen-style body with cap",
          signature: "Modern metal body with premium color finish",
          singleUse: "Pen-style body with integrated clip",
        },
      },
      {
        label: "End Design",
        values: {
          classic: "Closed-end capped profile",
          signature: "Streamlined reusable body",
          singleUse: "Integrated end design",
        },
      },
    ],
  },
  {
    title: "Handling",
    rows: [
      {
        label: "Pen-Style Dosing Dial",
        values: { classic: true, signature: true, singleUse: false },
      },
      {
        label: "Replaceable 3mL Cartridge",
        values: { classic: true, signature: true, singleUse: false },
      },
      {
        label: "Compatible with Pen Needles",
        values: { classic: true, signature: true, singleUse: false },
      },
      {
        label: "Single-Use Format",
        values: { classic: false, signature: false, singleUse: true },
      },
    ],
  },
  {
    title: "Best For",
    rows: [
      {
        label: "Best For",
        values: {
          classic: "Classic reusable feel",
          signature: "Everyday reusable setup",
          singleUse: "Simple single-use prep",
        },
      },
    ],
  },
];

const quickLinks = [
  { label: "Shop Pen", slug: "pen" },
  { label: "Shop Cartridges", slug: "cartridge" },
  { label: "Shop Needles", slug: "needles" },
] as const;

function CheckCell({ value }: { value: ComparisonValue }) {
  if (typeof value !== "boolean") {
    return (
      <span className="text-sm leading-relaxed text-slate-700 dark:text-foreground/80">
        {value}
      </span>
    );
  }

  return value ? (
    <span
      className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
      aria-label="Supported"
    >
      <Check className="h-5 w-5" strokeWidth={3} />
    </span>
  ) : (
    <span
      className="mx-auto flex h-9 w-9 items-center justify-center text-slate-400 dark:text-muted-foreground"
      aria-label="Not supported"
    >
      <Minus className="h-5 w-5" />
    </span>
  );
}

function MobileValue({ value }: { value: ComparisonValue }) {
  if (typeof value !== "boolean") {
    return (
      <span className="text-right text-sm font-medium text-slate-700 dark:text-foreground/80">
        {value}
      </span>
    );
  }

  return value ? (
    <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
      <Check className="h-4 w-4" strokeWidth={3} />
      Supported
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-muted-foreground">
      <Minus className="h-4 w-4" />
      Not supported
    </span>
  );
}

function ProductCta({
  product,
  className,
  onUnavailable,
}: {
  product: ComparisonProduct;
  className: string;
  onUnavailable: (product: ComparisonProduct) => void;
}) {
  const actionClassName = `${className} w-full`;

  if (product.available) {
    return (
      <Link to="/products/$slug" params={{ slug: product.slug }} className={actionClassName}>
        {product.cta}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onUnavailable(product)}
      className={actionClassName}
      aria-haspopup="dialog"
    >
      {product.cta}
    </button>
  );
}

function ReusablePenDifferencePage() {
  const [unavailableProduct, setUnavailableProduct] = useState<ComparisonProduct | null>(null);

  return (
    <>
      <Seo
        title="Reusable Pen Difference"
        description="Compare reusable pens, refill cartridges, single-use pen needles, and compatible accessory options from ZXG Wellness."
        path="/reusable-pen-difference"
        image={penColorImages.black}
      />
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Reusable Pen Difference", path: "/reusable-pen-difference" },
          ]),
          faqSchema([
            {
              question: "What is the ZXG reusable pen difference?",
              answer:
                "The ZXG reusable pen system focuses on durable reusable construction, replaceable cartridges, compatible pen needles, and premium everyday handling.",
            },
            {
              question: "What accessories work with the reusable pen?",
              answer:
                "The reusable pen is presented alongside ZXG disposable cartridges and single-use pen needles as a complete accessory setup.",
            },
          ]),
        ]}
      />

      <div className="bg-background text-foreground">
        <section className="relative isolate flex min-h-[340px] items-center justify-center overflow-hidden bg-[#11151a] px-6 py-20 text-center text-white md:min-h-[420px]">
          <div className="absolute inset-0 -z-20 opacity-55">
            <img
              src={penColorImages.black}
              alt=""
              className="absolute left-[14%] top-10 h-[340px] rotate-[58deg] object-contain opacity-80"
            />
            <img
              src={penColorImages.silver}
              alt=""
              className="absolute left-[38%] top-0 h-[380px] rotate-[58deg] object-contain opacity-80"
            />
            <img
              src={penColorImages.gold}
              alt=""
              className="absolute right-[16%] top-8 h-[360px] rotate-[58deg] object-contain opacity-80"
            />
            <img
              src={penColorImages.bronze}
              alt=""
              className="absolute -right-10 top-24 h-[330px] rotate-[58deg] object-contain opacity-70"
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-black/65" />

          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-7xl">
              The Reusable Pen Difference
            </h1>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-white/75">
              <Link to="/" className="transition-colors hover:text-white">
                Home
              </Link>
              <ChevronRight className="h-4 w-4 text-gold" />
              <span>Pen Diff</span>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.slug}
                  to="/products/$slug"
                  params={{ slug: link.slug }}
                  className="rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-obsidian shadow-sm transition-colors hover:bg-gold-light sm:px-8 sm:py-4"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <p className="mb-2 text-center text-sm text-muted-foreground">
              ✓ = Supported &nbsp;&nbsp; — = Not supported
            </p>

            <div className="grid gap-6 lg:hidden">
              {comparisonProducts.map((product) => (
                <article
                  key={`${product.key}-mobile`}
                  className={`overflow-hidden rounded-2xl border shadow-[0_20px_55px_-45px_rgba(190,140,35,0.9)] ${
                    product.featured
                      ? "border-gold bg-gold/10 dark:bg-gold/15"
                      : "border-slate-200 bg-white dark:border-gold/15 dark:bg-charcoal"
                  }`}
                >
                  <div
                    className={`relative flex items-center gap-5 border-b p-5 dark:border-gold/10 ${
                      product.featured
                        ? "border-gold/25 bg-gold text-obsidian"
                        : "border-slate-200 bg-slate-50 dark:bg-surface"
                    }`}
                  >
                    {product.featured && (
                      <span className="absolute right-4 top-3 rounded-full bg-white px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-obsidian">
                        Popular
                      </span>
                    )}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-24 w-24 shrink-0 object-contain"
                    />
                    <div className="pr-10">
                      <h2 className="text-lg font-extrabold leading-tight">{product.name}</h2>
                      <p
                        className={`mt-1 text-sm ${
                          product.featured
                            ? "text-obsidian/80"
                            : "text-muted-foreground dark:text-foreground/70"
                        }`}
                      >
                        {product.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-gold/10">
                    {comparisonSections.map((section) => (
                      <div key={`${product.key}-${section.title}`} className="p-5">
                        <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-gold">
                          {section.title}
                        </h3>
                        <div className="space-y-3">
                          {section.rows.map((row) => (
                            <div
                              key={`${product.key}-${section.title}-${row.label}`}
                              className="grid grid-cols-[1fr_auto] items-start gap-4"
                            >
                              <span className="text-sm font-bold text-slate-800 dark:text-foreground">
                                {row.label}
                              </span>
                              <MobileValue value={row.values[product.key]} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 pt-0">
                    <ProductCta
                      product={product}
                      onUnavailable={setUnavailableProduct}
                      className={`block rounded-xl border px-6 py-3.5 text-center text-sm font-extrabold uppercase tracking-wide transition-colors ${
                        product.featured
                          ? "border-gold bg-gold text-obsidian hover:bg-gold-light"
                          : "border-slate-300 text-gold hover:border-gold hover:bg-gold/10 dark:border-gold/20 dark:hover:bg-gold/10"
                      }`}
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto pb-2 lg:block">
              <div className="mx-auto min-w-[940px] overflow-hidden rounded-[22px] border border-slate-200 bg-white text-slate-900 shadow-[0_24px_70px_-55px_rgba(190,140,35,0.85)] dark:border-gold/15 dark:bg-charcoal dark:text-foreground">
                <div className="grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
                  <div className="border-b border-r border-slate-200 bg-slate-50 dark:border-gold/10 dark:bg-surface" />
                  {comparisonProducts.map((product) => (
                    <div
                      key={product.key}
                      className={`relative flex min-h-56 flex-col items-center justify-end border-b border-r border-slate-200 px-6 pb-6 pt-4 text-center last:border-r-0 dark:border-gold/10 ${
                        product.featured ? "bg-gold text-obsidian" : "bg-slate-50 dark:bg-surface"
                      }`}
                    >
                      {product.featured && (
                        <span className="absolute top-3 rounded-full bg-white px-4 py-0.5 text-[11px] font-bold text-obsidian">
                          Most Popular
                        </span>
                      )}
                      <img
                        src={product.image}
                        alt={product.name}
                        className="mb-4 h-28 w-28 object-contain"
                      />
                      <h2 className="text-lg font-extrabold leading-tight">{product.name}</h2>
                      <p
                        className={`text-sm leading-tight ${
                          product.featured
                            ? "text-obsidian/80"
                            : "text-slate-500 dark:text-foreground/70"
                        }`}
                      >
                        {product.tagline}
                      </p>
                    </div>
                  ))}

                  {comparisonSections.map((section) => (
                    <Fragment key={section.title}>
                      <div className="col-span-4 border-b border-slate-200 bg-slate-100 py-2.5 text-center text-base font-extrabold uppercase tracking-wide text-slate-600 dark:border-gold/10 dark:bg-surface-2 dark:text-foreground/75">
                        {section.title}
                      </div>

                      {section.rows.map((row) => (
                        <Fragment key={`${section.title}-${row.label}`}>
                          <div className="flex min-h-16 items-center border-b border-r border-slate-200 bg-white px-5 text-[15px] font-bold text-slate-800 dark:border-gold/10 dark:bg-charcoal dark:text-foreground">
                            {row.label}
                          </div>
                          {comparisonProducts.map((product) => (
                            <div
                              key={`${row.label}-${product.key}`}
                              className={`flex min-h-16 items-center justify-center border-b border-r border-slate-200 px-5 text-center last:border-r-0 dark:border-gold/10 ${
                                product.featured
                                  ? "border-r-gold bg-gold/10 dark:bg-gold/15"
                                  : "bg-slate-50 dark:bg-surface"
                              }`}
                            >
                              <CheckCell value={row.values[product.key]} />
                            </div>
                          ))}
                        </Fragment>
                      ))}
                    </Fragment>
                  ))}

                  <div className="border-r border-slate-200 bg-white dark:border-gold/10 dark:bg-charcoal" />
                  {comparisonProducts.map((product) => (
                    <div
                      key={`${product.key}-cta`}
                      className={`border-r border-slate-200 p-4 last:border-r-0 dark:border-gold/10 ${
                        product.featured
                          ? "bg-gold/10 dark:bg-gold/15"
                          : "bg-white dark:bg-charcoal"
                      }`}
                    >
                      <ProductCta
                        product={product}
                        onUnavailable={setUnavailableProduct}
                        className={`block rounded-xl border px-6 py-3 text-center text-[15px] font-extrabold transition-colors ${
                          product.featured
                            ? "border-gold bg-gold text-obsidian hover:bg-gold-light"
                            : "border-slate-300 text-gold hover:border-gold hover:bg-gold/10 dark:border-gold/20 dark:text-gold dark:hover:bg-gold/10"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mx-auto mt-12 max-w-5xl">
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
                Which Reusable Setup Is Right for You?
              </h2>
              <ul className="mt-6 space-y-3 text-base leading-relaxed text-muted-foreground md:text-lg">
                <li>
                  <span className="font-bold text-foreground">Choose ZXG Classic Pen</span> if you
                  prefer a traditional capped pen feel with reusable construction.
                </li>
                <li>
                  <span className="font-bold text-foreground">Choose ZXG Signature Pen</span> if you
                  want the cleanest everyday reusable setup and premium color finish.
                </li>
                <li>
                  <span className="font-bold text-foreground">Choose cartridges and needles</span>{" "}
                  when you already have the pen and need restock essentials.
                </li>
                <li>
                  <span className="font-bold text-foreground">Choose ZXG Disposable Pen</span> if
                  you need a simple single-use option instead of a reusable pen system.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {unavailableProduct && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-obsidian/70 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pen-unavailable-title"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-gold/25 bg-background p-6 text-foreground shadow-[0_28px_90px_-35px_rgba(190,140,35,0.85)]">
            <button
              type="button"
              onClick={() => setUnavailableProduct(null)}
              className="absolute right-4 top-4 rounded-full border border-gold/20 p-2 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
              aria-label="Close availability message"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <Minus className="h-6 w-6" />
            </div>

            <p className="text-[11px] font-bold uppercase tracking-luxury text-gold">
              Availability Notice
            </p>
            <h2
              id="pen-unavailable-title"
              className="mt-2 font-display text-3xl font-semibold leading-tight"
            >
              {unavailableProduct.name} is not available right now.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We currently sell the ZXG Signature Pen, our V2 reusable pen. This option is not in
              stock yet, but the V2 pen is ready to order now.
            </p>

            <div className="mt-6 rounded-xl border border-gold/15 bg-gold/5 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-gold">
                Recommended available option
              </div>
              <div className="mt-1 text-base font-extrabold">ZXG Signature Pen V2</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Premium reusable setup with the easiest everyday handling.
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                to="/products/$slug"
                params={{ slug: "pen" }}
                onClick={() => setUnavailableProduct(null)}
                className="rounded-xl bg-gold px-5 py-3 text-center text-sm font-extrabold uppercase tracking-wide text-obsidian transition-colors hover:bg-gold-light"
              >
                Shop V2 Pen
              </Link>
              <button
                type="button"
                onClick={() => setUnavailableProduct(null)}
                className="rounded-xl border border-gold/25 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-gold transition-colors hover:bg-gold/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
