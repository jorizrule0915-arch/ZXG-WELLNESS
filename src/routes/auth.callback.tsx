import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({ component: AuthCallback });

function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          nav({ to: "/login" });
          return;
        }
        // /auth/callback is only used for password recovery — always go to reset
        nav({ to: "/reset-password" });
      });
    } else {
      // Implicit/hash flow
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          nav({ to: "/reset-password" });
        } else if (event === "SIGNED_IN") {
          nav({ to: "/reset-password" });
        }
      });
      return () => sub.subscription.unsubscribe();
    }
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Verifying…</p>
    </div>
  );
}
