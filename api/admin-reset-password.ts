import type { VercelRequest, VercelResponse } from "@vercel/node";
import { enforceRateLimit, requireAdmin, sendApiError, setJsonHeaders } from "../server/security";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setJsonHeaders(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    enforceRateLimit(req, "admin-reset-password", { limit: 5, windowMs: 60_000 });
    const { supabase } = await requireAdmin(req);
    const { userId, password } = req.body || {};
    if (!userId || !password) return res.status(400).json({ error: "userId and password required" });
    if (password.length < 6) return res.status(400).json({ error: "Password too short" });

    const { error } = await supabase.auth.admin.updateUserById(userId, { password });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  } catch (error) {
    return sendApiError(res, error);
  }
}
