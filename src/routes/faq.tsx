import { createFileRoute, Link } from "@tanstack/react-router";
import { JsonLd, Seo } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/seoData";

const faqs = [
  {
    question: "How much does shipping cost?",
    answer:
      "Standard shipping is $10. Orders with a merchandise subtotal of $50 or more qualify for free shipping.",
  },
  {
    question: "Where can I find my tracking information?",
    answer:
      "Tracking appears in your account after it is added to the order and may also be sent by email. Newly created tracking numbers can take a short time to appear on the carrier's website.",
  },
  {
    question: "Can I return an opened product?",
    answer:
      "Health, wellness, and personal-care products generally cannot be returned after opening or use. Eligible unused products must remain in their original packaging and be returned within 30 days of delivery.",
  },
  {
    question: "How do the reusable pen, cartridges, and pen needles work together?",
    answer:
      "The reusable pen is the main device. A compatible cartridge fits inside the pen, while a new single-use pen needle attaches for each use. Review the product pages and setup guides before purchasing accessories.",
  },
  {
    question: "How can I compare the reusable pen options?",
    answer:
      "Use the Reusable Pen Difference guide for a clear comparison, then confirm compatibility and available options on the product page.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "Use the contact form or email g@gxzhealthandwellness.com. Include your order number when asking about an existing purchase.",
  },
] as const;

export const Route = createFileRoute("/faq")({ component: FaqPage });

function FaqPage() {
  return (
    <>
      <Seo
        title="Frequently Asked Questions"
        description="Find answers about GXZ Health and Wellness shipping, order tracking, returns, reusable pens, cartridges, needles, and customer support."
        path="/faq"
      />
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Frequently Asked Questions", path: "/faq" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          },
        ]}
      />
      <main className="mx-auto max-w-4xl px-6 py-20 md:py-28 lg:px-10">
        <header className="mb-14 text-center">
          <div className="mb-4 text-[10px] uppercase tracking-luxury text-gold">Customer Care</div>
          <h1 className="font-display text-5xl leading-tight md:text-6xl">
            Frequently Asked <span className="text-gradient-gold italic">Questions</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
            Quick answers about ordering, delivery, returns, and reusable pen accessories.
          </p>
        </header>

        <section className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group border border-gold/15 bg-charcoal p-5">
              <summary className="cursor-pointer list-none pr-8 text-base font-medium text-foreground marker:hidden">
                {faq.question}
                <span className="float-right text-gold transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 border-t border-gold/10 pt-4 text-sm leading-7 text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </section>

        <div className="mt-10 text-center text-sm text-muted-foreground">
          Still need help?{" "}
          <Link to="/contact" className="text-gold hover:underline">
            Contact GXZ customer support
          </Link>
          .
        </div>
      </main>
    </>
  );
}
