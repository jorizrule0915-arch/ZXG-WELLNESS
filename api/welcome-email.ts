import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const DEFAULT_FROM_EMAIL = "ZXG Wellness <orders@zxgwellness.com>";
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

type WelcomeRequest = {
  email?: unknown;
  fullName?: unknown;
  userId?: unknown;
};

function setJsonHeaders(res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getClientIp(req: VercelRequest) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return firstForwarded?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function enforceRateLimit(key: string, options: { limit: number; windowMs: number }) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  if (bucket.count >= options.limit) {
    throw Object.assign(new Error("Too many welcome email requests"), { statusCode: 429 });
  }

  bucket.count += 1;
}

function getSupabaseAdmin(): SupabaseClient {
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

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(key);
}

function normalizeEmail(value: unknown) {
  const email = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error("A valid email is required"), { statusCode: 400 });
  }
  return email.slice(0, 320);
}

function cleanName(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function cleanUserId(value: unknown) {
  const userId = String(value ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
    ? userId
    : null;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function findRecentUserByEmail(supabase: SupabaseClient, email: string) {
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const user = data.users.find((item) => item.email?.toLowerCase() === email);
    if (user) return user;

    if (data.users.length < 200) break;
  }

  throw Object.assign(new Error("Signup was not found yet. Please try again in a moment."), {
    statusCode: 404,
  });
}

async function findRecentUser(supabase: SupabaseClient, email: string, userId: string | null) {
  if (!userId) return findRecentUserByEmail(supabase, email);

  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw Object.assign(new Error("Signup was not found yet. Please try again in a moment."), {
      statusCode: 404,
    });
  }

  if (data.user.email?.toLowerCase() !== email) {
    throw Object.assign(new Error("Signup details do not match."), { statusCode: 403 });
  }

  return data.user;
}

async function alreadySentWelcomeEmail(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("welcome_email_sent_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.welcome_email_sent_at);
}

async function markWelcomeEmailSent(
  supabase: SupabaseClient,
  userId: string,
  values: { email: string; fullName: string },
) {
  const payload = {
    id: userId,
    email: values.email,
    full_name: values.fullName,
    welcome_email_sent_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

  if (!error) return;

  await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: values.fullName,
    },
    { onConflict: "id" },
  );
}

function buildWelcomeEmailHtml({ fullName }: { fullName: string }) {
  const greeting = fullName ? `Hi ${escapeHtml(fullName)},` : "Hi there,";

  return `
    <div style="margin:0;padding:32px;background:#0a0a0a;color:#e8e8e8;font-family:Georgia,serif;">
      <div style="max-width:640px;margin:0 auto;background:#111;border:1px solid #2a2a2a;">
        <div style="padding:34px;text-align:center;border-bottom:2px solid #c9a84c;">
          <div style="color:#c9a84c;letter-spacing:6px;font-size:11px;">ZXG WELLNESS</div>
          <h1 style="margin:16px 0 8px;font-weight:400;color:#f5f0e8;">Welcome to ZXG Wellness</h1>
          <p style="margin:0;color:#9a9a9a;line-height:1.6;">Your account has been created.</p>
        </div>
        <div style="padding:32px;line-height:1.8;color:#d8d8d8;">
          <p style="margin-top:0;">${greeting}</p>
          <p>Welcome to ZXG Wellness — your account is ready for a cleaner, more organized shopping experience.</p>
          <p>You can now view your orders, see delivery updates when tracking is added, and return to your saved account details whenever you shop.</p>
          <div style="margin:28px 0;padding:20px;border:1px solid #2a2a2a;background:#0a0a0a;">
            <p style="margin:0 0 10px;color:#c9a84c;letter-spacing:3px;font-size:12px;">WHAT YOU CAN DO NEXT</p>
            <ul style="margin:0;padding-left:20px;color:#d8d8d8;">
              <li>Browse creatine, recovery care, and accessories.</li>
              <li>Track your orders from your account page.</li>
              <li>Read product guides in the ZXG Wellness Journal.</li>
            </ul>
          </div>
          <p style="margin-bottom:0;color:#9a9a9a;">If this was not you, you can ignore this message or contact us at <a href="mailto:admin@zxgwellness.com" style="color:#c9a84c;text-decoration:none;">admin@zxgwellness.com</a>.</p>
        </div>
      </div>
    </div>
  `;
}

function buildWelcomeEmailText({ fullName }: { fullName: string }) {
  const greeting = fullName ? `Hi ${fullName},` : "Hi there,";

  return `${greeting}

Welcome to ZXG Wellness. Your account has been created.

You can now view your orders, see delivery updates when tracking is added, and return to your saved account details whenever you shop.

What you can do next:
- Browse creatine, recovery care, and accessories.
- Track your orders from your account page.
- Read product guides in the ZXG Wellness Journal.

If this was not you, you can ignore this message or contact us at admin@zxgwellness.com.`;
}

async function sendWelcomeEmail(values: { email: string; fullName: string }) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: DEFAULT_FROM_EMAIL,
    to: values.email,
    replyTo: "admin@zxgwellness.com",
    subject: "Welcome to ZXG Wellness",
    html: buildWelcomeEmailHtml(values),
    text: buildWelcomeEmailText(values),
  });

  if (error) throw new Error(JSON.stringify(error));
}

function sendApiError(res: VercelResponse, error: unknown) {
  const err = error as Error & { statusCode?: number };
  const status = err.statusCode ?? 500;
  return res.status(status).json({ error: err.message || "Server error" });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setJsonHeaders(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = (req.body || {}) as WelcomeRequest;
    const email = normalizeEmail(body.email);
    const fullName = cleanName(body.fullName);
    const userId = cleanUserId(body.userId);

    enforceRateLimit(`welcome-ip:${getClientIp(req)}`, { limit: 5, windowMs: 60_000 });
    enforceRateLimit(`welcome-email:${email}`, { limit: 2, windowMs: 60 * 60_000 });

    const supabase = getSupabaseAdmin();
    const user = await findRecentUser(supabase, email, userId);
    const createdAt = new Date(user.created_at).getTime();
    const userIsRecent = Date.now() - createdAt <= 24 * 60 * 60_000;
    if (!userIsRecent) {
      throw Object.assign(new Error("Welcome email can only be sent for a recent signup"), {
        statusCode: 403,
      });
    }

    if (await alreadySentWelcomeEmail(supabase, user.id)) {
      return res.status(200).json({ success: true, alreadySent: true });
    }

    await sendWelcomeEmail({ email, fullName });
    await markWelcomeEmailSent(supabase, user.id, { email, fullName });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("welcome-email error:", error);
    return sendApiError(res, error);
  }
}
