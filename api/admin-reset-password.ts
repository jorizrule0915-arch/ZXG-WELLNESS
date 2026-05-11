import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, password } = req.body || {};
  if (!userId || !password) return res.status(400).json({ error: "userId and password required" });
  if (password.length < 6) return res.status(400).json({ error: "Password too short" });

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: "Supabase not configured" });

  const supabase = createClient(url, key);
  const { error } = await supabase.auth.admin.updateUserById(userId, { password });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
