alter table public.orders
  add column if not exists tracking_carrier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists tracking_status text not null default 'processing',
  add column if not exists shipped_at timestamptz,
  add column if not exists estimated_delivery_date date,
  add column if not exists shipment_note text,
  add column if not exists tracking_location text,
  add column if not exists tracking_updated_at timestamptz;

create index if not exists orders_tracking_number_idx
  on public.orders (tracking_number)
  where tracking_number is not null;
