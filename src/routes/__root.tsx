import { Outlet, createRootRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { HelmetProvider } from "react-helmet-async";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartDrawer } from "@/components/site/CartDrawer";
import { AuthProvider } from "@/lib/auth";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const nav = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        nav({ to: "/reset-password" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  return (
    <HelmetProvider>
      <AuthProvider>
        {!isAdmin && <Header />}
        <main className={`min-h-screen ${isAdmin ? "" : "pt-16"}`}>
          <Outlet />
        </main>
        {!isAdmin && <Footer />}
        {!isAdmin && <CartDrawer />}
        <Analytics />
      </AuthProvider>
    </HelmetProvider>
  );
}
