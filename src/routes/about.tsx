import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <>
      <Helmet>
        <title>Our Story — ZXG Wellness</title>
        <meta
          name="description"
          content="ZXG Wellness was built on a simple belief: that caring for yourself should feel as meaningful as anything else you do with intention."
        />
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
          {[
            "ZXG Wellness was built on a simple belief: that caring for yourself should feel as meaningful as anything else you do with intention. We were founded by people who were tired of wellness that felt clinical, impersonal, or rushed — and who believed that something better was possible.",
            "What started as a passion for clean formulation became a commitment to craft. Every product we create is developed slowly — through careful botanical sourcing, honest ingredients, and a standard we hold to without compromise. We don't cut corners. We don't follow trends. We follow what actually works.",
            "Our goal has always been the same: to give you something worth trusting. A product you reach for every day not out of obligation, but because it genuinely makes you feel better — and because you know exactly what's in it, and why.",
            "Perseverance brought us here. Passion keeps us honest. And you — the person who deserves the very best for their wellbeing — are why we show up every day.",
          ].map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
            >
              {para}
            </motion.p>
          ))}
        </div>
      </div>
    </>
  );
}
