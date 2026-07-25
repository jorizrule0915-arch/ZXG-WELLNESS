import { Link } from "@tanstack/react-router";
import footerLogo from "@/assets/Logo/FOoter logo.png";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { Instagram } from "lucide-react";

export function Footer() {
  const instagramUrl = String(import.meta.env.VITE_INSTAGRAM_URL ?? "").trim();

  return (
    <footer className="border-t border-gold/15 bg-charcoal mt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <img src={footerLogo} alt="ZXG Wellness" className="h-24 w-auto" />
          <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
            A luxury wellness brand — premium, editorial, considered. Crafted in small batches for
            those who pursue equilibrium.
          </p>
          <div className="mt-7 text-[10px] uppercase tracking-luxury text-gold">
            Wellness notes, product education, and launches
          </div>
          <NewsletterSignup />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-luxury text-gold mb-4">Explore</div>
          <ul className="space-y-3 text-sm text-foreground/75">
            <li>
              <Link to="/products" className="hover:text-gold">
                Products
              </Link>
            </li>
            <li>
              <Link to="/blog" className="hover:text-gold">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/how-to-use" className="hover:text-gold">
                How to Use
              </Link>
            </li>
            <li>
              <Link to="/reusable-pen-difference" className="hover:text-gold">
                Pen Diff
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-gold">
                About
              </Link>
            </li>
            <li>
              <Link to="/returns" className="hover:text-gold">
                Returns
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-gold">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-luxury text-gold mb-4">Contact</div>
          <ul className="space-y-3 text-sm text-foreground/75">
            <li>
              <a href="mailto:g@zxgwellness.com" className="transition-colors hover:text-gold">
                g@zxgwellness.com
              </a>
            </li>
          </ul>

          {instagramUrl && (
            <div className="mt-8">
              <div className="mb-4 text-[10px] uppercase tracking-luxury text-gold">
                Connect with us
              </div>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Follow ZXG Wellness on Instagram"
                className="group inline-flex items-center gap-3 border border-gold/20 bg-obsidian/40 px-4 py-3 text-sm text-foreground/75 transition-all hover:border-gold/60 hover:text-gold"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-gold/5 transition-colors group-hover:bg-gold group-hover:text-obsidian">
                  <Instagram className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-[10px] uppercase tracking-wide text-gold">
                    Instagram
                  </span>
                  <span className="mt-0.5 block text-xs">Follow ZXG Wellness</span>
                </span>
              </a>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-gold/10 py-6 text-center text-[11px] uppercase tracking-luxury text-muted-foreground">
        © {new Date().getFullYear()} ZXG Wellness — All rights reserved
      </div>
    </footer>
  );
}
