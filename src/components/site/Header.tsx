import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useCart, cartCount } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import headerLogo from "@/assets/Logo/Header Nav Logo.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/how-to-use", label: "How to Use" },
  { to: "/about", label: "About" },
  { to: "/returns", label: "Returns" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const count = cartCount(items);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-obsidian/85 backdrop-blur-xl border-b border-gold/20"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={headerLogo} alt="ZXG Wellness" className="h-10 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className="group relative text-[11px] uppercase tracking-luxury text-foreground/80 hover:text-gold transition-colors"
              >
                {l.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-300 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            to={user ? "/account" : "/login"}
            aria-label={user ? "My account" : "Sign in"}
            className="p-2.5 text-foreground/90 hover:text-gold transition-colors"
          >
            <User className="h-5 w-5" strokeWidth={1.25} />
          </Link>
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative p-2.5 text-foreground/90 hover:text-gold transition-colors"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-gold text-obsidian text-[10px] font-semibold flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Open menu"
            className="md:hidden p-2.5 text-foreground/90 hover:text-gold transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden border-t border-gold/15 bg-obsidian/95 backdrop-blur-xl transition-[max-height] duration-500 ${
          mobileOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col py-4 px-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="py-3 text-sm uppercase tracking-luxury text-foreground/85 hover:text-gold border-b border-gold/10 last:border-0"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
