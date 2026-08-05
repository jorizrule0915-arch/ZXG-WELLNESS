import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import contactFeatureVideo from "@/assets/contact-feature.mp4";
import { JsonLd, Seo } from "@/lib/seo";
import { breadcrumbSchema, faqSchema, organizationSchema } from "@/lib/seoData";

export const Route = createFileRoute("/contact")({ component: ContactPage });

const contactFaqs = [
  {
    question: "How quickly does GXZ Health and Wellness respond?",
    answer:
      "We aim to reply to website messages as soon as possible during normal business days. Including your order number and the email used at checkout helps us assist you faster.",
  },
  {
    question: "What should I include with an order question?",
    answer:
      "Include your order number, the email used at checkout, and a brief description of what you need. Please do not send passwords, full payment-card details, or other sensitive financial information.",
  },
  {
    question: "Can you help me choose compatible pen accessories?",
    answer:
      "Yes. Tell us which GXZ pen or accessory you are considering, and we can explain the available cartridges, pen needles, sizes, and product options. We cannot provide medication, treatment, or dosing advice.",
  },
  {
    question: "How do I request a return or report a damaged item?",
    answer:
      "Contact us with your order number and a description of the issue. For damaged items, include clear photographs when possible. Review the Returns page for eligibility, timing, and next steps.",
  },
  {
    question: "Can GXZ Health and Wellness answer medical or dosing questions?",
    answer:
      "No. GXZ customer care can explain product features, accessory compatibility, ordering, and general handling resources. Medical, medication, and dosing questions should be directed to a qualified healthcare professional or pharmacist.",
  },
];

function ContactPage() {
  const instagramUrl = String(import.meta.env.VITE_INSTAGRAM_URL ?? "").trim();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;

    setSending(true);
    setError("");

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
          company: formData.get("company"),
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "We could not send your message. Please try again.");
      }

      form.reset();
      setSent(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Seo
        title="Contact GXZ Health and Wellness"
        description="Contact GXZ Health and Wellness customer care for order, shipping, product, and return questions."
        path="/contact"
      />
      <JsonLd
        data={[
          organizationSchema(),
          faqSchema(contactFaqs),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
        <div className="grid overflow-hidden border border-gold/15 bg-charcoal shadow-[0_35px_100px_-55px_rgba(190,140,35,0.65)] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative min-h-[430px] overflow-hidden bg-obsidian lg:min-h-[720px]">
            <video
              src={contactFeatureVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="GXZ Health and Wellness featured brand video"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
              <div className="text-[10px] uppercase tracking-luxury text-gold">
                Start a conversation
              </div>
              <h2 className="mt-4 max-w-md font-display text-3xl leading-tight text-white sm:text-4xl">
                Personal support, thoughtfully delivered.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
                Whether you need help choosing an accessory or checking an order, the GXZ team is
                here to make the next step clear.
              </p>
            </div>
          </section>

          <section className="p-7 sm:p-10 lg:p-14">
            <div className="text-[10px] uppercase tracking-luxury text-gold">Contact</div>
            <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
              How can we <span className="text-gradient-gold italic">help?</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
              Tell us what you need and we’ll reply as soon as possible. For order questions,
              include your order number in the message.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="mailto:g@zxgwellness.com"
                className="inline-flex min-h-11 items-center gap-2 border border-gold/20 px-4 py-2 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
              >
                <Mail className="h-4 w-4 text-gold" />
                g@zxgwellness.com
              </a>
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 border border-gold/20 px-4 py-2 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
                >
                  <Instagram className="h-4 w-4 text-gold" />
                  Instagram
                </a>
              )}
            </div>

            <form
              onSubmit={onSubmit}
              aria-busy={sending}
              className="mt-10 space-y-6 border-t border-gold/15 pt-9"
            >
              {sent ? (
                <div className="flex min-h-72 flex-col items-center justify-center border border-gold/15 bg-obsidian/40 px-6 text-center">
                  <MessageCircle className="h-9 w-9 text-gold" />
                  <div className="mt-5 font-display text-3xl text-gradient-gold">
                    Message received
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Thank you. The GXZ team will reply soon.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-6 text-[10px] uppercase tracking-luxury text-gold underline-offset-4 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
                    <label htmlFor="company">Company website</label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label="Name" name="name" autoComplete="name" />
                    <Field label="Email" name="email" type="email" autoComplete="email" />
                  </div>
                  <Field label="Message" name="message" textarea />
                  {error && (
                    <div
                      role="alert"
                      className="border border-red-400/40 bg-red-950/30 px-4 py-3 text-sm text-red-200"
                    >
                      {error}{" "}
                      <a href="mailto:g@zxgwellness.com" className="underline">
                        Email us directly
                      </a>
                      .
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-gold px-6 py-4 text-[11px] font-semibold uppercase tracking-luxury text-obsidian transition-colors hover:bg-gold-light disabled:cursor-wait disabled:opacity-60"
                  >
                    {sending ? "Sending…" : "Send Message"}
                  </button>
                </>
              )}
            </form>
          </section>
        </div>

        <section className="border-x border-b border-gold/15 bg-obsidian/40 px-7 py-14 sm:px-10 lg:px-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <div className="text-[10px] uppercase tracking-luxury text-gold">Before you send</div>
              <h2 className="mt-4 font-display text-3xl leading-tight md:text-4xl">
                Frequently asked <span className="text-gradient-gold italic">questions.</span>
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
                Quick answers for orders, accessories, returns, and the kind of support our team can
                provide.
              </p>
            </div>

            <div className="divide-y divide-gold/15 border-y border-gold/15">
              {contactFaqs.map((faq, index) => (
                <details key={faq.question} className="group py-1" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left text-sm font-medium text-foreground marker:hidden">
                    <span>{faq.question}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-gold/25 text-lg font-light text-gold transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-6 pr-10 text-sm leading-7 text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  textarea = false,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-luxury text-gold">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          required
          rows={5}
          placeholder="Tell us how we can help…"
          className="min-h-36 w-full resize-y border border-gold/20 bg-obsidian/35 px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold"
        />
      ) : (
        <input
          type={type}
          name={name}
          required
          autoComplete={autoComplete}
          className="w-full border-b border-gold/30 bg-transparent py-3 text-sm text-foreground outline-none transition-colors focus:border-gold"
        />
      )}
    </label>
  );
}
