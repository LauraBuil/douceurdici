insert into public.catalog_categories (name, slug, parent_id, active, sort_order)
select 'Bébé & naissance', 'bougie-bebe-naissance', parent.id, true, 8
from public.catalog_categories as parent
where parent.slug = 'bougie'
on conflict (slug) do update
set name = excluded.name,
    parent_id = excluded.parent_id,
    active = true,
    sort_order = excluded.sort_order;
