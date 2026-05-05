# Stripe Integration Setup Guide

Your Stripe payment integration is now ready! Follow these steps to complete the setup:

## 1. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Make sure you're in **Test Mode** (toggle in top-right)
3. Copy your keys:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

## 2. Add Keys to `.env`

Replace the placeholder values in `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
```

## 3. Test Payment Processing

**Test Card Numbers:**

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 2500 0000 3155`

Any future expiry date (e.g., 12/26) and any 3-digit CVC works.

## 4. How It Works

1. **Checkout Flow:**
   - User fills in contact & shipping info
   - System creates a Stripe Payment Intent
   - User enters card details via Stripe Elements
   - Payment is processed securely

2. **Files Created:**
   - `src/integrations/stripe/client.ts` - Stripe.js initialization
   - `src/integrations/stripe/server.ts` - Payment intent creation
   - `src/routes/api/payment.ts` - API endpoint
   - `src/components/site/StripeProvider.tsx` - React provider
   - `src/components/site/PaymentForm.tsx` - Card form component

## 5. Going Live

When ready for production:

1. Switch Stripe dashboard to **Live Mode**
2. Get your live API keys (`pk_live_` and `sk_live_`)
3. Update `.env` with live keys
4. Test thoroughly with real cards

## 6. Webhook Handling (Optional)

For production, set up Stripe webhooks in `src/routes/api/webhook.ts` to:

- Confirm payment completion
- Send order confirmations
- Handle disputes/refunds

## Need Help?

- [Stripe Docs](https://stripe.com/docs)
- [Stripe JS Reference](https://stripe.com/docs/js)
- [React Stripe Docs](https://stripe.com/docs/stripe-js/react)
