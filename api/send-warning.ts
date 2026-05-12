import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, name, message } = req.body || {};
  if (!email || !message) return res.status(400).json({ error: "email and message required" });

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "ZXG Wellness <admin@zxgwellness.com>",
    to: email,
    subject: "Important Notice — ZXG Wellness",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111;border:1px solid #2a2a2a;">
        <tr>
          <td style="background:#0d0d0d;border-bottom:2px solid #c9a84c;padding:40px 48px;text-align:center;">
            <p style="margin:0 0 8px;font-size:10px;letter-spacing:6px;text-transform:uppercase;color:#c9a84c;">ZXG WELLNESS</p>
            <h1 style="margin:0;font-size:28px;color:#f5f0e8;font-weight:normal;letter-spacing:2px;">Account Notice</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 48px;">
            <p style="color:#9a9a9a;font-size:14px;margin:0 0 16px;">Dear ${name || "Valued Customer"},</p>
            <p style="color:#e8e8e8;font-size:14px;line-height:1.8;margin:0 0 24px;white-space:pre-wrap;">${message}</p>
            <p style="color:#9a9a9a;font-size:13px;margin:0;">If you have questions, please reply to this email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#0d0d0d;border-top:1px solid #2a2a2a;padding:24px 48px;text-align:center;">
            <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;">ZXG WELLNESS</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) return res.status(500).json({ error: "Failed to send email" });
  return res.status(200).json({ success: true });
}
