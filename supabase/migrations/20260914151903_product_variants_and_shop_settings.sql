create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color text not null default '',
  scent text not null default '',
  composition text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_unique_combination unique (product_id, color, scent)
);

create index if not exists product_variants_product_id_idx
on public.product_variants (product_id, sort_order);

create table if not exists public.site_settings (
  id text primary key,
  boolean_value boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint site_settings_known_keys check (id in ('cart_enabled'))
);

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at before update on public.product_variants
for each row execute function private.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function private.set_updated_at();

alter table public.product_variants enable row level security;
alter table public.site_settings enable row level security;

revoke all on public.product_variants from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;
grant select on public.product_variants, public.site_settings to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant insert, update on public.site_settings to authenticated;

create policy "Visitors can read variants of published products"
on public.product_variants for select to anon
using (exists (
  select 1 from public.products
  where products.id = product_variants.product_id
    and products.published = true
));

create policy "Signed in users read public variants or administer"
on public.product_variants for select to authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and products.published = true
  )
  or (select private.is_admin())
);

create policy "Admins can add product variants"
on public.product_variants for insert to authenticated
with check ((select private.is_admin()));

create policy "Admins can update product variants"
on public.product_variants for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins can delete product variants"
on public.product_variants for delete to authenticated
using ((select private.is_admin()));

create policy "Site settings are public"
on public.site_settings for select to anon, authenticated
using (true);

create policy "Admins can add site settings"
on public.site_settings for insert to authenticated
with check ((select private.is_admin()));

create policy "Admins can update site settings"
on public.site_settings for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

insert into public.site_settings (id, boolean_value)
values ('cart_enabled', false)
on conflict (id) do nothing;
