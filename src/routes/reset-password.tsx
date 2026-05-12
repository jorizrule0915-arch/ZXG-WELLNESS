import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useState, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      // PKCE flow — exchange code for session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) { setInvalid(true); return; }
        setReady(true);
        // Clean up the URL
        window.history.replaceState({}, "", "/reset-password");
      });
      return;
    }

    // Legacy implicit flow — hash contains access_token
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setReady(true); return; }
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: d }) => {
          if (d.session) setReady(true);
          else setInvalid(true);
        });
      }, 1500);
    });
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setErr("Passwords don't match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
    setTimeout(() => nav({ to: "/account" }), 2500);
  };

  return (
    <>
      <Helmet><title>Reset Password — ZXG Wellness</title></Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">Security</div>
            <h1 className="font-display text-5xl">New Password</h1>
            <p className="mt-3 text-sm text-muted-foreground">Choose a strong new password.</p>
          </div>

          <div className="bg-charcoal border border-gold/20 p-8 backdrop-blur-sm">
            {invalid ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">This reset link is invalid or has expired.</p>
                <Link to="/login" className="block text-[11px] uppercase tracking-luxury text-gold hover:text-gold-light transition-colors">
                  Request a new one →
                </Link>
              </div>
            ) : done ? (
              <div className="text-center space-y-2">
                <div className="text-emerald-400 text-sm">Password updated successfully.</div>
                <p className="text-xs text-muted-foreground">Redirecting to your account…</p>
              </div>
            ) : !ready ? (
              <div className="text-center text-muted-foreground text-sm py-4">Verifying link…</div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <label className="block">
                  <span className="block text-[10px] uppercase tracking-luxury text-gold mb-2">New Password</span>
                  <span className="relative block">
                    <input
                      type={visible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Min. 6 characters"
                      className="w-full bg-transparent border-b border-gold/30 focus:border-gold outline-none py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
                    />
                    <button type="button" onClick={() => setVisible(v => !v)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-gold transition-colors">
                      {visible ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
                    </button>
                  </span>
                </label>

                <label className="block">
                  <span className="block text-[10px] uppercase tracking-luxury text-gold mb-2">Confirm Password</span>
                  <input
                    type={visible ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Repeat password"
                    className="w-full bg-transparent border-b border-gold/30 focus:border-gold outline-none py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors"
                  />
                </label>

                {err && (
                  <div className="text-[11px] text-destructive border border-destructive/30 bg-destructive/10 px-3 py-2">{err}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gold text-obsidian text-[11px] uppercase tracking-luxury font-medium hover:bg-gold-light transition-colors disabled:opacity-50 glow-gold-sm"
                >
                  {loading ? "…" : "Update Password →"}
                </button>
              </form>
            )}
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
