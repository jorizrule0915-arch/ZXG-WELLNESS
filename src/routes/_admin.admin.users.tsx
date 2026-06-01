import { createFileRoute } from "@tanstack/react-router";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ShieldAlert,
  ShieldOff,
  ShieldCheck,
  Mail,
  ChevronDown,
  ChevronRight,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/lib/api";

export const Route = createFileRoute("/_admin/admin/users")({ component: AdminUsers });

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  status: "active" | "suspended" | "banned";
  admin_notes: string | null;
  created_at: string;
  is_admin: boolean;
  order_count: number;
  total_spent: number;
};

const STATUS_CONFIG = {
  active: { label: "Active", color: "text-emerald-400 border-emerald-400/40" },
  suspended: { label: "Suspended", color: "text-yellow-400 border-yellow-400/40" },
  banned: { label: "Banned", color: "text-destructive border-destructive/40" },
};

function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [warning, setWarning] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin-data?resource=users");
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }
      const rows = data as UserRow[];
      setUsers(rows);
      const initialNotes: Record<string, string> = {};
      rows.forEach((r) => { initialNotes[r.id] = r.admin_notes ?? ""; });
      setNotes(initialNotes);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: UserRow["status"]) => {
    try {
      const res = await authFetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-user-status", id, payload: { status } }),
      });
      const data = await res.json();
      if (data.error) return toast.error(data.error);
      toast.success(`Account ${status}`);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    } catch {
      toast.error("Failed to update status");
    }
  };

  const saveNotes = async (id: string) => {
    try {
      const res = await authFetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-user-notes", id, payload: { notes: notes[id] } }),
      });
      const data = await res.json();
      if (data.error) return toast.error(data.error);
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const toggleAdmin = async (id: string, isAdmin: boolean) => {
    try {
      const res = await authFetch("/api/admin-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-admin", id, payload: { isAdmin } }),
      });
      const data = await res.json();
      if (data.error) return toast.error(data.error);
      toast.success(isAdmin ? "Admin role removed" : "Admin role granted");
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_admin: !isAdmin } : u)));
    } catch {
      toast.error("Failed to update admin role");
    }
  };

  const sendWarning = async (user: UserRow) => {
    const message = warning[user.id]?.trim();
    if (!message) return toast.error("Enter a warning message first");
    setSending(user.id);
    try {
      const res = await authFetch("/api/send-warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name: user.full_name, message }),
      });
      if (!res.ok) throw new Error("Failed to send");
      toast.success("Warning sent to " + user.email);
      setWarning((prev) => ({ ...prev, [user.id]: "" }));
    } catch {
      toast.error("Failed to send warning email");
    } finally {
      setSending(null);
    }
  };

  const resetPassword = async (user: UserRow) => {
    const pwd = newPassword[user.id]?.trim();
    if (!pwd || pwd.length < 6) return toast.error("Password must be at least 6 characters");
    setSending(user.id + "-pwd");
    try {
      const res = await authFetch("/api/admin-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, password: pwd }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Password updated");
      setNewPassword((prev) => ({ ...prev, [user.id]: "" }));
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setSending(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Helmet>
        <title>Users — ZXG Admin</title>
      </Helmet>
      <div className="px-6 lg:px-10 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">Management</div>
          <h1 className="font-display text-4xl md:text-5xl">Accounts</h1>
        </motion.div>

        {/* Search */}
        <div className="mt-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full bg-charcoal border border-gold/20 pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 transition-colors"
          />
        </div>

        {/* Stats row */}
        <div className="mt-4 flex gap-4 flex-wrap">
          {(["active", "suspended", "banned"] as const).map((s) => (
            <div key={s} className="text-[10px] uppercase tracking-luxury text-muted-foreground">
              {STATUS_CONFIG[s].label}:{" "}
              <span className="text-gold">{users.filter((u) => u.status === s).length}</span>
            </div>
          ))}
          <div className="text-[10px] uppercase tracking-luxury text-muted-foreground">
            Total: <span className="text-gold">{users.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 border border-gold/15 bg-charcoal">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No users found</div>
          ) : (
            <ul className="divide-y divide-gold/10">
              {filtered.map((user) => {
                const isOpen = expanded === user.id;
                const sc = STATUS_CONFIG[user.status];
                return (
                  <li key={user.id}>
                    {/* Row */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : user.id)}
                      className="w-full grid grid-cols-12 items-center px-6 py-5 hover:bg-surface/40 transition-colors text-left"
                    >
                      <div className="col-span-1">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-gold" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="col-span-11 md:col-span-5">
                        <div className="text-sm font-medium text-foreground">
                          {user.full_name || "—"}
                          {user.is_admin && (
                            <span className="ml-2 text-[9px] uppercase tracking-luxury border border-gold/40 text-gold px-1.5 py-0.5">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                      </div>
                      <div className="hidden md:block col-span-2">
                        <span
                          className={`text-[10px] uppercase tracking-luxury border px-2 py-1 ${sc.color}`}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <div className="hidden md:block col-span-2 text-xs text-muted-foreground">
                        {user.order_count} orders · ${user.total_spent.toFixed(0)}
                      </div>
                      <div className="hidden md:block col-span-2 text-xs text-muted-foreground text-right">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </button>

                    {/* Expanded */}
                    {isOpen && (
                      <div className="px-6 pb-8 border-t border-gold/10 bg-obsidian/40 grid md:grid-cols-2 gap-8">

                        {/* Account Actions */}
                        <div>
                          <div className="text-[10px] uppercase tracking-luxury text-gold mb-4 mt-6">
                            Account Status
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => updateStatus(user.id, "active")}
                              disabled={user.status === "active"}
                              className={`flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-luxury border transition-colors ${user.status === "active" ? "bg-emerald-400/20 border-emerald-400/60 text-emerald-400 cursor-default" : "border-gold/20 text-muted-foreground hover:border-emerald-400/60 hover:text-emerald-400"}`}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" /> Active
                            </button>
                            <button
                              onClick={() => updateStatus(user.id, "suspended")}
                              disabled={user.status === "suspended"}
                              className={`flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-luxury border transition-colors ${user.status === "suspended" ? "bg-yellow-400/20 border-yellow-400/60 text-yellow-400 cursor-default" : "border-gold/20 text-muted-foreground hover:border-yellow-400/60 hover:text-yellow-400"}`}
                            >
                              <ShieldAlert className="h-3.5 w-3.5" /> Suspend
                            </button>
                            <button
                              onClick={() => updateStatus(user.id, "banned")}
                              disabled={user.status === "banned"}
                              className={`flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-luxury border transition-colors ${user.status === "banned" ? "bg-destructive/20 border-destructive/60 text-destructive cursor-default" : "border-gold/20 text-muted-foreground hover:border-destructive/60 hover:text-destructive"}`}
                            >
                              <ShieldOff className="h-3.5 w-3.5" /> Ban
                            </button>
                          </div>

                          {/* Admin toggle */}
                          <div className="mt-6">
                            <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">
                              Admin Role
                            </div>
                            <button
                              onClick={() => toggleAdmin(user.id, user.is_admin)}
                              className={`flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-luxury border transition-colors ${user.is_admin ? "bg-gold/10 border-gold/60 text-gold hover:bg-destructive/10 hover:border-destructive/60 hover:text-destructive" : "border-gold/20 text-muted-foreground hover:border-gold hover:text-gold"}`}
                            >
                              {user.is_admin ? "Revoke Admin" : "Grant Admin"}
                            </button>
                          </div>

                          {/* Reset Password */}
                          <div className="mt-6">
                            <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">
                              Reset Password
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="password"
                                placeholder="New password…"
                                value={newPassword[user.id] ?? ""}
                                onChange={(e) =>
                                  setNewPassword((prev) => ({ ...prev, [user.id]: e.target.value }))
                                }
                                className="flex-1 bg-transparent border-b border-gold/30 focus:border-gold outline-none py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors"
                              />
                              <button
                                onClick={() => resetPassword(user)}
                                disabled={sending === user.id + "-pwd"}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gold text-obsidian text-[10px] uppercase tracking-luxury hover:bg-gold-light transition-colors disabled:opacity-50"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                {sending === user.id + "-pwd" ? "…" : "Set"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right column */}
                        <div>
                          {/* Send Warning */}
                          <div className="mt-6">
                            <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">
                              Send Warning Email
                            </div>
                            <textarea
                              rows={3}
                              placeholder="Type your warning message…"
                              value={warning[user.id] ?? ""}
                              onChange={(e) =>
                                setWarning((prev) => ({ ...prev, [user.id]: e.target.value }))
                              }
                              className="w-full bg-transparent border border-gold/20 focus:border-gold/60 outline-none p-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors resize-none"
                            />
                            <button
                              onClick={() => sendWarning(user)}
                              disabled={sending === user.id}
                              className="mt-2 flex items-center gap-2 px-4 py-2 bg-gold text-obsidian text-[10px] uppercase tracking-luxury hover:bg-gold-light transition-colors disabled:opacity-50"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {sending === user.id ? "Sending…" : "Send Warning"}
                            </button>
                          </div>

                          {/* Admin Notes */}
                          <div className="mt-6">
                            <div className="text-[10px] uppercase tracking-luxury text-gold mb-3">
                              Admin Notes
                            </div>
                            <textarea
                              rows={3}
                              placeholder="Internal notes (not visible to user)…"
                              value={notes[user.id] ?? ""}
                              onChange={(e) =>
                                setNotes((prev) => ({ ...prev, [user.id]: e.target.value }))
                              }
                              className="w-full bg-transparent border border-gold/20 focus:border-gold/60 outline-none p-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors resize-none"
                            />
                            <button
                              onClick={() => saveNotes(user.id)}
                              className="mt-2 px-4 py-2 border border-gold/40 text-gold text-[10px] uppercase tracking-luxury hover:bg-gold hover:text-obsidian transition-colors"
                            >
                              Save Notes
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
