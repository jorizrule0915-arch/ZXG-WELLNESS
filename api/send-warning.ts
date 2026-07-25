import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { Resend } from "resend";
import { loadLocalEnv } from "./local-env";
import { publicErrorMessage, rejectDisallowedOrigin, setApiHeaders } from "../server/http-security";

const DEFAULT_FROM_EMAIL = "ZXG Wellness <orders@zxgwellness.com>";
const REPLY_TO_EMAIL = "admin@zxgwellness.com";
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function getSupabaseAdmin(): SupabaseClient {
  loadLocalEnv();
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(
    ".supabase.com",
    ".supabase.co",
  );
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars missing.");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getBearerToken(req: VercelRequest) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function getClientIp(req: VercelRequest) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return firstForwarded?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function enforceRateLimit(
  req: VercelRequest,
  scope: string,
  options: { limit: number; windowMs: number },
) {
  const now = Date.now();
  const key = `${scope}:${getClientIp(req)}`;
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  if (bucket.count >= options.limit) {
    throw Object.assign(new Error("Too many requests"), { statusCode: 429 });
  }

  bucket.count += 1;
}

async function requireUser(req: VercelRequest): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const token = getBearerToken(req);
  if (!token) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });

  return { supabase, user: data.user };
}

async function requireAdmin(req: VercelRequest): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const { supabase, user } = await requireUser(req);
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  return { supabase, user };
}

function sendApiError(res: VercelResponse, error: unknown) {
  const err = error as Error & { statusCode?: number };
  const status = err.statusCode ?? 500;
  return res.status(status).json({ error: publicErrorMessage(error, "Warning email failed") });
}

function getResend() {
  loadLocalEnv();
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(key);
}

function resendErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown Resend error";
  }
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function warningMessageHtml(message: string) {
  return message
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph
        .split(/\n/)
        .map((line) => escapeHtml(line))
        .join("<br />");

      return `<p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;color:#f5f0e8;">${lines}</p>`;
    })
    .join("");
}

function buildWarningEmailHtml({ name, message }: { name?: string; message: string }) {
  const customerName = name?.trim() ? escapeHtml(name.trim()) : "Valued Customer";
  const formattedMessage = warningMessageHtml(message);

  return `<!doctype html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Important Notice — ZXG Wellness</title>
</head>
<body bgcolor="#0a0a0a" style="margin:0;padding:0;background-color:#0a0a0a;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <center style="width:100%;background-color:#0a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#0a0a0a;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <!--[if mso]><table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#111111" style="width:100%;max-width:640px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#111111;border:1px solid #2a2a2a;">
            <tr>
              <td align="center" bgcolor="#0d0d0d" style="padding:38px 32px 34px 32px;background-color:#0d0d0d;border-bottom:2px solid #c9a84c;">
                <p style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;">ZXG WELLNESS</p>
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:38px;font-weight:400;color:#f5f0e8;">Account Notice</h1>
                <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#b8b0a4;">Important message from customer care</p>
              </td>
            </tr>
            <tr>
              <td bgcolor="#c9a84c" style="height:3px;font-size:0;line-height:0;background-color:#c9a84c;">&nbsp;</td>
            </tr>
            <tr>
              <td bgcolor="#111111" style="padding:30px 32px;background-color:#111111;">
                <p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#b8b0a4;">Dear ${customerName},</p>
                ${formattedMessage}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#16120a" style="margin-top:24px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#16120a;border:1px solid #3a2b10;">
                  <tr>
                    <td bgcolor="#16120a" style="padding:16px 18px;background-color:#16120a;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#d8d0c5;">
                      If you have questions, please reply to this email and our team will help you.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" bgcolor="#0d0d0d" style="padding:24px 32px;background-color:#0d0d0d;border-top:1px solid #2a2a2a;">
                <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;">ZXG WELLNESS</p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#746b61;">
                  Customer care: <a href="mailto:${REPLY_TO_EMAIL}" style="color:#c9a84c;text-decoration:none;">${REPLY_TO_EMAIL}</a>
                </p>
              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setApiHeaders(req, res);
  if (req.method === "OPTIONS") {
    if (rejectDisallowedOrigin(req, res)) return;
    return res.status(204).end();
  }
  if (rejectDisallowedOrigin(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    enforceRateLimit(req, "send-warning", { limit: 10, windowMs: 60_000 });
    await requireAdmin(req);
    const { email, name, message } = req.body || {};
    if (!email || !message) return res.status(400).json({ error: "email and message required" });

    const resend = getResend();
    const cleanEmail = String(email).trim();
    const cleanName = typeof name === "string" ? name : "";
    const cleanMessage = String(message).trim();
    if (!cleanEmail.includes("@")) return res.status(400).json({ error: "Valid email required" });
    if (!cleanMessage) return res.status(400).json({ error: "message required" });

    const { error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: cleanEmail,
      replyTo: REPLY_TO_EMAIL,
      subject: "Important Notice — ZXG Wellness",
      html: buildWarningEmailHtml({ name: cleanName, message: cleanMessage }),
      text: `ZXG Wellness Account Notice\n\nDear ${
        cleanName.trim() || "Valued Customer"
      },\n\n${cleanMessage}\n\nIf you have questions, please reply to this email.\n\nZXG Wellness`,
    });

    if (error) {
      return res.status(500).json({ error: `Failed to send email: ${resendErrorMessage(error)}` });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return sendApiError(res, error);
  }
}
