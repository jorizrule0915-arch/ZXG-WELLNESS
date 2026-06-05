do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can upload product videos'
  ) then
    create policy "Admins can upload product videos"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'product-videos'
      and exists (
        select 1
        from public.user_roles
        where user_id = auth.uid()
          and role = 'admin'
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can update product videos'
  ) then
    create policy "Admins can update product videos"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'product-videos'
      and exists (
        select 1
        from public.user_roles
        where user_id = auth.uid()
          and role = 'admin'
      )
    )
    with check (
      bucket_id = 'product-videos'
      and exists (
        select 1
        from public.user_roles
        where user_id = auth.uid()
          and role = 'admin'
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can read product videos'
  ) then
    create policy "Admins can read product videos"
    on storage.objects
    for select
    to authenticated
    using (
      bucket_id = 'product-videos'
      and exists (
        select 1
        from public.user_roles
        where user_id = auth.uid()
          and role = 'admin'
      )
    );
  end if;
end $$;
