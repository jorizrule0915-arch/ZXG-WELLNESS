import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { getContactRecipientEmails, brandFromEmail } from "../server/email-config";
import {
  getClientIp,
  publicErrorMessage,
  rejectDisallowedOrigin,
  setApiHeaders,
} from "../server/http-security";
import { loadLocalEnv } from "./local-env";

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\0/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function enforceRateLimit(req: VercelRequest) {
  const now = Date.now();
  const key = `contact:${getClientIp(req)}`;
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return;
  }

  if (bucket.count >= 5) {
    throw Object.assign(new Error("Too many messages. Please try again later."), {
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

    const name = cleanText(req.body?.name, 100);
    const email = cleanText(req.body?.email, 254).toLowerCase();
    const message = cleanText(req.body?.message, 5_000);
    const company = cleanText(req.body?.company, 200);

    // A hidden honeypot catches basic form bots without inconveniencing customers.
    if (company) return res.status(200).json({ success: true });
    if (name.length < 2) return res.status(400).json({ error: "Please enter your name." });
    if (!emailPattern.test(email))
      return res.status(400).json({ error: "Please enter a valid email address." });
    if (message.length < 10)
      return res.status(400).json({ error: "Please enter a little more detail." });

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) throw new Error("RESEND_API_KEY is not configured.");

    const resend = new Resend(resendKey);
    const recipients = getContactRecipientEmails();
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
    const { error } = await resend.emails.send({
      from: brandFromEmail,
      to: recipients,
      replyTo: email,
      subject: `GXZ website message from ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2>New GXZ Health and Wellness website message</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
          <p><strong>Message:</strong></p>
          <div style="padding:16px;background:#f6f6f6;border-left:4px solid #c9a84c">${safeMessage}</div>
        </div>
      `,
      text: `New GXZ Health and Wellness website message\n\nName: ${name}\nEmail: ${email}\n\n${message}`,
    });

    if (error) throw new Error(error.message || "Email delivery failed.");
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[api/contact]", error);
    const status =
      typeof error === "object" && error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;
    return res.status(status).json({
      error: publicErrorMessage(error, "We could not send your message. Please email us directly."),
    });
  }
}
