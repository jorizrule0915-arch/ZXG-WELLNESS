
-- ============ Roles ============
create type public.app_role as enum ('admin', 'customer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create policy "Admins can view all roles"
  on public.user_roles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ Profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "Admins can view all profiles"
  on public.profiles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- Auto-create profile + default customer role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============ Products ============
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null,
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  category text not null,
  image text not null,
  ingredients text[] not null default '{}',
  benefits text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Anyone can view active products"
  on public.products for select to anon, authenticated
  using (active = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage products"
  on public.products for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============ Orders ============
create type public.order_status as enum ('pending', 'paid', 'fulfilled', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.order_status not null default 'pending',
  total numeric(10,2) not null check (total >= 0),
  email text not null,
  shipping_name text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_zip text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select to authenticated
  using (user_id = auth.uid());

create policy "Admins can view all orders"
  on public.orders for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Users can create own orders"
  on public.orders for insert to authenticated
  with check (user_id = auth.uid());

create policy "Admins can update orders"
  on public.orders for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============ Order Items ============
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_slug text not null,
  product_name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;

create policy "Users can view own order items"
  on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

create policy "Admins can view all order items"
  on public.order_items for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Users can insert own order items"
  on public.order_items for insert to authenticated
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

create index on public.order_items (order_id);
create index on public.orders (user_id, created_at desc);
