create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'reserved'
    check (status in ('reserved', 'pending_payment', 'paid', 'cancelled', 'expired', 'fulfilled')),
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  reserved_at timestamptz not null default now(),
  reservation_expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  is_preorder boolean not null default false,
  color_id uuid,
  color_name text,
  color_hex_code text,
  created_at timestamptz not null default now()
);

create index if not exists orders_reservation_expiry_idx
  on public.orders (status, reservation_expires_at);
create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function private.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
grant select on public.orders, public.order_items to authenticated;

create policy "Staff can read orders" on public.orders
for select to authenticated
using ((select private.is_staff()));

create policy "Staff can read order items" on public.order_items
for select to authenticated
using ((select private.is_staff()));

create or replace function public.release_expired_order_reservations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired_order record;
  released_count integer := 0;
begin
  for expired_order in
    select id
    from public.orders
    where status = 'reserved'
      and reservation_expires_at <= now()
    for update skip locked
  loop
    update public.products as product
    set stock = product.stock + item.quantity
    from public.order_items as item
    where item.order_id = expired_order.id
      and item.product_id = product.id
      and item.is_preorder = false;

    update public.orders
    set status = 'expired', updated_at = now()
    where id = expired_order.id;

    released_count := released_count + 1;
  end loop;

  return released_count;
end;
$$;

create or replace function public.create_order_reservation(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_item record;
  product_row record;
  new_order_id uuid;
  order_subtotal numeric(10,2) := 0;
  reservation_expiry timestamptz := now() + interval '15 minutes';
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Le panier est vide.';
  end if;

  perform public.release_expired_order_reservations();

  insert into public.orders (status, reservation_expires_at)
  values ('reserved', reservation_expiry)
  returning id into new_order_id;

  for requested_item in
    select *
    from jsonb_to_recordset(p_items) as item(
      product_id uuid,
      quantity integer,
      color_id uuid,
      color_name text,
      color_hex_code text
    )
  loop
    if requested_item.quantity is null or requested_item.quantity < 1 or requested_item.quantity > 99 then
      raise exception using errcode = '22023', message = 'La quantité demandée est invalide.';
    end if;

    select id, name, price, stock, published
    into product_row
    from public.products
    where id = requested_item.product_id
      and published = true
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = 'Un produit du panier n’est plus disponible.';
    end if;

    if product_row.stock > 0 then
      if product_row.stock < requested_item.quantity then
        raise exception using errcode = 'P0001', message = format(
          'Le stock de « %s » est insuffisant.', product_row.name
        );
      end if;

      update public.products
      set stock = stock - requested_item.quantity
      where id = product_row.id;
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity,
      is_preorder,
      color_id,
      color_name,
      color_hex_code
    )
    values (
      new_order_id,
      product_row.id,
      product_row.name,
      product_row.price,
      requested_item.quantity,
      product_row.stock <= 0 and product_row.stock = 0,
      requested_item.color_id,
      requested_item.color_name,
      requested_item.color_hex_code
    );

    order_subtotal := order_subtotal + product_row.price * requested_item.quantity;
  end loop;

  update public.orders
  set subtotal = order_subtotal
  where id = new_order_id;

  return jsonb_build_object(
    'order_id', new_order_id,
    'status', 'reserved',
    'subtotal', order_subtotal,
    'reservation_expires_at', reservation_expiry
  );
exception
  when others then
    raise;
end;
$$;

revoke all on function public.create_order_reservation(jsonb) from public, anon, authenticated;
revoke all on function public.release_expired_order_reservations() from public, anon, authenticated;
grant execute on function public.create_order_reservation(jsonb) to anon, authenticated;
