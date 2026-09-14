alter table public.admins
  add column if not exists email text,
  add column if not exists role text not null default 'admin',
  add column if not exists active boolean not null default true;

alter table public.admins drop constraint if exists admins_role_check;
alter table public.admins add constraint admins_role_check check (role in ('admin', 'exploitant'));
create unique index if not exists admins_email_unique_idx on public.admins (lower(email)) where email is not null;

update public.admins as staff
set email = users.email
from auth.users as users
where users.id = staff.user_id and staff.email is null;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where user_id = (select auth.uid()) and role = 'admin' and active = true
  );
$$;

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where user_id = (select auth.uid()) and active = true
  );
$$;

revoke all on function private.is_staff() from public;
grant execute on function private.is_staff() to authenticated;

create table public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  parent_id uuid references public.catalog_categories(id) on delete restrict,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_categories_not_own_parent check (parent_id is null or parent_id <> id)
);

create table public.catalog_colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 60),
  hex_code text not null check (hex_code ~ '^#[0-9A-Fa-f]{6}$'),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalog_fragrances (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  composition text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists category_id uuid references public.catalog_categories(id) on delete restrict;
alter table public.products drop constraint if exists products_category_check;

create table public.product_colors (
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid not null references public.catalog_colors(id) on delete restrict,
  primary key (product_id, color_id)
);

create table public.product_fragrances (
  product_id uuid not null references public.products(id) on delete cascade,
  fragrance_id uuid not null references public.catalog_fragrances(id) on delete restrict,
  primary key (product_id, fragrance_id)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid references public.catalog_colors(id) on delete set null,
  image_url text not null,
  alt_text text not null default '',
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index catalog_categories_parent_id_idx on public.catalog_categories (parent_id);
create index products_category_id_idx on public.products (category_id);
create index product_colors_color_id_idx on public.product_colors (color_id);
create index product_fragrances_fragrance_id_idx on public.product_fragrances (fragrance_id);
create index product_images_product_id_sort_idx on public.product_images (product_id, sort_order);
create index product_images_color_id_idx on public.product_images (color_id) where color_id is not null;
create unique index product_images_one_primary_idx on public.product_images (product_id) where is_primary = true;

drop trigger if exists catalog_categories_set_updated_at on public.catalog_categories;
create trigger catalog_categories_set_updated_at before update on public.catalog_categories
for each row execute function private.set_updated_at();
drop trigger if exists catalog_colors_set_updated_at on public.catalog_colors;
create trigger catalog_colors_set_updated_at before update on public.catalog_colors
for each row execute function private.set_updated_at();
drop trigger if exists catalog_fragrances_set_updated_at on public.catalog_fragrances;
create trigger catalog_fragrances_set_updated_at before update on public.catalog_fragrances
for each row execute function private.set_updated_at();

insert into public.catalog_categories (name, slug, sort_order)
values ('Bougies', 'bougie', 1), ('Savons', 'savon', 2), ('Diffuseurs', 'diffuseur', 3), ('Coffrets', 'coffret', 4)
on conflict (slug) do nothing;

update public.products as product
set category_id = category.id
from public.catalog_categories as category
where category.slug = product.category and product.category_id is null;

insert into public.catalog_colors (name, hex_code, sort_order)
select distinct source.name, '#E8DFD2', row_number() over (order by source.name)
from (
  select nullif(trim(color), '') as name from public.products
  union
  select nullif(trim(color), '') as name from public.product_variants
) as source
where source.name is not null
on conflict (name) do nothing;

insert into public.catalog_fragrances (name, slug, composition, sort_order)
select source.name,
       trim(both '-' from regexp_replace(lower(translate(source.name, 'àáâäãåçèéêëìíîïñòóôöõùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy')), '[^a-z0-9]+', '-', 'g')),
       max(source.composition),
       row_number() over (order by source.name)
from (
  select nullif(trim(scent), '') as name, composition from public.products
  union all
  select nullif(trim(scent), '') as name, composition from public.product_variants
) as source
where source.name is not null
group by source.name
on conflict (slug) do nothing;

insert into public.product_colors (product_id, color_id)
select distinct source.product_id, color.id
from (
  select id as product_id, nullif(trim(color), '') as name from public.products
  union
  select product_id, nullif(trim(color), '') as name from public.product_variants
) as source
join public.catalog_colors as color on color.name = source.name
on conflict do nothing;

insert into public.product_fragrances (product_id, fragrance_id)
select distinct source.product_id, fragrance.id
from (
  select id as product_id, nullif(trim(scent), '') as name from public.products
  union
  select product_id, nullif(trim(scent), '') as name from public.product_variants
) as source
join public.catalog_fragrances as fragrance on fragrance.name = source.name
on conflict do nothing;

insert into public.product_images (product_id, image_url, alt_text, is_primary, sort_order)
select id, image_url, name, true, 0 from public.products where image_url <> ''
on conflict (product_id) where is_primary = true do nothing;

alter table public.catalog_categories enable row level security;
alter table public.catalog_colors enable row level security;
alter table public.catalog_fragrances enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_fragrances enable row level security;
alter table public.product_images enable row level security;

revoke all on public.catalog_categories, public.catalog_colors, public.catalog_fragrances, public.product_colors, public.product_fragrances, public.product_images from anon, authenticated;
grant select on public.catalog_categories, public.catalog_colors, public.catalog_fragrances, public.product_colors, public.product_fragrances, public.product_images to anon, authenticated;
grant insert, update, delete on public.catalog_categories, public.catalog_colors, public.catalog_fragrances, public.product_colors, public.product_fragrances, public.product_images to authenticated;

create policy "Visitors read active categories" on public.catalog_categories for select to anon using (active = true);
create policy "Staff read all categories" on public.catalog_categories for select to authenticated using (active = true or (select private.is_staff()));
create policy "Admins add categories" on public.catalog_categories for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update categories" on public.catalog_categories for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete categories" on public.catalog_categories for delete to authenticated using ((select private.is_admin()));

create policy "Visitors read active colors" on public.catalog_colors for select to anon using (active = true);
create policy "Staff read all colors" on public.catalog_colors for select to authenticated using (active = true or (select private.is_staff()));
create policy "Admins add colors" on public.catalog_colors for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update colors" on public.catalog_colors for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete colors" on public.catalog_colors for delete to authenticated using ((select private.is_admin()));

create policy "Visitors read active fragrances" on public.catalog_fragrances for select to anon using (active = true);
create policy "Staff read all fragrances" on public.catalog_fragrances for select to authenticated using (active = true or (select private.is_staff()));
create policy "Admins add fragrances" on public.catalog_fragrances for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update fragrances" on public.catalog_fragrances for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete fragrances" on public.catalog_fragrances for delete to authenticated using ((select private.is_admin()));

create policy "Visitors read product colors" on public.product_colors for select to anon using (exists (select 1 from public.products where products.id = product_colors.product_id and products.published));
create policy "Staff read product colors" on public.product_colors for select to authenticated using ((select private.is_staff()) or exists (select 1 from public.products where products.id = product_colors.product_id and products.published));
create policy "Staff add product colors" on public.product_colors for insert to authenticated with check ((select private.is_staff()));
create policy "Staff delete product colors" on public.product_colors for delete to authenticated using ((select private.is_staff()));

create policy "Visitors read product fragrances" on public.product_fragrances for select to anon using (exists (select 1 from public.products where products.id = product_fragrances.product_id and products.published));
create policy "Staff read product fragrances" on public.product_fragrances for select to authenticated using ((select private.is_staff()) or exists (select 1 from public.products where products.id = product_fragrances.product_id and products.published));
create policy "Staff add product fragrances" on public.product_fragrances for insert to authenticated with check ((select private.is_staff()));
create policy "Staff delete product fragrances" on public.product_fragrances for delete to authenticated using ((select private.is_staff()));

create policy "Visitors read product images" on public.product_images for select to anon using (exists (select 1 from public.products where products.id = product_images.product_id and products.published));
create policy "Staff read product images" on public.product_images for select to authenticated using ((select private.is_staff()) or exists (select 1 from public.products where products.id = product_images.product_id and products.published));
create policy "Staff add product images" on public.product_images for insert to authenticated with check ((select private.is_staff()));
create policy "Staff update product images" on public.product_images for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "Staff delete product images" on public.product_images for delete to authenticated using ((select private.is_staff()));

drop policy if exists "Admins can read their own membership" on public.admins;
create policy "Staff read own membership or admins read all" on public.admins for select to authenticated
using ((select auth.uid()) = user_id or (select private.is_admin()));

drop policy if exists "Signed in users read published products or administer" on public.products;
create policy "Signed in users read published products or staff" on public.products for select to authenticated
using (published = true or (select private.is_staff()));
drop policy if exists "Admins can add products" on public.products;
create policy "Staff can add products" on public.products for insert to authenticated with check ((select private.is_staff()));
drop policy if exists "Admins can update products" on public.products;
create policy "Staff can update products" on public.products for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists "Admins can delete products" on public.products;
create policy "Staff can delete products" on public.products for delete to authenticated using ((select private.is_staff()));

drop policy if exists "Signed in users read published gallery images or administer" on public.gallery_images;
create policy "Signed in users read published gallery images or staff" on public.gallery_images for select to authenticated using (published = true or (select private.is_staff()));
drop policy if exists "Admins can add gallery images" on public.gallery_images;
create policy "Staff can add gallery images" on public.gallery_images for insert to authenticated with check ((select private.is_staff()));
drop policy if exists "Admins can update gallery images" on public.gallery_images;
create policy "Staff can update gallery images" on public.gallery_images for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists "Admins can delete gallery images" on public.gallery_images;
create policy "Staff can delete gallery images" on public.gallery_images for delete to authenticated using ((select private.is_staff()));

drop policy if exists "Signed in users read published markets or administer" on public.markets;
create policy "Signed in users read published markets or staff" on public.markets for select to authenticated using (published = true or (select private.is_staff()));
drop policy if exists "Admins can add markets" on public.markets;
create policy "Staff can add markets" on public.markets for insert to authenticated with check ((select private.is_staff()));
drop policy if exists "Admins can update markets" on public.markets;
create policy "Staff can update markets" on public.markets for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists "Admins can delete markets" on public.markets;
create policy "Staff can delete markets" on public.markets for delete to authenticated using ((select private.is_staff()));

drop policy if exists "Signed in users read public variants or administer" on public.product_variants;
create policy "Signed in users read public variants or staff" on public.product_variants for select to authenticated using ((select private.is_staff()) or exists (select 1 from public.products where products.id = product_variants.product_id and products.published));
drop policy if exists "Admins can add product variants" on public.product_variants;
create policy "Staff can add product variants" on public.product_variants for insert to authenticated with check ((select private.is_staff()));
drop policy if exists "Admins can update product variants" on public.product_variants;
create policy "Staff can update product variants" on public.product_variants for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
drop policy if exists "Admins can delete product variants" on public.product_variants;
create policy "Staff can delete product variants" on public.product_variants for delete to authenticated using ((select private.is_staff()));

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Staff can upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and (select private.is_staff()));
drop policy if exists "Admins can read product images" on storage.objects;
create policy "Staff can read product images" on storage.objects for select to authenticated using (bucket_id = 'product-images' and (select private.is_staff()));
drop policy if exists "Admins can update product images" on storage.objects;
create policy "Staff can update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and (select private.is_staff())) with check (bucket_id = 'product-images' and (select private.is_staff()));
drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Staff can delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and (select private.is_staff()));

drop policy if exists "Admins can upload gallery images" on storage.objects;
create policy "Staff can upload gallery images" on storage.objects for insert to authenticated with check (bucket_id = 'gallery-images' and (select private.is_staff()));
drop policy if exists "Admins can read gallery images" on storage.objects;
create policy "Staff can read gallery images" on storage.objects for select to authenticated using (bucket_id = 'gallery-images' and (select private.is_staff()));
drop policy if exists "Admins can update gallery images" on storage.objects;
create policy "Staff can update gallery images" on storage.objects for update to authenticated using (bucket_id = 'gallery-images' and (select private.is_staff())) with check (bucket_id = 'gallery-images' and (select private.is_staff()));
drop policy if exists "Admins can delete gallery images" on storage.objects;
create policy "Staff can delete gallery images" on storage.objects for delete to authenticated using (bucket_id = 'gallery-images' and (select private.is_staff()));
