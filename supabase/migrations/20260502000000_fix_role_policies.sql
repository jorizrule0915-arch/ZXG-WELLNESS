-- Split public product reads from admin product reads so anonymous storefront
-- traffic never needs to execute the admin role helper.
drop policy if exists "Anyone can view active products" on public.products;

create policy "Anyone can view active products"
  on public.products for select to anon, authenticated
  using (active = true);

create policy "Admins can view all products"
  on public.products for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Keep the helper callable by signed-in users; the frontend admin gate uses this.
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
