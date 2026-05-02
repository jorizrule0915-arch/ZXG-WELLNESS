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
      <Helmet><title>Contact the Atelier — ZXG Wellness</title></Helmet>
      <div className="mx-auto max-w-5xl px-6 lg:px-10 py-20 md:py-28 grid lg:grid-cols-2 gap-16">
        <div>
          <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">Concierge</div>
          <h1 className="font-display text-5xl md:text-6xl leading-tight">
            Reach the <span className="text-gradient-gold italic">atelier</span>.
          </h1>
          <p className="mt-6 text-foreground/75 leading-relaxed max-w-md">
            For private consultations, partnerships, press inquiries, or simply to say hello — we read every note personally.
          </p>
          <div className="mt-12 space-y-6 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-luxury text-gold mb-2">General</div>
              <div className="text-foreground/85">concierge@zxg.wellness</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-luxury text-gold mb-2">Press &amp; Partnerships</div>
              <div className="text-foreground/85">studio@zxg.wellness</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-luxury text-gold mb-2">Studios</div>
              <div className="text-foreground/85">Stockholm · New York</div>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-charcoal border border-gold/15 p-8 md:p-10 space-y-6">
          {sent ? (
            <div className="text-center py-12">
              <div className="font-display text-4xl text-gradient-gold">Received</div>
              <p className="mt-4 text-muted-foreground">Our concierge will respond within one business day.</p>
            </div>
          ) : (
            <>
              <Field label="Name" name="name" />
              <Field label="Email" name="email" type="email" />
              <Field label="Subject" name="subject" />
              <Field label="Message" name="message" textarea />
              <button type="submit" className="w-full py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-colors glow-gold-sm">
                Send to Concierge →
              </button>
            </>
          )}
        </form>
      </div>
    </>
  );
}

function Field({ label, name, type = "text", textarea = false }: { label: string; name: string; type?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-luxury text-gold mb-2">{label}</span>
      {textarea ? (
        <textarea name={name} required rows={5} className="w-full bg-transparent border-b border-gold/30 focus:border-gold outline-none py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors resize-none" />
      ) : (
        <input type={type} name={name} required className="w-full bg-transparent border-b border-gold/30 focus:border-gold outline-none py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors" />
      )}
    </label>
  );
}
