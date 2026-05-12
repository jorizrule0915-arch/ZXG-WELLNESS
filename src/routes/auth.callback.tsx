import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({ component: AuthCallback });

function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const type = params.get("type");
    const next = params.get("next") ?? "/reset-password";

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          nav({ to: "/login" });
          return;
        }
        if (type === "recovery") {
          nav({ to: "/reset-password" });
        } else {
          nav({ to: next as any });
        }
      });
    } else {
      // Check hash for implicit flow tokens
      supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          nav({ to: "/reset-password" });
        } else if (event === "SIGNED_IN") {
          nav({ to: "/" });
        }
      });
    }
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Verifying…</p>
    </div>
  );
}
