# Stripe Payment Debugging Guide

If you're seeing "Failed to create payment", follow these steps:

## 1. Check Your Environment Variables

Make sure both keys are properly set in `.env`:

```bash
# This is what you should have:
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
```

⚠️ **Common Issues:**

- Keys are incomplete or truncated
- Using live keys (pk_live/sk_live) instead of test keys (pk_test/sk_test)
- Extra quotes or spaces in the key values

## 2. Check Browser Console

1. Open your site → Open Dev Tools (F12)
2. Go to **Console** tab
3. Try the checkout again
4. Look for error messages like:
   - "STRIPE_SECRET_KEY is not configured"
   - "Missing required fields"
   - Specific Stripe API errors

## 3. Check Network Tab

1. In Dev Tools, go to **Network** tab
2. Try checkout again
3. Look for the `POST /api/payment` request
4. Click on it and check:
   - **Request body** - should have `amount` and `email`
   - **Response** - should show error details if it failed

## 4. Verify Test Setup

Before testing, make sure:

✓ You have items in your cart  
✓ You're signed in  
✓ Fill in all shipping fields  
✓ Amount is greater than $0

## 5. Common Error Messages

| Error                                         | Cause                                  | Fix                                                    |
| --------------------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| "Unexpected end of JSON input"                | API returned empty or invalid response | Restart dev server: `npm run dev`                      |
| "STRIPE_SECRET_KEY is not configured"         | Environment variable not set           | Restart dev server after adding to `.env`              |
| "Missing required fields" or "Invalid amount" | No items in cart or amount is $0       | Add items to cart, make sure total > $0                |
| "Payment intent creation failed"              | Invalid API key or Stripe error        | Check Stripe dashboard for correct test keys           |
| "Invalid response from server"                | API endpoint not responding            | Check `/api/payment` endpoint exists and is accessible |
| "Failed to get payment secret"                | Stripe didn't return client_secret     | Check Stripe API response in browser console           |

## 7. Test with These Steps

1. **Sign In** - Create/login to your account
2. **Add Item** - Add any product to cart
3. **Go to Checkout** - Fill in all required fields
4. **Submit Shipping Form** - Click "Continue to Payment"
5. **Use Test Card** - Enter: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/26)
   - CVC: Any 3 digits (e.g., 123)

## 8. Still Having Issues?

**Most important:** Restart your dev server after any changes:

```bash
npm run dev
```

Then try checkout again with a fresh browser tab (not just a refresh).

## 9. What Gets Logged

When you try checkout, you should see in the console:

- ✓ "Sending payment request: {amount: X, email: Y}"
- ✓ "Payment response status: 200"
- ✓ "Payment response data: {success: true, clientSecret: ...}"

If you see errors instead, copy them and check against the error table above.
