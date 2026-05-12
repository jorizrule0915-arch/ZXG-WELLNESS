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

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          nav({ to: "/login" });
          return;
        }
        // Check if this is a password recovery session
        const isRecovery =
          type === "recovery" ||
          data?.session?.user?.recovery_sent_at != null;

        if (isRecovery) {
          nav({ to: "/reset-password" });
        } else {
          nav({ to: "/account" });
        }
      });
    } else {
      // No code — listen for auth state
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          nav({ to: "/reset-password" });
        } else if (event === "SIGNED_IN") {
          nav({ to: "/account" });
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
