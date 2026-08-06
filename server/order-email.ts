import { Resend } from "resend";

const PEN_DISCOUNT_MIN_QTY = 5;
const PEN_DISCOUNT_RATE = 0.1;
const FREE_SHIPPING_THRESHOLD = 50;
const DEFAULT_FROM_EMAIL = "GXZ Health and Wellness <orders@zxgwellness.com>";
const DEFAULT_ADMIN_EMAILS = ["jorizrule0@gmail.com", "g@zxgwellness.com"];

const money = (value: number) => Math.round(value * 100) / 100;

type OrderEmailItem = {
  product_name: string;
  product_slug?: string | null;
  quantity: number;
  unit_price: number;
};

export type OrderEmail = {
  id: string;
  email: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_zip: string;
  shipping_state?: string | null;
  total: number;
  created_at: string;
  items: OrderEmailItem[];
};

export type OrderEmailResult = {
  customerSent: boolean;
  adminSent: boolean;
  errors: string[];
};

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(key);
}

function getAdminEmails(customerEmail: string) {
  const configured = (process.env.ORDER_NOTIFICATION_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const emails = configured.length > 0 ? configured : DEFAULT_ADMIN_EMAILS;
  const customer = customerEmail.toLowerCase();
  return [...new Set(emails)].filter((email) => email.toLowerCase() !== customer);
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

async function sendEmail(
  resend: Resend,
  payload: Parameters<Resend["emails"]["send"]>[0],
  label: string,
) {
  try {
    const { error } = await resend.emails.send(payload);
    return error ? `${label}: ${resendErrorMessage(error)}` : null;
  } catch (error) {
    return `${label}: ${resendErrorMessage(error)}`;
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

function formatMoney(value: number) {
  return `$${(Math.round(Number(value) * 100) / 100).toFixed(2)}`;
}

function getOrderEmailTotals(order: OrderEmail) {
  const discountedSubtotal =
    Math.round(
      order.items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0) *
        100,
    ) / 100;
  const penQuantity = order.items
    .filter((item) => item.product_slug === "pen")
    .reduce((quantity, item) => quantity + Number(item.quantity), 0);
  const penDiscount =
    Math.round(
      (penQuantity >= PEN_DISCOUNT_MIN_QTY
        ? order.items
            .filter((item) => item.product_slug === "pen")
            .reduce(
              (sum, item) =>
                sum +
                Number(item.unit_price) *
                  Number(item.quantity) *
                  (PEN_DISCOUNT_RATE / (1 - PEN_DISCOUNT_RATE)),
              0,
            )
        : 0) * 100,
    ) / 100;
  const merchandiseSubtotal = Math.round((discountedSubtotal + penDiscount) * 100) / 100;
  const orderTotal = Math.round(Number(order.total) * 100) / 100;
  const shipping = Math.round(Math.max(0, orderTotal - discountedSubtotal) * 100) / 100;

  return { discountedSubtotal, penDiscount, merchandiseSubtotal, orderTotal, shipping };
}

export function buildOrderEmailHtml(order: OrderEmail) {
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortId = order.id.slice(0, 8).toUpperCase();
  const { discountedSubtotal, penDiscount, merchandiseSubtotal, orderTotal, shipping } =
    getOrderEmailTotals(order);
  const freeShippingApplies = shipping === 0 && merchandiseSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingState = order.shipping_state ? `, ${escapeHtml(order.shipping_state)}` : "";

  const itemRows = order.items
    .map((item) => {
      const itemTotal = Number(item.unit_price) * Number(item.quantity);
      return `
        <tr>
          <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">${escapeHtml(item.product_name)}</td>
          <td align="center" style="padding:12px 10px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">${Number(item.quantity)}</td>
          <td align="right" style="padding:12px 10px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">${formatMoney(Number(item.unit_price))}</td>
          <td align="right" style="padding:12px 10px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">${formatMoney(itemTotal)}</td>
        </tr>`;
    })
    .join("");

  const summaryRow = (label: string, value: string, bold = false) => `
    <tr>
      <td align="right" style="padding:5px 10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#374151;${bold ? "font-weight:bold;" : ""}">${label}</td>
      <td align="right" width="120" style="padding:5px 10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;${bold ? "font-weight:bold;" : ""}">${value}</td>
    </tr>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed — GXZ Health and Wellness</title>
</head>
<body bgcolor="#f6f4ef" style="margin:0;padding:0;background-color:#f6f4ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6f4ef" style="border-collapse:collapse;background-color:#f6f4ef;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:640px;max-width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:24px 28px;border-bottom:4px solid #c9a84c;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 8px 0;font-size:12px;line-height:18px;color:#8a6f24;font-weight:bold;">GXZ Health and Wellness</p>
              <h1 style="margin:0 0 8px 0;font-size:24px;line-height:30px;color:#111827;font-weight:bold;">Order Confirmed</h1>
              <p style="margin:0;font-size:14px;line-height:22px;color:#374151;">Payment status: <strong style="color:#047857;">Paid</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 28px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:0 0 8px 0;font-size:14px;line-height:22px;color:#374151;"><strong style="color:#111827;">Order:</strong> #${shortId}</td>
                </tr>
                <tr>
                  <td style="padding:0 0 8px 0;font-size:14px;line-height:22px;color:#374151;"><strong style="color:#111827;">Date:</strong> ${orderDate}</td>
                </tr>
              </table>

              <h2 style="margin:22px 0 10px 0;font-size:16px;line-height:22px;color:#111827;font-weight:bold;">Items ordered</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e5e7eb;">
                <tr bgcolor="#f3f4f6" style="background-color:#f3f4f6;">
                  <td style="padding:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#374151;font-weight:bold;">Item</td>
                  <td align="center" width="70" style="padding:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#374151;font-weight:bold;">Qty</td>
                  <td align="right" width="90" style="padding:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#374151;font-weight:bold;">Price</td>
                  <td align="right" width="90" style="padding:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#374151;font-weight:bold;">Total</td>
                </tr>
                ${itemRows}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;border-collapse:collapse;">
                ${summaryRow("Merchandise subtotal", formatMoney(merchandiseSubtotal))}
                ${penDiscount > 0 ? summaryRow("Reusable pen discount", `-${formatMoney(penDiscount)}`) : ""}
                ${penDiscount > 0 ? summaryRow("Subtotal after discount", formatMoney(discountedSubtotal)) : ""}
                ${summaryRow(`Shipping${freeShippingApplies ? " ($50+ free shipping)" : ""}`, shipping === 0 ? "Free" : formatMoney(shipping))}
                ${summaryRow("Order total", formatMoney(orderTotal), true)}
              </table>

              <h2 style="margin:24px 0 8px 0;font-size:16px;line-height:22px;color:#111827;font-weight:bold;">Shipping to</h2>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#374151;">
                ${escapeHtml(order.shipping_name)}<br />
                ${escapeHtml(order.shipping_address)}<br />
                ${escapeHtml(order.shipping_city)}${shippingState} ${escapeHtml(order.shipping_zip)}
              </p>

              <p style="margin:24px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#374151;">Your order is being prepared. You can review updates from your account page.</p>
              <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#6b7280;">Questions? Reply to this email or contact admin@zxgwellness.com.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOrderEmailText(order: OrderEmail) {
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortId = order.id.slice(0, 8).toUpperCase();
  const { discountedSubtotal, penDiscount, merchandiseSubtotal, orderTotal, shipping } =
    getOrderEmailTotals(order);
  const shippingState = order.shipping_state ? `, ${order.shipping_state}` : "";
  const itemLines = order.items
    .map(
      (item) =>
        `- ${item.product_name} | Qty ${item.quantity} | ${formatMoney(Number(item.unit_price))} each | ${formatMoney(Number(item.unit_price) * Number(item.quantity))}`,
    )
    .join("\n");

  return `GXZ Health and Wellness Order Confirmed

Order: #${shortId}
Date: ${orderDate}
Payment status: Paid

Items ordered:
${itemLines}

Merchandise subtotal: ${formatMoney(merchandiseSubtotal)}
${penDiscount > 0 ? `Reusable pen discount: -${formatMoney(penDiscount)}\nSubtotal after discount: ${formatMoney(discountedSubtotal)}\n` : ""}Shipping: ${shipping === 0 ? "Free" : formatMoney(shipping)}
Order total: ${formatMoney(orderTotal)}

Shipping to:
${order.shipping_name}
${order.shipping_address}
${order.shipping_city}${shippingState} ${order.shipping_zip}

Your order is being prepared. Questions? Reply to this email or contact admin@zxgwellness.com.`;
}

function buildLegacyOrderEmailHtml(order: OrderEmail) {
  const money = (amount: number) => Math.round(amount * 100) / 100;
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortId = order.id.slice(0, 8).toUpperCase();
  const orderTotal = money(Number(order.total));
  const discountedSubtotal = money(
    order.items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0),
  );
  const penQuantity = order.items
    .filter((item) => item.product_slug === "pen")
    .reduce((quantity, item) => quantity + Number(item.quantity), 0);
  const penDiscount = money(
    penQuantity >= PEN_DISCOUNT_MIN_QTY
      ? order.items
          .filter((item) => item.product_slug === "pen")
          .reduce(
            (sum, item) =>
              sum +
              Number(item.unit_price) *
                Number(item.quantity) *
                (PEN_DISCOUNT_RATE / (1 - PEN_DISCOUNT_RATE)),
            0,
          )
      : 0,
  );
  const merchandiseSubtotal = money(discountedSubtotal + penDiscount);
  const shipping = money(Math.max(0, orderTotal - discountedSubtotal));
  const freeShippingApplies = shipping === 0 && merchandiseSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingState = order.shipping_state ? `, ${escapeHtml(order.shipping_state)}` : "";

  const summaryRow = (label: string, value: string, color = "#f5f0e8") => `
    <tr>
      <td bgcolor="#111111" style="padding:4px 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#b8b0a4;text-align:right;">${label}</td>
      <td bgcolor="#111111" width="120" style="padding:4px 0 4px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${color};text-align:right;white-space:nowrap;">${value}</td>
    </tr>`;

  const itemRows = order.items
    .map((item) => {
      const itemTotal = Number(item.unit_price) * Number(item.quantity);
      return `
        <tr>
          <td bgcolor="#111111" width="52%" style="padding:14px 10px 14px 0;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#f5f0e8;">${escapeHtml(item.product_name)}</td>
          <td bgcolor="#111111" width="12%" style="padding:14px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#f5f0e8;text-align:center;">${Number(item.quantity)}</td>
          <td bgcolor="#111111" width="18%" style="padding:14px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#f5f0e8;text-align:right;white-space:nowrap;">$${Number(item.unit_price).toFixed(2)}</td>
          <td bgcolor="#111111" width="18%" style="padding:14px 0 14px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#c9a84c;text-align:right;white-space:nowrap;">$${itemTotal.toFixed(2)}</td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Order Confirmed — GXZ Health and Wellness</title>
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
                <p style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;">GXZ HEALTH AND WELLNESS</p>
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:38px;font-weight:400;color:#f5f0e8;">Order Confirmed</h1>
                <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#b8b0a4;">Payment status: <strong style="color:#7ee787;font-weight:700;">Paid</strong></p>
              </td>
            </tr>
            <tr>
              <td bgcolor="#c9a84c" style="height:3px;font-size:0;line-height:0;background-color:#c9a84c;">&nbsp;</td>
            </tr>
            <tr>
              <td bgcolor="#111111" style="padding:30px 32px 24px 32px;background-color:#111111;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                  <tr>
                    <td width="50%" valign="top" bgcolor="#111111" style="padding:0 12px 0 0;">
                      <p style="margin:0 0 5px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:2px;text-transform:uppercase;color:#8c8378;">Order Number</p>
                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#c9a84c;font-weight:700;">#${shortId}</p>
                    </td>
                    <td width="50%" valign="top" align="right" bgcolor="#111111" style="padding:0 0 0 12px;text-align:right;">
                      <p style="margin:0 0 5px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:2px;text-transform:uppercase;color:#8c8378;">Order Date</p>
                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#f5f0e8;">${orderDate}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="#111111" style="padding:0 32px;background-color:#111111;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                  <tr><td style="height:1px;font-size:0;line-height:0;background-color:#2a2a2a;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="#111111" style="padding:30px 32px;background-color:#111111;">
                <p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;font-weight:700;">Invoice</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#111111" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#111111;">
                  <tr>
                    <td bgcolor="#111111" width="52%" style="padding:0 10px 10px 0;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:1px;text-transform:uppercase;color:#8c8378;">Item</td>
                    <td bgcolor="#111111" width="12%" style="padding:0 6px 10px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:1px;text-transform:uppercase;color:#8c8378;text-align:center;">Qty</td>
                    <td bgcolor="#111111" width="18%" style="padding:0 6px 10px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:1px;text-transform:uppercase;color:#8c8378;text-align:right;">Unit</td>
                    <td bgcolor="#111111" width="18%" style="padding:0 0 10px 6px;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:1px;text-transform:uppercase;color:#8c8378;text-align:right;">Total</td>
                  </tr>
                  ${itemRows}
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#111111" style="margin-top:22px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#111111;">
                  ${summaryRow("Merchandise Subtotal", `$${merchandiseSubtotal.toFixed(2)}`)}
                  ${penDiscount > 0 ? summaryRow("Reusable Pen Discount", `-$${penDiscount.toFixed(2)}`, "#7ee787") : ""}
                  ${penDiscount > 0 ? summaryRow("Subtotal After Discount", `$${discountedSubtotal.toFixed(2)}`) : ""}
                  ${summaryRow(`Shipping${freeShippingApplies ? " ($50+ Free Shipping)" : ""}`, shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`)}
                  <tr>
                    <td bgcolor="#111111" style="padding:14px 0 0 0;border-top:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:#b8b0a4;text-align:right;">Total</td>
                    <td bgcolor="#111111" width="120" style="padding:14px 0 0 18px;border-top:1px solid #2a2a2a;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:28px;color:#c9a84c;text-align:right;white-space:nowrap;">$${orderTotal.toFixed(2)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="#111111" style="padding:0 32px;background-color:#111111;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                  <tr><td style="height:1px;font-size:0;line-height:0;background-color:#2a2a2a;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="#111111" style="padding:28px 32px;background-color:#111111;">
                <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;font-weight:700;">Shipping To</p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;color:#f5f0e8;">
                  ${escapeHtml(order.shipping_name)}<br />
                  ${escapeHtml(order.shipping_address)}<br />
                  ${escapeHtml(order.shipping_city)}${shippingState} ${escapeHtml(order.shipping_zip)}
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" bgcolor="#0d0d0d" style="padding:26px 32px;background-color:#0d0d0d;border-top:1px solid #2a2a2a;">
                <p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#b8b0a4;">Your order is being prepared with care. You can review updates from your account.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                  <tr>
                    <td align="center" bgcolor="#c9a84c" style="background-color:#c9a84c;">
                      <a href="https://www.gxzhealthandwellness.com/account" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:14px;letter-spacing:2px;text-transform:uppercase;color:#0a0a0a;text-decoration:none;font-weight:700;">View My Orders</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#746b61;">Questions? Reply to this email or contact <a href="mailto:admin@zxgwellness.com" style="color:#c9a84c;text-decoration:none;">admin@zxgwellness.com</a>.</p>
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

export async function sendOrderConfirmationEmail(order: OrderEmail): Promise<OrderEmailResult> {
  const resend = getResend();
  const shortId = order.id.slice(0, 8).toUpperCase();
  const from = DEFAULT_FROM_EMAIL;
  const html = buildOrderEmailHtml(order);
  const text = buildOrderEmailText(order);
  const adminEmails = getAdminEmails(order.email);
  const result: OrderEmailResult = {
    customerSent: false,
    adminSent: adminEmails.length === 0,
    errors: [],
  };

  const customerError = await sendEmail(
    resend,
    {
      from,
      to: order.email,
      replyTo: "admin@zxgwellness.com",
      subject: `Order Confirmed & Paid — #${shortId} | GXZ Health and Wellness`,
      html,
      text,
    },
    "customer confirmation",
  );

  if (customerError) {
    result.errors.push(customerError);
  } else {
    result.customerSent = true;
  }

  if (adminEmails.length > 0) {
    const adminError = await sendEmail(
      resend,
      {
        from,
        to: adminEmails,
        replyTo: order.email,
        subject: `Paid Order Received — #${shortId} | GXZ Health and Wellness`,
        html,
        text,
      },
      `admin notification (${adminEmails.join(", ")})`,
    );

    if (adminError) {
      result.errors.push(adminError);
    } else {
      result.adminSent = true;
    }
  }

  if (result.errors.length > 0) {
    console.error("Resend order email error:", result.errors.join("; "));
  }

  return result;
}
