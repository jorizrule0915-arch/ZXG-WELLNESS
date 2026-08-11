import { Resend } from "resend";
import { loadLocalEnv } from "../api/local-env.js";
import { brandFromEmail, brandReplyToEmail, getOrderNotificationEmails } from "./email-config.js";

export type TrackingEmailOrder = {
  id: string;
  email: string;
  shipping_name?: string | null;
  tracking_carrier?: string | null;
  tracking_number?: string | null;
  tracking_status?: string | null;
  tracking_url?: string | null;
  shipment_note?: string | null;
  tracking_location?: string | null;
  tracking_updated_at?: string | null;
};

const statusLabels: Record<string, string> = {
  processing: "Preparing",
  packed: "Packed",
  shipped: "Shipped",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  delayed: "Delayed",
  returned: "Returned",
};

export function officialTrackingUrl(carrier: string | null | undefined, trackingNumber: string) {
  const number = encodeURIComponent(trackingNumber.trim());
  const normalized = String(carrier ?? "").toLowerCase();
  if (!number) return null;
  if (normalized.includes("usps"))
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${number}`;
  if (normalized.includes("ups")) return `https://www.ups.com/track?loc=en_US&tracknum=${number}`;
  if (normalized.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${number}`;
  if (normalized.includes("dhl"))
    return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${number}`;
  if (normalized.includes("canada post"))
    return `https://www.canadapost-postescanada.ca/track-reperage/en#/details/${number}`;
  if (normalized.includes("royal mail"))
    return `https://www.royalmail.com/track-your-item#/tracking-results/${number}`;
  return null;
}

export function resolveTrackingUrl(order: TrackingEmailOrder) {
  const enteredUrl = String(order.tracking_url ?? "").trim();
  if (enteredUrl) return enteredUrl;
  return officialTrackingUrl(order.tracking_carrier, String(order.tracking_number ?? ""));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatUpdateTime(value: string | null | undefined) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver",
    timeZoneName: "short",
  });
}

function trackingDetails(order: TrackingEmailOrder) {
  return [
    ["Carrier", order.tracking_carrier || "Not provided"],
    ["Tracking number", order.tracking_number || "Not provided"],
    [
      "Shipment status",
      statusLabels[order.tracking_status || ""] || order.tracking_status || "Preparing",
    ],
    ["Latest update", order.shipment_note || "No additional update"],
    ["Current location", order.tracking_location || "Not provided"],
    ["Update date and time", formatUpdateTime(order.tracking_updated_at)],
  ] as const;
}

export function buildTrackingEmailHtml(order: TrackingEmailOrder) {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const trackUrl = resolveTrackingUrl(order);
  const rows = trackingDetails(order)
    .map(
      ([label, value]) => `<tr>
        <td width="38%" valign="top" style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#6b7280;font-weight:bold;">${escapeHtml(label)}</td>
        <td valign="top" style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#111827;">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Shipment Update - GXZ Health and Wellness</title>
</head>
<body bgcolor="#f6f4ef" style="margin:0;padding:0;background-color:#f6f4ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6f4ef" style="width:100%;border-collapse:collapse;background-color:#f6f4ef;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:640px;border-collapse:collapse;background-color:#ffffff;border:1px solid #e5e7eb;">
          <tr>
            <td align="center" bgcolor="#111111" style="padding:34px 28px;background-color:#111111;border-bottom:3px solid #c9a84c;">
              <p style="margin:0 0 9px;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;">GXZ Health and Wellness</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:36px;font-weight:400;color:#ffffff;">Your shipment has an update</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 12px;font-size:15px;line-height:23px;color:#111827;">Hello ${escapeHtml(order.shipping_name || "there")},</p>
              <p style="margin:0 0 22px;font-size:14px;line-height:22px;color:#4b5563;">Tracking information for order <strong style="color:#111827;">#${shortId}</strong> has been updated.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">${rows}</table>
              ${
                trackUrl
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:26px auto 0;border-collapse:collapse;"><tr><td align="center" bgcolor="#c9a84c"><a href="${escapeHtml(trackUrl)}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:#111111;text-decoration:none;font-weight:bold;">Track My Order</a></td></tr></table>`
                  : ""
              }
              <p style="margin:24px 0 0;font-size:12px;line-height:19px;color:#6b7280;">The carrier's website may take a short time to display a newly created tracking number.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildTrackingEmailText(order: TrackingEmailOrder) {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const lines = trackingDetails(order).map(([label, value]) => `${label}: ${value}`);
  const trackUrl = resolveTrackingUrl(order);
  return `GXZ Health and Wellness shipment update

Order: #${shortId}
${lines.join("\n")}
${trackUrl ? `\nTrack my order: ${trackUrl}` : ""}

The carrier's website may take a short time to display a newly created tracking number.`;
}

function getResend() {
  loadLocalEnv();
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(key);
}

async function sendConfirmedEmail(
  resend: Resend,
  payload: Parameters<Resend["emails"]["send"]>[0],
  label: string,
) {
  const { data, error } = await resend.emails.send(payload);
  if (error) throw new Error(`${label}: ${error.message}`);
  if (!data?.id)
    throw new Error(`${label}: the email provider did not confirm delivery acceptance`);
  return data.id;
}

export async function sendTrackingUpdateEmails(order: TrackingEmailOrder) {
  const resend = getResend();
  const shortId = order.id.slice(0, 8).toUpperCase();
  const html = buildTrackingEmailHtml(order);
  const text = buildTrackingEmailText(order);
  const subject = `Shipment Update - #${shortId} | GXZ Health and Wellness`;
  const adminEmails = getOrderNotificationEmails().filter(
    (email) => email.toLowerCase() !== order.email.toLowerCase(),
  );

  const customerEmailId = await sendConfirmedEmail(
    resend,
    {
      from: brandFromEmail,
      to: order.email,
      replyTo: brandReplyToEmail,
      subject,
      html,
      text,
    },
    "customer tracking email",
  );

  let adminEmailId: string | null = null;
  if (adminEmails.length > 0) {
    adminEmailId = await sendConfirmedEmail(
      resend,
      {
        from: brandFromEmail,
        to: adminEmails,
        replyTo: order.email,
        subject: `Customer Shipment Update - #${shortId} | GXZ Health and Wellness`,
        html,
        text,
      },
      `admin tracking email (${adminEmails.join(", ")})`,
    );
  }

  return { customerEmailId, adminEmailId, recipients: [order.email, ...adminEmails] };
}
