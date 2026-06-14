import { Resend } from "resend";

const PEN_DISCOUNT_MIN_QTY = 5;
const PEN_DISCOUNT_RATE = 0.1;
const FREE_SHIPPING_THRESHOLD = 50;
const DEFAULT_FROM_EMAIL = "ZXG Wellness <orders@zxgwellness.com>";
const DEFAULT_ADMIN_EMAILS = ["jorizrule0@gmail.com"];

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

export function buildOrderEmailHtml(order: OrderEmail) {
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const shortId = order.id.slice(0, 8).toUpperCase();
  const discountedSubtotal = money(
    order.items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0),
  );
  const penQuantity = order.items
    .filter((item) => item.product_slug === "pen")
    .reduce((quantity, item) => quantity + Number(item.quantity), 0);
  const penDiscountApplies = penQuantity >= PEN_DISCOUNT_MIN_QTY;
  const penDiscount = money(
    penDiscountApplies
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
  const shipping = money(Math.max(0, Number(order.total) - discountedSubtotal));
  const freeShippingApplies = shipping === 0 && merchandiseSubtotal >= FREE_SHIPPING_THRESHOLD;

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#e8e8e8;font-size:14px;">${item.product_name}</td>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#9a9a9a;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#e8e8e8;font-size:14px;text-align:right;">$${item.unit_price.toFixed(2)}</td>
        <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#c9a84c;font-size:14px;text-align:right;">$${(item.unit_price * item.quantity).toFixed(2)}</td>
      </tr>
    `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmation — ZXG Wellness</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111111;border:1px solid #2a2a2a;">
          <tr>
            <td style="background-color:#0d0d0d;border-bottom:2px solid #c9a84c;padding:40px 48px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:6px;text-transform:uppercase;color:#c9a84c;">ZXG WELLNESS</p>
              <h1 style="margin:0;font-size:32px;color:#f5f0e8;font-weight:normal;letter-spacing:2px;">Order Confirmed</h1>
              <p style="margin:12px 0 0 0;font-size:12px;color:#6a6a6a;letter-spacing:2px;text-transform:uppercase;">Thank you for your purchase</p>
            </td>
          </tr>
          <tr><td style="height:3px;background:linear-gradient(90deg,transparent,#c9a84c,transparent);"></td></tr>
          <tr>
            <td style="padding:36px 48px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;">
                    <p style="margin:0 0 4px 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6a6a6a;">Order Number</p>
                    <p style="margin:0;font-size:16px;color:#c9a84c;letter-spacing:1px;">#${shortId}</p>
                  </td>
                  <td style="width:50%;text-align:right;">
                    <p style="margin:0 0 4px 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6a6a6a;">Order Date</p>
                    <p style="margin:0;font-size:14px;color:#e8e8e8;">${orderDate}</p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:18px;">
                    <p style="margin:0 0 4px 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6a6a6a;">Payment Status</p>
                    <p style="margin:0;font-size:14px;color:#7ee787;">Paid</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #2a2a2a;margin:0;"/></td></tr>
          <tr>
            <td style="padding:36px 48px;">
              <p style="margin:0 0 24px 0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;">Invoice</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="padding-bottom:12px;border-bottom:1px solid #2a2a2a;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#6a6a6a;font-weight:normal;">Item</th>
                    <th style="padding-bottom:12px;border-bottom:1px solid #2a2a2a;text-align:center;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#6a6a6a;font-weight:normal;">Qty</th>
                    <th style="padding-bottom:12px;border-bottom:1px solid #2a2a2a;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#6a6a6a;font-weight:normal;">Unit</th>
                    <th style="padding-bottom:12px;border-bottom:1px solid #2a2a2a;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#6a6a6a;font-weight:normal;">Total</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="text-align:right;padding:6px 0;">
                    <span style="font-size:12px;color:#6a6a6a;letter-spacing:1px;">Merchandise Subtotal</span>
                    <span style="font-size:14px;color:#e8e8e8;margin-left:32px;">$${merchandiseSubtotal.toFixed(2)}</span>
                  </td>
                </tr>
                ${
                  penDiscount > 0
                    ? `
                <tr>
                  <td style="text-align:right;padding:6px 0;">
                    <span style="font-size:12px;color:#6a6a6a;letter-spacing:1px;">Reusable Pen Discount (10%)</span>
                    <span style="font-size:14px;color:#7ee787;margin-left:32px;">-$${penDiscount.toFixed(2)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:right;padding:6px 0;">
                    <span style="font-size:12px;color:#6a6a6a;letter-spacing:1px;">Subtotal After Discount</span>
                    <span style="font-size:14px;color:#e8e8e8;margin-left:32px;">$${discountedSubtotal.toFixed(2)}</span>
                  </td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="text-align:right;padding:6px 0;">
                    <span style="font-size:12px;color:#6a6a6a;letter-spacing:1px;">Shipping${freeShippingApplies ? " ($50+ Free Shipping)" : ""}</span>
                    <span style="font-size:14px;color:#e8e8e8;margin-left:32px;">${shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:right;padding:16px 0 0 0;border-top:1px solid #2a2a2a;margin-top:12px;">
                    <span style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9a9a9a;">Total</span>
                    <span style="font-size:24px;color:#c9a84c;margin-left:32px;font-family:'Georgia',serif;">$${order.total.toFixed(2)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #2a2a2a;margin:0;"/></td></tr>
          <tr>
            <td style="padding:36px 48px;">
              <p style="margin:0 0 16px 0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;">Shipping To</p>
              <p style="margin:0;font-size:14px;color:#e8e8e8;line-height:1.8;">
                ${order.shipping_name}<br/>
                ${order.shipping_address}<br/>
                ${order.shipping_city}${order.shipping_state ? `, ${order.shipping_state}` : ""} ${order.shipping_zip}
              </p>
            </td>
          </tr>
          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #2a2a2a;margin:0;"/></td></tr>
          <tr>
            <td style="padding:36px 48px;text-align:center;">
              <p style="margin:0 0 24px 0;font-size:14px;color:#9a9a9a;line-height:1.7;">
                Your order is being prepared with care.<br/>
                You can track it anytime from your account.
              </p>
              <a href="https://zxgwellness.com/account"
                 style="display:inline-block;padding:14px 36px;background-color:#c9a84c;color:#0a0a0a;font-size:10px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;font-family:'Georgia',serif;">
                View My Orders
              </a>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0d0d0d;border-top:1px solid #2a2a2a;padding:28px 48px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;">ZXG WELLNESS</p>
              <p style="margin:0;font-size:11px;color:#4a4a4a;">
                Questions? Reply to this email or contact us at
                <a href="mailto:admin@zxgwellness.com" style="color:#c9a84c;text-decoration:none;">admin@zxgwellness.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendOrderConfirmationEmail(order: OrderEmail): Promise<OrderEmailResult> {
  const resend = getResend();
  const shortId = order.id.slice(0, 8).toUpperCase();
  const from = DEFAULT_FROM_EMAIL;
  const html = buildOrderEmailHtml(order);
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
      subject: `Order Confirmed & Paid — #${shortId} | ZXG Wellness`,
      html,
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
        subject: `Paid Order Received — #${shortId} | ZXG Wellness`,
        html,
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
