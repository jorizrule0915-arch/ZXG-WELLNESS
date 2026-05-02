import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <>
      <Helmet>
        <title>Our Story — ZXG Wellness</title>
        <meta name="description" content="ZXG Wellness was founded on a single conviction: that the way we restore ourselves should be as considered as the way we adorn ourselves." />
      </Helmet>
    <div className="mx-auto max-w-4xl px-6 lg:px-10 py-20 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <div className="text-[10px] uppercase tracking-luxury text-gold mb-6">
          <span className="gold-line">Our Story</span>
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-tight">
          A studio of <span className="text-gradient-gold italic">stillness</span>.
        </h1>
      </motion.div>

      <div className="mt-20 space-y-12 text-lg leading-relaxed text-foreground/85 font-light">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          ZXG Wellness was founded on a single conviction — that the way we restore ourselves should
          be as considered as the way we adorn ourselves. The same intention. The same craft. The
          same patience.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          We are a small atelier — closer to a perfumery than a supplement company. Each formula
          begins with a question, then months of botanical sourcing, slow extraction, and quiet
          refinement. Nothing is rushed. Nothing is duplicated.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Our packaging is designed to remain on display, not to be hidden in a cabinet. Our daily
          rituals are designed to be looked forward to, not endured. Wellness, for us, is the
          smallest of luxuries — the one we extend to ourselves, every morning, in private.
        </motion.p>
      </div>

      <div className="mt-24 grid sm:grid-cols-3 gap-10 border-t border-gold/15 pt-16">
        {[
          { n: "12", l: "Founding formulas" },
          { n: "4", l: "Sourcing continents" },
          { n: "0", l: "Synthetic fillers" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="font-display text-6xl text-gradient-gold">{s.n}</div>
            <div className="mt-3 text-[11px] uppercase tracking-luxury text-muted-foreground">
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
