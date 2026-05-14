-- Add stock tracking and product options to products table
alter table public.products
  add column if not exists track_stock boolean not null default false,
  add column if not exists stock_qty   integer not null default 0,
  add column if not exists options     jsonb not null default '[]'::jsonb;
