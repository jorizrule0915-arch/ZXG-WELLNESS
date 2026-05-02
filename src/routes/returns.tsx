import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Refund & Return Policy — ZXG Wellness" },
      {
        name: "description",
        content:
          "ZXG Wellness refund and return policy. We stand behind the quality of every product.",
      },
    ],
  }),
  component: ReturnsPage,
});

function Section({ title, children, index }: { title: string; children: React.ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="border-b border-gold/15 py-10"
    >
      <h2 className="font-display text-2xl md:text-3xl mb-5">{title}</h2>
      <div className="text-foreground/75 leading-relaxed space-y-4 text-sm">{children}</div>
    </motion.div>
  );
}

function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-10 py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <div className="text-[10px] uppercase tracking-luxury text-gold mb-4">Customer Care</div>
        <h1 className="font-display text-5xl md:text-6xl">
          Refund &amp; <span className="text-gradient-gold italic">Return Policy</span>
        </h1>
        <p className="mt-6 text-muted-foreground text-sm">
          At ZXG Wellness, we stand behind the quality of our products and strive to ensure every
          customer has a positive experience.
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-luxury text-gold/60">
          Last updated: March 14, 2026
        </p>
      </motion.div>

      <div className="border-t border-gold/15">
        <Section title="Returns" index={0}>
          <p>
            Due to the nature of health, wellness, and personal care products, returns are generally
            not accepted once an item has been opened or used.
          </p>
          <p>To be eligible for a return, the item must:</p>
          <ul className="space-y-2 mt-2">
            {[
              "Be unused and in the same condition that you received it",
              "Be in the original packaging",
              "Be returned within 30 days of delivery",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-gold mt-0.5">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>Proof of purchase (order confirmation or receipt) is required for all returns.</p>
        </Section>

        <Section title="Damaged, Missing, or Incorrect Items" index={1}>
          <p>
            If your order arrives damaged, defective, or incorrect, please contact us within{" "}
            <span className="text-foreground">7 days of delivery</span>.
          </p>
          <p>When contacting us, please include:</p>
          <ul className="space-y-2 mt-2">
            {[
              "Your order number",
              "Photos of the item and packaging",
              "A brief description of the issue",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-gold mt-0.5">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>Once reviewed, we will either send a replacement item or issue a refund to your original payment method.</p>
        </Section>

        <Section title="Non-Returnable Items" index={2}>
          <p>The following items cannot be returned for safety and hygiene reasons:</p>
          <ul className="space-y-2 mt-2">
            {[
              "Opened or used health products",
              "Supplements or consumable products once opened",
              "Personal care items once opened",
              "Clearance or final sale items",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-gold mt-0.5">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Refund Process" index={3}>
          <p>If your return is approved:</p>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            {[
              {
                step: "01",
                title: "Refund Processing",
                desc: "Refunds will be processed to the original payment method.",
              },
              {
                step: "02",
                title: "Processing Time",
                desc: "Please allow 5–10 business days for the refund to appear on your statement.",
              },
            ].map((s) => (
              <div key={s.step} className="border border-gold/20 p-5 bg-charcoal">
                <div className="font-display text-3xl text-gradient-gold mb-2">{s.step}</div>
                <div className="text-[10px] uppercase tracking-luxury text-gold mb-2">{s.title}</div>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Shipping Costs" index={4}>
          <p>
            Shipping costs are non-refundable unless the return is due to our error.
          </p>
        </Section>

        <Section title="Order Cancellations" index={5}>
          <p>
            Orders may be canceled before they are shipped. Once an order has been shipped, it
            cannot be canceled.
          </p>
        </Section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.42 }}
          className="py-10"
        >
          <h2 className="font-display text-2xl md:text-3xl mb-5">Contact Us</h2>
          <p className="text-foreground/75 text-sm leading-relaxed mb-6">
            If you have any questions regarding your order or this policy, please reach out — we
            read every message personally.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-colors glow-gold-sm"
          >
            Contact Us →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
