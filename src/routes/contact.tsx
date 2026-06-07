import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/contact")({ component: ContactPage });

function ContactPage() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - ZXG Wellness</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="mb-10">
          <div className="mb-4 text-[10px] uppercase tracking-luxury text-gold">Contact</div>
          <h1 className="font-display text-4xl leading-tight md:text-5xl">Contact Us</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Have a question about an order, product, or return? Send us a message and we will get
            back to you as soon as possible.
          </p>
          <a
            href="mailto:g@zxgwellness.com"
            className="mt-6 inline-block text-sm text-gold transition-colors hover:text-gold-light"
          >
            g@zxgwellness.com
          </a>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 border border-gold/15 bg-charcoal p-6 md:p-8">
          {sent ? (
            <div className="py-10 text-center">
              <div className="font-display text-3xl text-gradient-gold">Message received</div>
              <p className="mt-3 text-sm text-muted-foreground">Thank you. We will reply soon.</p>
            </div>
          ) : (
            <>
              <Field label="Name" name="name" />
              <Field label="Email" name="email" type="email" />
              <Field label="Message" name="message" textarea />
              <button
                type="submit"
                className="w-full bg-gold px-6 py-4 text-[11px] font-medium uppercase tracking-luxury text-obsidian transition-colors hover:bg-gold-light"
              >
                Send Message
              </button>
            </>
          )}
        </form>
      </div>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  textarea = false,
}: {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-luxury text-gold">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          required
          rows={5}
          className="w-full resize-none border-b border-gold/30 bg-transparent py-2 text-sm text-foreground outline-none transition-colors focus:border-gold"
        />
      ) : (
        <input
          type={type}
          name={name}
          required
          className="w-full border-b border-gold/30 bg-transparent py-2 text-sm text-foreground outline-none transition-colors focus:border-gold"
        />
      )}
    </label>
  );
}
