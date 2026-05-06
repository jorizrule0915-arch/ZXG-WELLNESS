import { Link } from "@tanstack/react-router";
import footerLogo from "@/assets/Logo/FOoter logo.png";

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-charcoal mt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <img src={footerLogo} alt="ZXG Wellness" className="h-24 w-auto" />
          <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
            A luxury wellness brand — premium, editorial, considered. Crafted in small batches for
            those who pursue equilibrium.
          </p>
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
            <li>g@zxgwellness.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gold/10 py-6 text-center text-[11px] uppercase tracking-luxury text-muted-foreground">
        © {new Date().getFullYear()} ZXG Wellness — All rights reserved
      </div>
    </footer>
  );
}
