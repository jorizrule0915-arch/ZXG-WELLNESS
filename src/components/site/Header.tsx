import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Moon, ShoppingBag, Menu, Sun, X, User } from "lucide-react";
import { useCart, cartCount } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import headerLogo from "@/assets/Logo/Header Nav Logo.png";

type NavTo =
  | "/"
  | "/products"
  | "/blog"
  | "/reusable-pen-difference"
  | "/how-to-use"
  | "/about"
  | "/returns"
  | "/contact";

type NavLink = {
  to: NavTo;
  label: string;
};

const links: readonly NavLink[] = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/blog", label: "Blog" },
] as const;

const learnLinks: readonly NavLink[] = [
  { to: "/reusable-pen-difference", label: "Pen Diff" },
  { to: "/how-to-use", label: "How to Use" },
] as const;

const supportLinks: readonly NavLink[] = [
  { to: "/about", label: "About" },
  { to: "/returns", label: "Returns" },
  { to: "/contact", label: "Contact" },
] as const;

type Theme = "light" | "dark";

const themeStorageKey = "zxg-theme";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const storedTheme = window.localStorage.getItem(themeStorageKey);
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);
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

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  useEffect(() => setMobileOpen(false), [pathname]);

  const count = cartCount(items);
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-[0_12px_35px_-28px_rgba(0,0,0,0.7)]"
          : "bg-background/80 backdrop-blur-md border-b border-border/70"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-[68px] flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={headerLogo} alt="ZXG Wellness" className="h-10 w-auto" />
        </Link>

        <nav className="hidden xl:flex items-center gap-8">
          {links.map((link) => {
            const active = isRouteActive(pathname, link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className="group relative text-[13px] uppercase tracking-widest text-foreground hover:text-gold transition-colors font-medium"
              >
                {link.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-300 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
          <DesktopSubNav
            label="Learn"
            links={learnLinks}
            pathname={pathname}
            active={learnLinks.some((link) => isRouteActive(pathname, link.to))}
          />
          <DesktopSubNav
            label="Support"
            links={supportLinks}
            pathname={pathname}
            active={supportLinks.some((link) => isRouteActive(pathname, link.to))}
          />
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(nextTheme)}
            aria-label={`Switch to ${nextTheme} mode`}
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-[11px] uppercase tracking-widest text-foreground/85 transition-colors hover:border-gold/60 hover:text-gold"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.5} />
            )}
            <span className="hidden lg:inline">{nextTheme}</span>
          </button>
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
            className="xl:hidden p-2.5 text-foreground/90 hover:text-gold transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`xl:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl transition-[max-height] duration-500 ${
          mobileOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col py-2 px-6">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="py-4 text-[15px] uppercase tracking-widest text-foreground font-medium hover:text-gold border-b border-gold/10 last:border-0 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <MobileNavGroup label="Learn" links={learnLinks} />
          <MobileNavGroup label="Support" links={supportLinks} />
          <button
            onClick={() => setTheme(nextTheme)}
            className="flex items-center justify-between py-4 text-[15px] uppercase tracking-widest text-foreground font-medium hover:text-gold transition-colors"
          >
            <span>{nextTheme} Mode</span>
            {theme === "dark" ? (
              <Sun className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

function DesktopSubNav({
  label,
  links,
  pathname,
  active,
}: {
  label: string;
  links: readonly NavLink[];
  pathname: string;
  active: boolean;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="relative flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-widest text-foreground transition-colors hover:text-gold"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
        <span
          className={`absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-300 ${
            active ? "w-full" : "w-0 group-hover:w-full"
          }`}
        />
      </button>

      <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-4 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="border border-gold/15 bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
          {links.map((link) => {
            const linkActive = isRouteActive(pathname, link.to);

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-4 py-3 text-sm transition-colors hover:bg-gold hover:text-obsidian ${
                  linkActive ? "text-gold" : "text-foreground/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobileNavGroup({ label, links }: { label: string; links: readonly NavLink[] }) {
  return (
    <div className="border-b border-gold/10 py-3">
      <div className="pb-2 text-[11px] uppercase tracking-widest text-gold">{label}</div>
      <div className="grid gap-1">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="py-2 text-sm uppercase tracking-widest text-foreground/80 transition-colors hover:text-gold"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function isRouteActive(pathname: string, to: NavTo) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}
