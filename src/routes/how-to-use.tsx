import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Syringe,
  Droplet,
  Shield,
  Thermometer,
} from "lucide-react";

export const Route = createFileRoute("/how-to-use")({
  component: HowToUsePage,
});

const videoInstructions = [
  {
    title: "How to use your pen",
    videoId: "7UOZ6iLO3JQ",
    description:
      "A step-by-step guide on how to properly operate your refillable injection pen, from setup to correct usage.",
  },
  {
    title: "What to expect when you receive your pen",
    videoId: "g5kVjiQakKs",
    description:
      "An overview of what comes in the package, how your pen is delivered, and important things to check before first use.",
  },
  {
    title: "How to reconstitute your compound",
    videoId: "djPEGo9uurk",
    description:
      "This video explains the proper method for reconstituting your compound, including handling and mixing guidelines.",
  },
  {
    title: "How to reconstitute your peptide",
    videoId: "SK1F6bqY0Qg",
    description:
      "Learn the correct way to safely mix your peptide to ensure proper preparation and accurate dosing.",
  },
  {
    title: "How to attach the needle to your pen",
    videoId: "bwZc9CwRLLg",
    description:
      "A simple tutorial on how to securely attach the needle to your pen for safe and proper use.",
  },
];

const tutorialSteps = [
  {
    step: 1,
    title: "Gather Supplies",
    instruction: "Gather pen, cartridge, needles, alcohol swabs, Compound, and syringe.",
    category: "prep",
  },
  {
    step: 2,
    title: "Prepare Area",
    instruction: "Wash hands and clean work surface.",
    category: "prep",
  },
  {
    step: 3,
    title: "Attach Needle",
    instruction: "Twist reconstitution needle onto syringe until secure.",
    category: "prep",
  },
  {
    step: 4,
    title: "Prepare Vial",
    instruction: "Remove cap and clean rubber top with alcohol swab.",
    category: "prep",
  },
  {
    step: 5,
    title: "Fill Syringe",
    instruction: "Pull syringe plunger back to 3 mL.",
    category: "fill",
  },
  {
    step: 6,
    title: "Inject Air",
    instruction: "Insert needle into vial and push 3 mL air inside.",
    category: "fill",
  },
  {
    step: 7,
    title: "Draw Compound",
    instruction: "Turn vial upside down and draw 3 mL Compound into syringe.",
    category: "fill",
  },
  {
    step: 8,
    title: "Secure Syringe",
    instruction: "Recap syringe and place on clean surface.",
    category: "fill",
  },
  {
    step: 9,
    title: "Open Pen",
    instruction: "Remove pen cap and unscrew chamber from body.",
    category: "assembly",
  },
  {
    step: 10,
    title: "Insert Cartridge",
    instruction: "Remove cartridge from packaging and place in chamber.",
    category: "assembly",
  },
  {
    step: 11,
    title: "Reassemble",
    instruction: "Push plunger in, attach chamber back to pen firmly.",
    category: "assembly",
  },
  {
    step: 12,
    title: "Clean Stopper",
    instruction: "Clean rubber stopper on cartridge with alcohol swab.",
    category: "assembly",
  },
  {
    step: 13,
    title: "Insert Vent",
    instruction: "Insert venting needle slightly into stopper (off to side).",
    category: "fill",
  },
  {
    step: 14,
    title: "Fill Cartridge",
    instruction: "Insert syringe needle next to vent and inject liquid slowly.",
    category: "fill",
  },
  {
    step: 15,
    title: "Remove Needles",
    instruction: "Remove syringe and venting needle, recap both safely.",
    category: "fill",
  },
  {
    step: 16,
    title: "Attach Pen Needle",
    instruction: "Twist pen needle onto chamber, remove outer and inner caps.",
    category: "assembly",
  },
  {
    step: 17,
    title: "Prime Pen",
    instruction: "Hold upright, dial and push until bubbles escape and liquid appears.",
    category: "use",
  },
  {
    step: 18,
    title: "Storage",
    instruction: "If not using immediately, recap needle and store in cool, dry place.",
    category: "use",
  },
  {
    step: 19,
    title: "Set Dose",
    instruction: "Dial the number of units you want to inject.",
    category: "use",
  },
  {
    step: 20,
    title: "Prepare Site",
    instruction: "Clean injection area with alcohol swab.",
    category: "use",
  },
  {
    step: 21,
    title: "Inject",
    instruction: "Hold pen at 90° angle, press down and push button to zero.",
    category: "use",
  },
  {
    step: 22,
    title: "Complete",
    instruction: "Wait few seconds, remove pen, recap needle, unscrew and store safely.",
    category: "use",
  },
];

