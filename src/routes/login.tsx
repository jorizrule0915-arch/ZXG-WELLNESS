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
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 8000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    // Don't redirect if this is a password recovery flow
    const params = new URLSearchParams(window.location.search);
    if (params.get("type") === "recovery") return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const redirectTo = getSafeRedirectPath(params);
      if (redirectTo) { window.location.assign(redirectTo); return; }
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
    setSuccess(null);
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      setLoading(false);
      if (error) { setErr(error.message); return; }
      setSuccess("✓ Reset link sent! Check your inbox. If you don't see it, check your spam folder — mark it as 'Not Spam' and then click the reset link.");
      return;
    }

    const { error } =
      mode === "signin" ? await signIn(email, password) : await signUp(email, password, name);
    setLoading(false);
    if (error) { setErr(error); return; }
    const redirectTo = getSafeRedirectPath(new URLSearchParams(window.location.search));
    if (redirectTo) { window.location.assign(redirectTo); return; }
    const { data: { session } } = await supabase.auth.getSession();
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

  const title = mode === "signin" ? "Welcome back" : mode === "signup" ? "Begin" : "Reset Password";
  const subtitle =
    mode === "signin" ? "Enter your credentials to continue."
    : mode === "signup" ? "Create your private account."
    : "Enter your email and we'll send a reset link.";
  const btnLabel =
    mode === "signin" ? "Sign In →"
    : mode === "signup" ? "Create Account →"
    : "Send Reset Link →";

  return (
    <>
      {/* Toast popup */}
      <AnimatePresence>
        {success && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md bg-obsidian border border-emerald-500/50 shadow-2xl px-5 py-4 flex items-start gap-3"
          >
            <span className="text-emerald-400 text-lg leading-none mt-0.5">✓</span>
            <div className="flex-1">
              <p className="text-emerald-400 text-xs leading-relaxed">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-white/40 hover:text-white/80 text-sm leading-none ml-2 mt-0.5 transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">Member Access</div>
            <h1 className="font-display text-5xl">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="bg-charcoal border border-gold/20 p-8 backdrop-blur-sm">
            <form onSubmit={onSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Field label="Full name" value={name} onChange={setName} required />
                  </motion.div>
                )}
              </AnimatePresence>

              <Field label="Email" type="email" value={email} onChange={setEmail} required />

              {mode !== "forgot" && (
                <Field label="Password" type="password" value={password} onChange={setPassword} canToggleVisibility required />
              )}

              {err && (
                <div className="text-[11px] text-destructive border border-destructive/30 bg-destructive/10 px-3 py-2">{err}</div>
              )}


              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-colors disabled:opacity-50 glow-gold-sm"
              >
                {loading ? "…" : btnLabel}
              </button>
            </form>

            <div className="mt-6 space-y-2">
              {mode === "signin" && (
                <button
                  onClick={() => { setMode("forgot"); setErr(null); setSuccess(null); }}
                  className="w-full text-center text-[11px] uppercase tracking-luxury text-muted-foreground hover:text-gold transition-colors"
                >
                  Forgot password?
                </button>
              )}
              <button
                onClick={() => {
                  setMode(mode === "signup" ? "signin" : mode === "forgot" ? "signin" : "signup");
                  setErr(null); setSuccess(null);
                }}
                className="w-full text-center text-[11px] uppercase tracking-luxury text-muted-foreground hover:text-gold transition-colors"
              >
                {mode === "signin" ? "No account? Create one →"
                  : mode === "signup" ? "Already a member? Sign in →"
                  : "Back to sign in →"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="text-[11px] uppercase tracking-luxury text-muted-foreground hover:text-gold">
              ← Return to store
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function Field({ label, value, onChange, type = "text", canToggleVisibility = false, required }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; canToggleVisibility?: boolean; required?: boolean;
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
          <button type="button" onClick={() => setVisible((c) => !c)} aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-gold transition-colors">
            <VisibilityIcon className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </span>
    </label>
  );
}
