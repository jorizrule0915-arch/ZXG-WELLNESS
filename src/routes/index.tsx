import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { BadgeCheck, MessageCircle, Star } from "lucide-react";
import { productImages } from "@/lib/productImages";
import { localProducts } from "@/lib/products";
import creatineVideo from "@/assets/Creatine Production Video.mp4";
import { JsonLd, Seo } from "@/lib/seo";
import { organizationSchema, websiteSchema } from "@/lib/seoData";

export const Route = createFileRoute("/")({ component: Index });

const heroSlides = [
  { slug: "creatine", label: localProducts[0].name, tagline: localProducts[0].tagline },
  { slug: "body-balm", label: localProducts[1].name, tagline: localProducts[1].tagline },
];

const testimonials = [
  {
    name: "Maya L.",
    role: "Strength training client",
    location: "Austin, TX",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&h=240&q=85",
    verified: "Verified buyer",
    product: "Reusable Pen",
    quote:
      "The reusable pen feels much more premium than I expected. The weight, dial, and finish make my whole setup feel cleaner and easier to keep organized.",
    messages: [
      { from: "Maya", text: "Just got my ZXG pen — the metal finish is really nice." },
      { from: "ZXG", text: "Glad it arrived safely. How does the setup feel?" },
      { from: "Maya", text: "Super simple. The cartridge system makes everything feel neat." },
    ],
  },
  {
    name: "Daniel R.",
    role: "Wellness routine customer",
    location: "San Diego, CA",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&h=240&q=85",
    verified: "Verified buyer",
    product: "Pen + Cartridges",
    quote:
      "I wanted something that looked professional and did not feel disposable. ZXG’s pen has become the part of my routine that feels the most intentional.",
    messages: [
      { from: "Daniel", text: "Do I need cartridges with the reusable pen?" },
      { from: "ZXG", text: "Yes — pen body, cartridges, and pen needles work together." },
      { from: "Daniel", text: "Perfect. That makes restocking way easier." },
    ],
  },
  {
    name: "Erin C.",
    role: "Recovery-focused shopper",
    location: "Nashville, TN",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=85",
    verified: "Verified buyer",
    product: "Pen Diff Page",
    quote:
      "The site helped me understand the difference between the reusable pen and the refill pieces. It felt clear, polished, and not overwhelming.",
    messages: [
      { from: "Erin", text: "The pen diff page helped a lot, thank you." },
      { from: "ZXG", text: "Happy it made the setup clearer." },
      { from: "Erin", text: "Yes — now I know what to buy first and what to restock." },
    ],
  },
];

