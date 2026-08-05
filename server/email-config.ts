const BRAND_FALLBACK_NOTIFICATION_EMAILS = ["jorizrule0@gmail.com", "g@zxgwellness.com"];

function parseEmailList(value: string | undefined) {
  return String(value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email, index, emails) => email.includes("@") && emails.indexOf(email) === index);
}

export function getOrderNotificationEmails() {
  const configured = parseEmailList(process.env.ORDER_NOTIFICATION_EMAILS);
  return configured.length > 0 ? configured : BRAND_FALLBACK_NOTIFICATION_EMAILS;
}

export function getContactRecipientEmails() {
  const configured = parseEmailList(process.env.CONTACT_RECIPIENT_EMAILS);
  return configured.length > 0 ? configured : getOrderNotificationEmails();
}

export const brandFromEmail =
  process.env.RESEND_FROM_EMAIL || "GXZ Health and Wellness <orders@zxgwellness.com>";

export const brandReplyToEmail = process.env.CUSTOMER_SUPPORT_EMAIL || "g@zxgwellness.com";
