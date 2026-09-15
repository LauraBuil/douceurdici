with requested(name, slug, parent_slug, sort_order) as (
  values
    ('Diffuseurs d’ambiance', 'diffuseur-ambiance', 'diffuseur', 1),
    ('Diffuseurs de voiture', 'diffuseur-voiture', 'diffuseur', 2),
    ('Mariage', 'bougie-mariage', 'bougie', 1),
    ('Anniversaire', 'bougie-anniversaire', 'bougie', 2),
    ('Baptême', 'bougie-bapteme', 'bougie', 3),
    ('Halloween', 'bougie-halloween', 'bougie', 4),
    ('Noël', 'bougie-noel', 'bougie', 5),
    ('Fête des mères', 'bougie-fete-des-meres', 'bougie', 6),
    ('Fête des pères', 'bougie-fete-des-peres', 'bougie', 7)
)
insert into public.catalog_categories (name, slug, parent_id, active, sort_order)
select requested.name, requested.slug, parent.id, true, requested.sort_order
from requested
join public.catalog_categories as parent on parent.slug = requested.parent_slug
on conflict (slug) do update
set name = excluded.name,
    parent_id = excluded.parent_id,
    active = true,
    sort_order = excluded.sort_order;
