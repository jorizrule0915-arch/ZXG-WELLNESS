const promoMessages = [
  "BIG SALE — 10% OFF WHEN YOU ORDER 5+ PENS",
  "FREE SHIPPING ON ALL ORDERS OVER $50",
] as const;

const marqueeItems = Array.from({ length: 4 }, () => promoMessages).flat();

export function PromoMarquee() {
  return (
    <section
      aria-label="Current GXZ Health and Wellness promotions"
      className="relative z-10 mt-1 overflow-hidden border-y border-[#d4af64]/25 bg-[#050505] text-[#f2ead9] shadow-[0_10px_30px_-28px_rgba(212,175,100,0.9)]"
    >
      <div className="sr-only">
        {promoMessages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>

      <div className="zxg-promo-marquee__viewport relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#050505] to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#050505] to-transparent sm:w-16" />

        <div className="zxg-promo-marquee__track flex w-max items-center py-2.5">
          <PromoMarqueeGroup />
          <PromoMarqueeGroup duplicate />
        </div>
      </div>

      <style>{`
        .zxg-promo-marquee__track {
          animation: zxg-promo-marquee-scroll 26s linear infinite;
          will-change: transform;
        }

        .zxg-promo-marquee__viewport:hover .zxg-promo-marquee__track {
          animation-play-state: paused;
        }

        @keyframes zxg-promo-marquee-scroll {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .zxg-promo-marquee__viewport {
            overflow-x: auto;
            scrollbar-width: thin;
          }

          .zxg-promo-marquee__track {
            animation: none;
            transform: none;
          }

          .zxg-promo-marquee__group--duplicate {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}

function PromoMarqueeGroup({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`zxg-promo-marquee__group flex shrink-0 items-center ${
        duplicate ? "zxg-promo-marquee__group--duplicate" : ""
      }`}
    >
      {marqueeItems.map((message, index) => (
        <div
          key={`${message}-${index}`}
          className="flex shrink-0 items-center whitespace-nowrap px-4 text-[11px] font-medium uppercase leading-none tracking-[0.24em] text-[#f2ead9] sm:px-6 sm:text-xs"
        >
          <span>{message}</span>
          <span className="px-4 text-[10px] text-[#d4af64] sm:px-6" aria-hidden="true">
            ◆
          </span>
        </div>
      ))}
    </div>
  );
}
