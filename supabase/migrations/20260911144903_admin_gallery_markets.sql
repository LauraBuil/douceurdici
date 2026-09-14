alter table public.products
  add column if not exists color text not null default '',
  add column if not exists scent text not null default '',
  add column if not exists composition text not null default '',
  add column if not exists price_visible boolean not null default true;

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt_text text not null default '',
  caption text not null default '',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  location text not null default '',
  start_date timestamptz not null,
  end_date timestamptz,
  details text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint markets_dates_ordered check (end_date is null or end_date >= start_date)
);

create index if not exists gallery_images_published_sort_idx on public.gallery_images (published, sort_order);
create index if not exists markets_published_date_idx on public.markets (published, start_date);

drop trigger if exists gallery_images_set_updated_at on public.gallery_images;
create trigger gallery_images_set_updated_at before update on public.gallery_images
for each row execute function private.set_updated_at();

drop trigger if exists markets_set_updated_at on public.markets;
create trigger markets_set_updated_at before update on public.markets
for each row execute function private.set_updated_at();

alter table public.gallery_images enable row level security;
alter table public.markets enable row level security;

revoke all on public.gallery_images from anon, authenticated;
revoke all on public.markets from anon, authenticated;
grant select on public.gallery_images, public.markets to anon, authenticated;
grant insert, update, delete on public.gallery_images, public.markets to authenticated;

create policy "Visitors can read published gallery images"
on public.gallery_images for select to anon using (published = true);
create policy "Signed in users read published gallery images or administer"
on public.gallery_images for select to authenticated
using (published = true or (select private.is_admin()));
create policy "Admins can add gallery images"
on public.gallery_images for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update gallery images"
on public.gallery_images for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete gallery images"
on public.gallery_images for delete to authenticated using ((select private.is_admin()));

create policy "Visitors can read published markets"
on public.markets for select to anon using (published = true);
create policy "Signed in users read published markets or administer"
on public.markets for select to authenticated
using (published = true or (select private.is_admin()));
create policy "Admins can add markets"
on public.markets for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update markets"
on public.markets for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete markets"
on public.markets for delete to authenticated using ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-images', 'gallery-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can upload gallery images" on storage.objects for insert to authenticated
with check (bucket_id = 'gallery-images' and (select private.is_admin()));
create policy "Admins can read gallery images" on storage.objects for select to authenticated
using (bucket_id = 'gallery-images' and (select private.is_admin()));
create policy "Admins can update gallery images" on storage.objects for update to authenticated
using (bucket_id = 'gallery-images' and (select private.is_admin()))
with check (bucket_id = 'gallery-images' and (select private.is_admin()));
create policy "Admins can delete gallery images" on storage.objects for delete to authenticated
using (bucket_id = 'gallery-images' and (select private.is_admin()));
