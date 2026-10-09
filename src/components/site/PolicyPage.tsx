import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { JsonLd, Seo } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/seoData";

type PolicySection = {
  title: string;
  content: ReactNode;
};

export function PolicyPage({
  eyebrow,
  title,
  description,
  path,
  updated = "October 10, 2026",
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
  updated?: string;
  sections: PolicySection[];
}) {
  return (
    <>
      <Seo title={title} description={description} path={path} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: title, path },
        ])}
      />
      <main className="mx-auto max-w-3xl px-6 py-20 md:py-28 lg:px-10">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-14 text-center"
        >
          <div className="mb-4 text-[10px] uppercase tracking-luxury text-gold">{eyebrow}</div>
          <h1 className="font-display text-5xl leading-tight md:text-6xl">{title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
            {description}
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-luxury text-gold/60">
            Last updated: {updated}
          </p>
        </motion.header>

        <div className="border-t border-gold/15">
          {sections.map((section, index) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
              className="border-b border-gold/15 py-9"
            >
              <h2 className="mb-4 font-display text-2xl md:text-3xl">{section.title}</h2>
              <div className="space-y-4 text-sm leading-7 text-foreground/75">
                {section.content}
              </div>
            </motion.section>
          ))}
        </div>

        <div className="mt-10 border border-gold/15 bg-charcoal p-5 text-sm leading-7 text-muted-foreground">
          Questions about this information? Visit our{" "}
          <Link to="/contact" className="text-gold underline-offset-4 hover:underline">
            contact page
          </Link>{" "}
          or email{" "}
          <a
            href="mailto:g@gxzhealthandwellness.com"
            className="text-gold underline-offset-4 hover:underline"
          >
            g@gxzhealthandwellness.com
          </a>
          .
        </div>
      </main>
    </>
  );
}
