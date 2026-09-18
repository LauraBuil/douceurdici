create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.catalog_categories(id) on delete restrict,
  primary key (product_id, category_id)
);

create index product_categories_category_id_idx on public.product_categories (category_id);

insert into public.product_categories (product_id, category_id)
select id, category_id
from public.products
where category_id is not null
on conflict do nothing;

alter table public.product_categories enable row level security;

revoke all on public.product_categories from anon, authenticated;
grant select on public.product_categories to anon, authenticated;
grant insert, delete on public.product_categories to authenticated;

create policy "Visitors read product categories"
on public.product_categories for select to anon
using (
  exists (
    select 1 from public.products
    where products.id = product_categories.product_id
      and products.published
  )
);

create policy "Staff read product categories"
on public.product_categories for select to authenticated
using (
  (select private.is_staff())
  or exists (
    select 1 from public.products
    where products.id = product_categories.product_id
      and products.published
  )
);

create policy "Staff add product categories"
on public.product_categories for insert to authenticated
with check ((select private.is_staff()));

create policy "Staff delete product categories"
on public.product_categories for delete to authenticated
using ((select private.is_staff()));
