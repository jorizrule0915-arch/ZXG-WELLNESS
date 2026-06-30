import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{
    error: string | null;
    needsEmailConfirmation?: boolean;
    welcomeEmailSent?: boolean;
    welcomeEmailError?: string | null;
  }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Listener FIRST (per Supabase auth recipe)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Defer role fetch to avoid deadlocks inside the callback
        setTimeout(() => loadAdminStatus(s.user.id), 0);
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadAdminStatus(s.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const loadAdminStatus = async (uid: string) => {
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: uid,
      _role: "admin",
    });

    if (error) {
      console.error("[Auth] Unable to load admin status:", error?.message ?? "Unknown error");
      setIsAdmin(false);
      return;
    }

    setIsAdmin(Boolean(data));
  };

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthCtx["signUp"] = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });

    if (error) return { error: error.message };

    const welcomeEmail = await sendWelcomeEmail(email, fullName, data.user?.id ?? null);

    return {
      error: null,
      needsEmailConfirmation: !data.session,
      welcomeEmailSent: welcomeEmail.sent,
      welcomeEmailError: welcomeEmail.error,
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}

async function sendWelcomeEmail(email: string, fullName: string, userId: string | null) {
  try {
    const res = await fetch("/api/welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName, userId }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      return {
        sent: false,
        error: data?.error || "Welcome email could not be sent.",
      };
    }

    return { sent: true, error: null };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Welcome email could not be sent.",
    };
  }
}
