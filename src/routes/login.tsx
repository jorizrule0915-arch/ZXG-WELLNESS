import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function getSafeRedirectPath(searchParams: URLSearchParams) {
  const redirectTo = searchParams.get("redirect");
  if (!redirectTo?.startsWith("/") || redirectTo.startsWith("//")) return null;
  return redirectTo;
}

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const redirectTo = getSafeRedirectPath(new URLSearchParams(window.location.search));
      if (redirectTo) {
        window.location.assign(redirectTo);
        return;
      }
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: data.session.user.id,
        _role: "admin",
      });
      nav({ to: isAdmin ? "/admin" : "/account" });
    });
  }, [nav]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } =
      mode === "signin" ? await signIn(email, password) : await signUp(email, password, name);
    setLoading(false);
    if (error) {
      setErr(error);
      return;
    }
    const redirectTo = getSafeRedirectPath(new URLSearchParams(window.location.search));
    if (redirectTo) {
      window.location.assign(redirectTo);
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      nav({ to: isAdmin ? "/admin" : "/account" });
    } else {
      nav({ to: "/account" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In — ZXG Wellness</title>
      </Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">
              Atelier Access
            </div>
            <h1 className="font-display text-5xl">
              {mode === "signin" ? "Welcome back" : "Begin"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Enter your credentials to continue."
                : "Create your private atelier account."}
            </p>
          </div>

          <div className="bg-charcoal border border-gold/20 p-8 backdrop-blur-sm">
            <form onSubmit={onSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Field label="Full name" value={name} onChange={setName} required />
                  </motion.div>
                )}
              </AnimatePresence>
              <Field label="Email" type="email" value={email} onChange={setEmail} required />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                canToggleVisibility
                required
              />

              {err && (
                <div className="text-[11px] text-destructive border border-destructive/30 bg-destructive/10 px-3 py-2">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-colors disabled:opacity-50 glow-gold-sm"
              >
                {loading ? "…" : mode === "signin" ? "Sign In →" : "Create Account →"}
              </button>
            </form>

            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setErr(null);
              }}
              className="mt-6 w-full text-center text-[11px] uppercase tracking-luxury text-muted-foreground hover:text-gold"
            >
              {mode === "signin" ? "No account? Create one →" : "Already a member? Sign in →"}
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-[11px] uppercase tracking-luxury text-muted-foreground hover:text-gold"
            >
              ← Return to atelier
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  canToggleVisibility = false,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  canToggleVisibility?: boolean;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const inputType = canToggleVisibility && type === "password" && visible ? "text" : type;
  const VisibilityIcon = visible ? EyeOff : Eye;

  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-luxury text-gold mb-2">{label}</span>
      <span className="relative block">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`w-full bg-transparent border-b border-gold/30 focus:border-gold outline-none py-2 text-sm text-foreground transition-colors ${canToggleVisibility ? "pr-10" : ""}`}
        />
        {canToggleVisibility && (
          <button
            type="button"
            onClick={() => setVisible((c) => !c)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-gold transition-colors"
          >
            <VisibilityIcon className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </span>
    </label>
  );
}
