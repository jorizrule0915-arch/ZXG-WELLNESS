import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const storageKey = "zxg-analytics-consent";
const measurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID ?? "").trim();

function installGoogleAnalytics() {
  if (!measurementId || document.querySelector(`script[data-zxg-ga="${measurementId}"]`)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.zxgGa = measurementId;
  document.head.appendChild(script);
}

export function ConsentAnalytics() {
  const pathname = useRouterState({ select: (state) => state.location.href });
  const [consent, setConsent] = useState<"accepted" | "declined" | null>(() => {
    if (!measurementId || typeof window === "undefined") return null;
    const stored = localStorage.getItem(storageKey);
    return stored === "accepted" || stored === "declined" ? stored : null;
  });

  useEffect(() => {
    if (consent !== "accepted") return;
    installGoogleAnalytics();
    window.gtag?.("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pathname,
    });
  }, [consent, pathname]);

  if (!measurementId || consent) return null;

  return (
    <aside
      aria-label="Analytics preferences"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl border border-gold/30 bg-obsidian p-5 shadow-2xl"
    >
      <p className="text-sm leading-6 text-foreground/85">
        GXZ uses optional analytics to understand website performance. You can accept or decline;
        checkout and essential site features work either way.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(storageKey, "accepted");
            setConsent("accepted");
          }}
          className="bg-gold px-5 py-2 text-[10px] font-semibold uppercase tracking-luxury text-obsidian"
        >
          Accept analytics
        </button>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(storageKey, "declined");
            setConsent("declined");
          }}
          className="border border-gold/30 px-5 py-2 text-[10px] uppercase tracking-luxury text-foreground"
        >
          Decline
        </button>
      </div>
    </aside>
  );
}
