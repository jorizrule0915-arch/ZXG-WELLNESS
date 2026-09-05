import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadLocalEnv } from "./local-env.js";
import {
  publicErrorMessage,
  rejectDisallowedOrigin,
  setApiHeaders,
} from "../server/http-security.js";
import { requireUser } from "../server/security.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setApiHeaders(req, res, "GET, OPTIONS");
  if (req.method === "OPTIONS") {
    if (rejectDisallowedOrigin(req, res)) return;
    return res.status(204).end();
  }
  if (rejectDisallowedOrigin(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    loadLocalEnv();
    const { supabase, user } = await requireUser(req);
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error) throw error;
    return res.status(200).json({ isAdmin: Boolean(data) });
  } catch (error) {
    const status =
      typeof error === "object" && error && "statusCode" in error
        ? Number((error as { statusCode?: unknown }).statusCode)
        : 500;
    return res
      .status(status)
      .json({ error: publicErrorMessage(error, "Admin status check failed") });
  }
}
