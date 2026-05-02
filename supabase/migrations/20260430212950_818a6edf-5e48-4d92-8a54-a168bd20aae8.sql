
-- Lock down SECURITY DEFINER functions: only allow signed-in users for has_role,
-- and revoke all public access on triggers (handle_new_user, set_updated_at).
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Add explicit search_path to set_updated_at (linter)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Seed catalog
insert into public.products (slug, name, tagline, description, price, category, image, ingredients, benefits, featured, active) values
('auric-elixir','Auric Elixir','Adaptogenic daily tonic',
 'A meticulously crafted adaptogenic blend designed to restore equilibrium and amplify resilience. Slow-extracted, ritually bottled.',
 148, 'Supplements', '/src/assets/product-supplement.jpg',
 ARRAY['Reishi','Ashwagandha','Cordyceps','Schisandra'],
 ARRAY['Calms the nervous system','Sustains clean energy','Supports immune resilience'],
 true, true),
('obsidian-balm','Obsidian Balm','Restorative night cream',
 'A weightless yet richly nourishing night ritual. Charcoal-infused botanicals draw out impurities while peptides repair through the night.',
 215, 'Skincare', '/src/assets/product-skincare.jpg',
 ARRAY['Activated charcoal','Bakuchiol','Squalane','Frankincense'],
 ARRAY['Refines texture overnight','Restores luminosity','Deeply hydrates'],
 true, true),
('midnight-bloom','Midnight Bloom','Ceremonial wellness tea',
 'A nocturnal blend of rare herbs steeped in ancient apothecary tradition. Pairs beautifully with stillness.',
 64, 'Apothecary', '/src/assets/product-tea.jpg',
 ARRAY['Butterfly pea','Chamomile','Lavender','Valerian root'],
 ARRAY['Promotes deep sleep','Eases tension','Ceremonial ritual'],
 true, true),
('gilded-essence','Gilded Essence','Botanical face oil',
 'A luminous blend of cold-pressed botanicals delivering immediate radiance and long-term vitality to demanding skin.',
 188, 'Skincare', '/src/assets/product-oil.jpg',
 ARRAY['Marula','Sea buckthorn','Rosehip','24k gold'],
 ARRAY['Instant radiance','Reduces fine lines','Protects skin barrier'],
 true, true);
