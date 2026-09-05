-- A completed Stripe Checkout Session must create at most one order.
-- The API also checks for an existing row, while these unique indexes close
-- the race condition between simultaneous requests.
alter table public.orders
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text;

create unique index if not exists orders_stripe_checkout_session_id_unique
  on public.orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists orders_stripe_payment_intent_id_unique
  on public.orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create or replace function public.create_paid_order(
  p_user_id uuid,
  p_total numeric,
  p_email text,
  p_shipping_name text,
  p_shipping_address text,
  p_shipping_city text,
  p_shipping_zip text,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_items jsonb
)
returns table(order_id uuid, already_created boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_existing_user_id uuid;
begin
  select o.id, o.user_id
    into v_order_id, v_existing_user_id
  from public.orders o
  where o.stripe_checkout_session_id = p_checkout_session_id
     or (p_payment_intent_id is not null and o.stripe_payment_intent_id = p_payment_intent_id)
  limit 1;

  if v_order_id is not null then
    if v_existing_user_id <> p_user_id then
      raise exception 'Stripe payment is already assigned to another user';
    end if;
    return query select v_order_id, true;
    return;
  end if;

  insert into public.orders (
    user_id,
    status,
    total,
    email,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_zip,
    stripe_checkout_session_id,
    stripe_payment_intent_id
  ) values (
    p_user_id,
    'paid',
    p_total,
    p_email,
    p_shipping_name,
    p_shipping_address,
    p_shipping_city,
    p_shipping_zip,
    p_checkout_session_id,
    p_payment_intent_id
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_slug,
    product_name,
    unit_price,
    quantity
  )
  select
    v_order_id,
    item.product_slug,
    item.product_name,
    item.unit_price,
    item.quantity
  from jsonb_to_recordset(p_items) as item(
    product_slug text,
    product_name text,
    unit_price numeric,
    quantity integer
  );

  return query select v_order_id, false;
exception
  when unique_violation then
    select o.id, o.user_id
      into v_order_id, v_existing_user_id
    from public.orders o
    where o.stripe_checkout_session_id = p_checkout_session_id
       or (p_payment_intent_id is not null and o.stripe_payment_intent_id = p_payment_intent_id)
    limit 1;

    if v_order_id is null or v_existing_user_id <> p_user_id then
      raise;
    end if;
    return query select v_order_id, true;
end;
$$;

revoke all on function public.create_paid_order(
  uuid, numeric, text, text, text, text, text, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.create_paid_order(
  uuid, numeric, text, text, text, text, text, text, text, jsonb
) to service_role;
