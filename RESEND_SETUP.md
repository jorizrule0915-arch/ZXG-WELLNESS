# Resend Email Setup Guide

## Current Status

✅ `zxgwellness.com` is verified in Resend.

⚠️ If checkout still says the sender domain is not verified, Vercel is most likely using a
`RESEND_API_KEY` from a different Resend account/project.

## To Use Your Custom Domain

Once you've verified your domain in Resend, follow these steps:

### 1. Verify Your Domain in Resend

1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to **Domains**
3. Click **Add Domain**
4. Enter `zxgwellness.com`
5. Follow the verification steps (add DNS records)
6. Wait for verification to complete

### 2. Confirm Environment Variables

The order sender is hardcoded in the app:

```typescript
const DEFAULT_FROM_EMAIL = "ZXG Wellness <orders@zxgwellness.com>";
```

No extra sender environment variable is required. Just confirm `RESEND_API_KEY` is copied from the
same Resend account where `zxgwellness.com` shows as verified.

### 3. Current Code

Order confirmation emails use [server/order-email.ts](server/order-email.ts).

## Sender

- **From/Sender:** `orders@zxgwellness.com`
- **Reply-To:** `admin@zxgwellness.com`
- **Admin recipients:** addresses in `DEFAULT_ADMIN_EMAILS`
- **Checkout success:** based on the customer confirmation email; admin notification failures are
  logged but do not make the customer order look failed

## Testing

To test email delivery:

1. Complete a checkout in your app
2. Check the order confirmation page
3. Email should arrive in customer's inbox
4. Admin notification emails go to addresses in `DEFAULT_ADMIN_EMAILS`

## Troubleshooting

**Emails not sending?**

- Check that `RESEND_API_KEY` is set in environment
- Make sure `RESEND_API_KEY` belongs to the Resend account where `zxgwellness.com` is verified
- Verify the sender domain is approved in Resend dashboard
- Keep `DEFAULT_ADMIN_EMAILS` limited to real inboxes you actively use
- The checkout thank-you page shows the exact Resend API error after a failed send
- Check server logs for Resend API errors

**Domain verification taking long?**

- DNS changes can take 24-48 hours to propagate
- Use `onboarding@resend.dev` in the meantime

**Custom domain not working?**

- Re-verify the domain in Resend dashboard
- Make sure DNS records were properly added
- Check that email address has the verified domain
