import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import {
  getClientIp,
  publicErrorMessage,
  rejectDisallowedOrigin,
  setApiHeaders,
} from "../server/http-security.js";
import { loadLocalEnv } from "./local-env.js";

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function enforceRateLimit(req: VercelRequest) {
  const now = Date.now();
  const key = `newsletter:${getClientIp(req)}`;
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return;
  }
  if (bucket.count >= 10) {
    throw Object.assign(new Error("Too many attempts. Please try again later."), {
      statusCode: 429,
    });
  }
  bucket.count += 1;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setApiHeaders(req, res);

  if (req.method === "OPTIONS") {
    if (rejectDisallowedOrigin(req, res)) return;
    return res.status(204).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (rejectDisallowedOrigin(req, res)) return;

  try {
    loadLocalEnv();
    enforceRateLimit(req);

    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 254);
    const consent = req.body?.consent === true;
    const website = String(req.body?.website ?? "").trim();

    if (website) return res.status(200).json({ success: true });
    if (!emailPattern.test(email))
      return res.status(400).json({ error: "Please enter a valid email address." });
    if (!consent)
      return res.status(400).json({ error: "Please confirm that you want email updates." });

    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured.");

    const resend = new Resend(key);
    const { error } = await resend.contacts.create({
      email,
      unsubscribed: false,
    });

    if (error && !String(error.message).toLowerCase().includes("already")) {
      throw new Error(error.message || "Subscription failed.");
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[api/newsletter]", error);
    const status =
      typeof error === "object" && error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;
    return res
      .status(status)
      .json({ error: publicErrorMessage(error, "We could not save your subscription.") });
  }
}
