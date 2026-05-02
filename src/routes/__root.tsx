import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartDrawer } from "@/components/site/CartDrawer";
import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl text-gradient-gold">404</h1>
        <h2 className="mt-4 font-display text-2xl">Page not found</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you seek has dissolved into the ether.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block px-8 py-3 bg-gold text-obsidian text-[11px] uppercase tracking-luxury hover:bg-gold-light transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ZXG Wellness — Luxury Wellness Atelier" },
      {
        name: "description",
        content:
          "ZXG Wellness — luxury, editorial wellness for those who pursue equilibrium. Adaptogenic elixirs, restorative skincare, ceremonial apothecary.",
      },
      { property: "og:title", content: "ZXG Wellness — Luxury Wellness Atelier" },
      { property: "og:description", content: "Black & gold luxury wellness, ritually crafted." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Header />
      <main className="min-h-screen pt-16">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </AuthProvider>
  );
}