const JPEG_STEPS = new Set([1, 4, 5, 6, 17]);

const categories = {
  prep: { label: "Preparation", color: "bg-gold/20 text-gold border-gold/30" },
  fill: { label: "Filling", color: "bg-gold/10 text-gold-light border-gold/20" },
  assembly: { label: "Assembly", color: "bg-gold/15 text-gold border-gold/25" },
  use: { label: "Usage", color: "bg-gold/20 text-gold border-gold/30" },
} as const;

const safetyTips = [
  { icon: Syringe, text: "Always use single-use needles" },
  { icon: Droplet, text: "Keep area sterile" },
  { icon: Shield, text: "Follow proper technique" },
  { icon: Thermometer, text: "Store at proper temperature" },
];

function HowToUsePage() {
  const [selectedStep, setSelectedStep] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const currentStep = tutorialSteps.find((s) => s.step === selectedStep)!;
  const ext = JPEG_STEPS.has(selectedStep) ? "jpeg" : "jpg";

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && selectedStep > 1) setSelectedStep((s) => s - 1);
      if (e.key === "ArrowRight" && selectedStep < 22) setSelectedStep((s) => s + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedStep]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const dist = touchStart - touchEnd;
    if (dist > 50 && selectedStep < 22) setSelectedStep((s) => s + 1);
    if (dist < -50 && selectedStep > 1) setSelectedStep((s) => s - 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-gold/5 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[11px] uppercase tracking-luxury text-gold mb-4">
              Step-by-Step Guide
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-light text-foreground leading-tight mb-6">
              How to Use Your <span className="text-gradient-gold italic">Refillable Pen</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Follow this interactive 22-step guide to safely prepare and use your injection pen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tutorial */}
      <section className="pb-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar */}
            <div className="bg-charcoal border border-gold/15 rounded-sm h-fit lg:sticky lg:top-24">
              <div className="px-4 py-4 border-b border-gold/10">
                <h3 className="font-display text-sm uppercase tracking-luxury text-gold">
                  All Steps
                </h3>
              </div>
              <div className="max-h-[520px] overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                {tutorialSteps.map((step) => {
                  const active = selectedStep === step.step;
                  const done = step.step < selectedStep;
                  return (
                    <button
                      key={step.step}
                      onClick={() => setSelectedStep(step.step)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200 rounded-sm ${
                        active
                          ? "bg-gold/10 border border-gold/30"
                          : "hover:bg-gold/5 border border-transparent"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 shrink-0 rounded-sm flex items-center justify-center text-[11px] font-semibold transition-colors ${
                          active
                            ? "bg-gold text-obsidian"
                            : done
                              ? "bg-gold/20 text-gold"
                              : "bg-surface-2 text-muted-foreground"
                        }`}
                      >
                        {done && !active ? <Check className="w-3.5 h-3.5" /> : step.step}
                      </span>
                      <span
                        className={`text-[12px] truncate transition-colors ${
                          active
                            ? "text-gold font-medium"
                            : done
                              ? "text-foreground/60"
                              : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main content */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedStep}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  className="bg-charcoal border border-gold/15 rounded-sm overflow-hidden"
                >
                  {/* Image */}
                  <div className="h-64 md:h-96 relative bg-surface flex items-center justify-center overflow-hidden">
                    <img
                      src={`/step-images/Step ${selectedStep}.${ext}`}
                      alt={`Step ${selectedStep}: ${currentStep.title}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement;
                        t.style.display = "none";
                        const fb = t.nextElementSibling as HTMLElement | null;
                        if (fb) fb.classList.remove("hidden");
                      }}
                    />
                    {/* Fallback */}
                    <div className="absolute inset-0 hidden flex-col items-center justify-center">
                      <span className="font-display text-6xl text-gold/30">{selectedStep}</span>
                      <p className="text-muted-foreground text-xs mt-2">Step illustration</p>
                    </div>

                    {/* Category badge */}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 text-[10px] uppercase tracking-luxury border rounded-sm ${
                          categories[currentStep.category as keyof typeof categories].color
                        }`}
                      >
                        {categories[currentStep.category as keyof typeof categories].label}
                      </span>
                    </div>

                    {/* Step number overlay */}
                    <div className="absolute top-4 left-4">
                      <span className="font-display text-4xl text-gold/20 select-none leading-none">
                        {String(selectedStep).padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-8">
                    <p className="text-[11px] uppercase tracking-luxury text-muted-foreground mb-3">
                      Step {selectedStep} of 22 &nbsp;·&nbsp;{" "}
                      {categories[currentStep.category as keyof typeof categories].label}
                    </p>

                    <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
                      {currentStep.title}
                    </h2>

                    <p className="text-muted-foreground text-base leading-relaxed mb-8">
                      {currentStep.instruction}
                    </p>

                    {/* Progress */}
                    <div className="mb-8">
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-2 uppercase tracking-luxury">
                        <span>Progress</span>
                        <span>{Math.round((selectedStep / 22) * 100)}%</span>
                      </div>
                      <div className="h-px bg-gold/10 relative overflow-visible">
                        <motion.div
                          className="h-px bg-gradient-to-r from-gold-dark to-gold absolute top-0 left-0"
                          initial={{ width: 0 }}
                          animate={{ width: `${(selectedStep / 22) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                        {/* Glow dot */}
                        <motion.div
                          className="absolute -top-1 w-2 h-2 rounded-full bg-gold shadow-glow-sm"
                          animate={{ left: `${(selectedStep / 22) * 100}%` }}
                          transition={{ duration: 0.3 }}
                          style={{ translateX: "-50%" }}
                        />
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedStep((s) => Math.max(1, s - 1))}
                        disabled={selectedStep === 1}
                        className="flex items-center gap-2 px-5 py-2.5 border border-gold/20 text-gold text-[11px] uppercase tracking-luxury hover:bg-gold/5 transition-colors disabled:opacity-30 disabled:pointer-events-none rounded-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      <span className="text-[10px] uppercase tracking-luxury text-muted-foreground hidden md:block">
                        Arrow keys or swipe to navigate
                      </span>

                      <button
                        onClick={() => setSelectedStep((s) => Math.min(22, s + 1))}
                        disabled={selectedStep === 22}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gold text-obsidian text-[11px] uppercase tracking-luxury hover:bg-gold-light transition-colors disabled:opacity-30 disabled:pointer-events-none rounded-sm"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Video Instructions */}
      <section className="py-20 border-t border-gold/10 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[11px] uppercase tracking-luxury text-gold mb-3">Visual Guides</p>
            <h2 className="font-display text-3xl md:text-5xl font-light text-foreground mb-4">
              Video Instructions
            </h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              Watch these detailed guides for step-by-step visual instructions.
            </p>
          </motion.div>

          <div className="space-y-20">
            {videoInstructions.map((video, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={video.videoId}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className={`grid md:grid-cols-2 gap-10 items-center`}
                >
                  <div className={isEven ? "md:order-1" : "md:order-2"}>
                    <div className="relative w-full overflow-hidden rounded-sm border border-gold/15 pt-[56.25%] shadow-[0_0_40px_-10px_rgba(0,0,0,0.8)]">
                      <iframe
                        src={`https://www.youtube.com/embed/${video.videoId}?rel=0`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full"
                      />
                    </div>
                  </div>

                  <div className={`${isEven ? "md:order-2" : "md:order-1"} space-y-4`}>
                    <p className="text-[11px] uppercase tracking-luxury text-gold">0{index + 1}</p>
                    <h3 className="font-display text-2xl md:text-3xl font-light text-foreground capitalize leading-tight">
                      {video.title}
                    </h3>
                    <div className="w-8 h-px bg-gold/40" />
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="py-20 border-t border-gold/10 bg-charcoal px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 border border-gold/30 flex items-center justify-center rounded-sm">
              <AlertTriangle className="w-5 h-5 text-gold" strokeWidth={1.25} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-luxury text-gold">Important</p>
              <h3 className="font-display text-2xl font-light text-foreground">
                Safety Essentials
              </h3>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {safetyTips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-surface border border-gold/10 rounded-sm p-6 text-center hover:border-gold/25 transition-colors"
              >
                <div className="w-10 h-10 mx-auto border border-gold/20 rounded-sm flex items-center justify-center mb-4">
                  <tip.icon className="w-5 h-5 text-gold" strokeWidth={1.25} />
                </div>
                <p className="text-[12px] text-foreground/80 leading-relaxed">{tip.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-gold/10 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-lg"
        >
          <p className="font-display text-2xl md:text-3xl font-light text-foreground mb-2">
            Ready to begin?
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            Shop our full range of performance and wellness products.
          </p>
          <Link
            to="/products"
            className="inline-block px-10 py-3 bg-gold text-obsidian text-[11px] uppercase tracking-luxury hover:bg-gold-light transition-colors rounded-sm"
          >
            View Our Products
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
