-- Orders are now created by server-side API routes after Stripe verification.
-- Authenticated clients may still read their own orders, but cannot forge order rows.
drop policy if exists "Users can create own orders" on public.orders;
drop policy if exists "Users can insert own order items" on public.order_items;

alter table public.orders
  add column if not exists stripe_payment_intent_id text unique;
