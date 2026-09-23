alter table public.product_variants
  add column if not exists color_id uuid references public.catalog_colors(id) on delete set null,
  add column if not exists fragrance_id uuid references public.catalog_fragrances(id) on delete set null,
  add column if not exists stock integer not null default 0;

alter table public.product_variants
  drop constraint if exists product_variants_stock_non_negative;

alter table public.product_variants
  add constraint product_variants_stock_non_negative check (stock >= 0);

create index if not exists product_variants_combination_idx
  on public.product_variants (product_id, color_id, fragrance_id);

alter table public.order_items
  add column if not exists variant_id uuid,
  add column if not exists fragrance_id uuid,
  add column if not exists fragrance_name text;
