alter table public.orders
  add column if not exists tracking_location text,
  add column if not exists tracking_updated_at timestamptz;

comment on column public.orders.tracking_location is
  'Most recent carrier-reported shipment location entered by an administrator.';

comment on column public.orders.tracking_updated_at is
  'Date and time associated with the most recent tracking update.';
