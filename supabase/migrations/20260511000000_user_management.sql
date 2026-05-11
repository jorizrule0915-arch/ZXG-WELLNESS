-- Add status + notes to profiles for admin user management
alter table public.profiles
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended', 'banned')),
  add column if not exists admin_notes text,
  add column if not exists email text;

-- Allow admins to update profiles
create policy "Admins can update all profiles"
  on public.profiles for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
