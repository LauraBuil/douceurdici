create schema if not exists private;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category text not null check (category in ('bougie', 'savon', 'diffuseur', 'coffret')),
  short_description text not null default '',
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  weight text,
  image_url text not null default '',
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_published_sort_idx on public.products (published, sort_order);
create index if not exists products_category_idx on public.products (category);

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where user_id = (select auth.uid())); $$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function private.set_updated_at();

alter table public.admins enable row level security;
alter table public.products enable row level security;

revoke all on public.admins from anon, authenticated;
revoke all on public.products from anon, authenticated;
grant select on public.admins to authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

create policy "Admins can read their own membership" on public.admins for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Published products are public" on public.products for select to anon, authenticated
using (published = true);
create policy "Admins can read every product" on public.products for select to authenticated
using ((select private.is_admin()));
create policy "Admins can add products" on public.products for insert to authenticated
with check ((select private.is_admin()));
create policy "Admins can update products" on public.products for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete products" on public.products for delete to authenticated
using ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select private.is_admin()));
create policy "Admins can read product images" on storage.objects for select to authenticated
using (bucket_id = 'product-images' and (select private.is_admin()));
create policy "Admins can update product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select private.is_admin())) with check (bucket_id = 'product-images' and (select private.is_admin()));
create policy "Admins can delete product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select private.is_admin()));

insert into public.products (name, slug, category, short_description, description, price, weight, image_url, featured, published, sort_order)
values
  ('Bougie Bébé douceur', 'bougie-bebe-douceur', 'bougie', 'Cire végétale · Coulée à la main', 'Une bougie sculptée tendre et délicate, préparée artisanalement dans les Pyrénées.', 18.00, '150 g', '/assets/bougie-bebe.jpg', true, true, 1),
  ('Savon Lavande douce', 'savon-lavande-douce', 'savon', 'Saponifié à froid · Peaux délicates', 'Un savon doux aux notes de lavande, fabriqué en petite série avec des ingrédients choisis.', 8.50, '100 g', '/assets/savon-lavande.png', true, true, 2),
  ('Bougie Rêve poudré', 'bougie-reve-poudre', 'bougie', 'Parfum coton · Création artisanale', 'Une création décorative aux couleurs douces, imaginée pour les cadeaux de naissance.', 22.00, '180 g', '/assets/creations-douceur-dici.jpg', true, true, 3),
  ('Coffret Petits bonheurs', 'coffret-petits-bonheurs', 'coffret', 'Bougie & savon · Prêt à offrir', 'Une attention artisanale composée à l’atelier et présentée dans un écrin kraft.', 32.00, null, '/assets/creations-douceur-dici.jpg', false, true, 4)
on conflict (slug) do nothing;
