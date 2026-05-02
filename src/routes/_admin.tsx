import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    const { data: isAdmin, error } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (error || !isAdmin) {
      throw redirect({ to: "/account" });
    }
  },
  component: AdminLayout,
});

const navItems: {
  to: "/admin" | "/admin/products" | "/admin/orders";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="-mt-16 min-h-screen bg-obsidian flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gold/15 bg-charcoal min-h-screen sticky top-0 hidden md:flex flex-col">
        <div className="px-6 py-8 border-b border-gold/15">
          <div className="font-display text-3xl text-gold tracking-luxury">ZXG</div>
          <div className="text-[10px] uppercase tracking-luxury text-muted-foreground mt-1">
            Atelier Admin
          </div>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-luxury transition-all ${
                  active
                    ? "bg-gold text-obsidian"
                    : "text-foreground/70 hover:text-gold hover:bg-surface"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gold/15">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-luxury text-muted-foreground hover:text-gold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Storefront
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-40 bg-charcoal border-b border-gold/15 flex items-center justify-between px-4">
        <div className="font-display text-xl text-gold tracking-luxury">ZXG Admin</div>
        <Link to="/" className="text-[10px] uppercase tracking-luxury text-muted-foreground">
          Exit
        </Link>
      </div>

      <main
        className={`flex-1 min-w-0 pt-14 md:pt-0 ${mounted ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}
      >
        {/* Mobile nav tabs */}
        <div className="md:hidden flex border-b border-gold/15 bg-charcoal">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 text-center py-3 text-[10px] uppercase tracking-luxury ${
                  active ? "text-gold border-b-2 border-gold" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <Outlet />
      </main>
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
