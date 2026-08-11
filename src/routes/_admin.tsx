import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Toaster } from "sonner";
import adminLogo from "@/assets/Logo/official/gxz-wordmark-dark.webp";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin")({ component: AdminLayout });

const navItems: {
  to: "/admin" | "/admin/products" | "/admin/orders" | "/admin/users";
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}[] = [
  {
    to: "/admin",
    label: "Overview",
    description: "Store performance",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/admin/orders",
    label: "Orders",
    description: "Fulfillment & tracking",
    icon: ShoppingCart,
  },
  { to: "/admin/products", label: "Products", description: "Catalog & inventory", icon: Package },
  { to: "/admin/users", label: "Customers", description: "Accounts & access", icon: Users },
];

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const [checking, setChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      if (!isAdmin) {
        navigate({ to: "/account" });
        return;
      }
      setChecking(false);
    })();
  }, [navigate]);

  useEffect(() => setMobileMenuOpen(false), [pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d10] text-sm text-slate-400">
        Loading admin workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d10] text-slate-100 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/[0.07] bg-[#101318] lg:flex">
        <div className="flex h-20 items-center border-b border-white/[0.07] px-6">
          <img
            src={adminLogo}
            alt="GXZ Health and Wellness"
            className="h-9 w-auto object-contain"
          />
        </div>

        <div className="px-4 py-5">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>
          <nav className="mt-3 space-y-1" aria-label="Admin navigation">
            {navItems.map((item) => (
              <AdminNavLink key={item.to} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/[0.07] p-4">
          <Link
            to="/"
            className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            View storefront
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#101318]/95 px-4 backdrop-blur lg:hidden">
          <img src={adminLogo} alt="GXZ Health and Wellness" className="h-8 w-auto" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-slate-300"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle admin navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-16 z-30 border-b border-white/10 bg-[#101318] p-3 shadow-2xl lg:hidden">
            <nav className="space-y-1" aria-label="Mobile admin navigation">
              {navItems.map((item) => (
                <AdminNavLink key={item.to} item={item} pathname={pathname} />
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-3">
              <Link
                to="/"
                className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 text-sm text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" /> Store
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 text-sm text-slate-300"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        )}

        <main className="min-h-screen min-w-0 bg-[#0b0d10]">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster theme="dark" position="top-right" richColors />
    </div>
  );
}

function AdminNavLink({ item, pathname }: { item: (typeof navItems)[number]; pathname: string }) {
  const active = item.exact
    ? pathname === "/admin" || pathname === "/admin/"
    : pathname.startsWith(item.to);
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className={`flex min-h-12 items-center gap-3 rounded-md px-3 transition-colors ${
        active
          ? "bg-[#c9a84c]/12 text-[#e3c66e]"
          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{item.label}</span>
        <span
          className={`block truncate text-[11px] ${active ? "text-[#c9a84c]/65" : "text-slate-600"}`}
        >
          {item.description}
        </span>
      </span>
    </Link>
  );
}