function Index() {
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % heroSlides.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <Seo
        title="ZXG Wellness — Luxury Wellness Atelier"
        description="Premium creatine, recovery care, reusable pens, cartridges, and accessories from ZXG Wellness."
        path="/"
      />
      <JsonLd data={[organizationSchema(), websiteSchema()]} />

      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-gold/60"
              style={{ left: `${(i * 7.3 + 3) % 100}%`, top: `${(i * 6.7 + 5) % 100}%` }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 w-full grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-block text-[10px] uppercase tracking-luxury text-gold border border-gold/40 px-3 py-1.5 mb-8">
              ZXG Wellness
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight">
              Wellness, <br />
              ritually <span className="text-gradient-gold italic">gilded</span>.
            </h1>
            <p className="mt-8 max-w-md text-base text-foreground/75 leading-relaxed">
              Two products. Creatine for performance. Body Balm for recovery. Both built to last.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                to="/products"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-all glow-gold"
              >
                Discover the Collection
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                to="/about"
                className="text-[11px] uppercase tracking-luxury text-foreground/80 hover:text-gold border-b border-gold/40 pb-1.5"
              >
                Our Philosophy
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex flex-col items-center gap-6"
          >
            <div className="relative w-full max-w-sm aspect-[3/4] border border-gold/20 overflow-hidden bg-surface">
              <AnimatePresence mode="wait">
                <motion.img
                  key={heroSlides[heroIdx].slug}
                  src={productImages[heroSlides[heroIdx].slug]}
                  alt={heroSlides[heroIdx].label}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 to-transparent" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroSlides[heroIdx].slug + "-label"}
                  className="absolute bottom-5 left-5 right-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="font-display text-lg text-white leading-tight">
                    {heroSlides[heroIdx].label}
                  </div>
                  <div className="text-[10px] uppercase tracking-luxury text-gold mt-1">
                    {heroSlides[heroIdx].tagline}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIdx(i)}
                  className={`h-px w-8 transition-all duration-300 ${i === heroIdx ? "bg-gold" : "bg-gold/30"}`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-luxury text-gold/70"
        >
          <span className="block text-center">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-2 mx-auto h-6 w-px bg-gold/50"
          />
        </motion.div>
      </section>

      <section className="py-32 border-t border-gold/10">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">
              <span className="gold-line">The Promise</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl leading-tight max-w-3xl mx-auto">
              Considered ingredients.{" "}
              <span className="text-gradient-gold italic">Editorial restraint.</span> Ritual at
              every touchpoint.
            </h2>
          </motion.div>
          <div className="mt-20 grid md:grid-cols-3 gap-12 text-left">
            {[
              {
                t: "Performance",
                d: "ZXG Creatine is formulated to support strength output, endurance, and hydration during training.",
              },
              {
                t: "Recovery",
                d: "ZXG Body Balm restores and hydrates skin with botanical extracts. No fillers, no compromises.",
              },
              { t: "Ritual", d: "Packaged to be displayed. Designed to be returned to, daily." },
            ].map((b, i) => (
              <motion.div
                key={b.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <div className="font-display text-5xl text-gradient-gold mb-4">0{i + 1}</div>
                <h3 className="font-display text-xl mb-3">{b.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 md:py-32 border-t border-gold/10 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-5">
              <span className="gold-line">Real Feedback</span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl leading-tight">
              Quiet confidence,{" "}
              <span className="text-gradient-gold italic">shared by customers.</span>
            </h2>
            <p className="mt-5 text-base text-muted-foreground leading-relaxed">
              A few notes from people using ZXG products in their wellness routines.
            </p>
            <p className="mt-3 text-sm text-muted-foreground/90">
              Purchase context is included so each testimonial feels clear and grounded.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.article
                key={testimonial.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.65, delay: index * 0.1 }}
                className="group overflow-hidden border border-gold/15 bg-card shadow-[0_24px_70px_-60px_rgba(190,140,35,0.9)] transition-colors hover:border-gold/35"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      role="img"
                      aria-label={`${testimonial.name} verified profile`}
                      className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/40 shadow-[0_12px_30px_-18px_rgba(190,140,35,0.9)]"
                    >
                      <img
                        src={testimonial.avatar}
                        alt={`${testimonial.name} customer profile`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-obsidian/35 via-transparent to-white/10" />
                      <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-gold text-obsidian">
                        <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-display text-2xl leading-tight">{testimonial.name}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                          <BadgeCheck className="h-3 w-3" strokeWidth={2.5} />
                          {testimonial.verified}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      <p className="text-xs uppercase tracking-wide text-gold">
                        {testimonial.product} · {testimonial.location}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-1 text-gold" aria-label="5 star rating">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star key={starIndex} className="h-4 w-4 fill-current" strokeWidth={1.25} />
                    ))}
                  </div>

                  <p className="mt-5 text-base leading-relaxed text-foreground/85">
                    “{testimonial.quote}”
                  </p>
                </div>

                <div className="border-t border-gold/10 bg-surface/70 p-5">
                  <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-luxury text-gold">
                    <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                    Conversation Preview
                  </div>
                  <div className="space-y-3 rounded-2xl border border-gold/10 bg-background p-4">
                    {testimonial.messages.map((message, messageIndex) => {
                      const isCustomer = message.from === testimonial.name.split(" ")[0];
                      return (
                        <div
                          key={`${testimonial.name}-${messageIndex}`}
                          className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              isCustomer
                                ? "bg-muted text-foreground"
                                : "bg-gold text-obsidian shadow-sm"
                            }`}
                          >
                            <div
                              className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
                                isCustomer ? "text-muted-foreground" : "text-obsidian/70"
                              }`}
                            >
                              {message.from}
                            </div>
                            {message.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gold/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-32 pb-10">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
            <div>
              <div className="text-[10px] uppercase tracking-luxury text-gold mb-4">
                The Collection
              </div>
              <h2 className="font-display text-4xl md:text-5xl">Featured Product</h2>
            </div>
            <Link
              to="/products"
              className="text-[11px] uppercase tracking-luxury text-gold border-b border-gold/40 pb-1 hover:border-gold"
            >
              View All →
            </Link>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="w-full"
        >
          <video
            src={creatineVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full object-cover max-h-[80vh]"
          />
        </motion.div>
        <div className="pb-16" />
      </section>

      <section className="py-32 border-t border-gold/10">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl md:text-6xl leading-tight">
            Begin your <span className="text-gradient-gold italic">wellness</span> journey.
          </h2>
          <p className="mt-6 text-base text-muted-foreground max-w-xl mx-auto">
            Premium products built for performance and recovery.
          </p>
          <Link
            to="/products"
            className="mt-10 inline-flex items-center gap-3 px-10 py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-colors glow-gold"
          >
            Shop Now →
          </Link>
        </div>
      </section>
    </>
  );
}
