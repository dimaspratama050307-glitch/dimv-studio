-- ! DimV Studio: RLS and Storage policies
-- Run in Supabase SQL Editor after confirming the four tables exist.
-- This script expects user_profiles(user_id, email, role), portfolio, products,
-- site_settings, and a Storage bucket named dimv-asset.

create or replace function public.dimv_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where user_id = auth.uid() limit 1;
$$;
revoke all on function public.dimv_current_role() from public;
grant execute on function public.dimv_current_role() to authenticated;

alter table public.user_profiles enable row level security;
alter table public.portfolio enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;

-- Profiles: users can read their own profile; only owner/admin can manage profiles.
drop policy if exists "DimV read own profile" on public.user_profiles;
create policy "DimV read own profile" on public.user_profiles for select to authenticated using (user_id = auth.uid() or public.dimv_current_role() in ('owner','admin'));
drop policy if exists "DimV owner manage profiles" on public.user_profiles;
create policy "DimV owner manage profiles" on public.user_profiles for all to authenticated using (public.dimv_current_role() = 'owner') with check (public.dimv_current_role() = 'owner');

-- Public visitors can read published portfolio/products. Only owner/admin can write.
drop policy if exists "DimV public read published portfolio" on public.portfolio;
create policy "DimV public read published portfolio" on public.portfolio for select to anon, authenticated using (is_published = true or public.dimv_current_role() in ('owner','admin'));
drop policy if exists "DimV staff manage portfolio" on public.portfolio;
create policy "DimV staff manage portfolio" on public.portfolio for all to authenticated using (public.dimv_current_role() in ('owner','admin')) with check (public.dimv_current_role() in ('owner','admin'));

drop policy if exists "DimV public read published products" on public.products;
create policy "DimV public read published products" on public.products for select to anon, authenticated using (is_published = true or public.dimv_current_role() in ('owner','admin'));
drop policy if exists "DimV staff manage products" on public.products;
create policy "DimV staff manage products" on public.products for all to authenticated using (public.dimv_current_role() in ('owner','admin')) with check (public.dimv_current_role() in ('owner','admin'));

-- Site settings are readable publicly; writes are restricted to owner/admin.
drop policy if exists "DimV public read site settings" on public.site_settings;
create policy "DimV public read site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "DimV owner manage site settings" on public.site_settings;
create policy "DimV owner manage site settings" on public.site_settings for all to authenticated using (public.dimv_current_role() in ('owner','admin')) with check (public.dimv_current_role() in ('owner','admin'));

-- Storage: create a PUBLIC bucket named dimv-asset in Storage > Buckets first.
-- Public read enables website visitors to display uploaded product/project images.
drop policy if exists "DimV public read assets" on storage.objects;
create policy "DimV public read assets" on storage.objects for select to anon, authenticated using (bucket_id = 'dimv-asset');
drop policy if exists "DimV staff upload assets" on storage.objects;
create policy "DimV staff upload assets" on storage.objects for insert to authenticated with check (bucket_id = 'dimv-asset' and public.dimv_current_role() in ('owner','admin'));
drop policy if exists "DimV staff update assets" on storage.objects;
create policy "DimV staff update assets" on storage.objects for update to authenticated using (bucket_id = 'dimv-asset' and public.dimv_current_role() in ('owner','admin')) with check (bucket_id = 'dimv-asset' and public.dimv_current_role() in ('owner','admin'));
drop policy if exists "DimV staff delete assets" on storage.objects;
create policy "DimV staff delete assets" on storage.objects for delete to authenticated using (bucket_id = 'dimv-asset' and public.dimv_current_role() in ('owner','admin'));
