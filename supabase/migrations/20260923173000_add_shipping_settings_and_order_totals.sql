alter table public.site_settings
  add column if not exists numeric_value numeric(10,2) not null default 0;

alter table public.site_settings
  drop constraint if exists site_settings_known_keys;

alter table public.site_settings
  add constraint site_settings_known_keys
  check (id in ('cart_enabled', 'shipping_rate'));

insert into public.site_settings (id, numeric_value)
values ('shipping_rate', 0)
on conflict (id) do nothing;

alter table public.orders
  add column if not exists shipping_amount numeric(10,2) not null default 0,
  add column if not exists total numeric(10,2) not null default 0;

update public.orders
set total = subtotal
where total = 0;
