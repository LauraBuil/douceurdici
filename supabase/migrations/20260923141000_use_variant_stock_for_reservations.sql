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
    select id from public.orders
    where status = 'reserved' and reservation_expires_at <= now()
    for update skip locked
  loop
    update public.product_variants as variant
    set stock = variant.stock + item.quantity
    from public.order_items as item
    where item.order_id = expired_order.id
      and item.variant_id = variant.id
      and item.is_preorder = false;

    update public.products as product
    set stock = product.stock + item.quantity
    from public.order_items as item
    where item.order_id = expired_order.id
      and item.product_id = product.id
      and item.variant_id is null
      and item.is_preorder = false;

    update public.orders set status = 'expired', updated_at = now()
    where id = expired_order.id;
    released_count := released_count + 1;
  end loop;
  return released_count;
end;
$$;

create or replace function public.release_order_reservation(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare order_row record;
begin
  select id, status into order_row from public.orders where id = p_order_id for update;
  if not found or order_row.status <> 'reserved' then return false; end if;
  update public.product_variants as variant
  set stock = variant.stock + item.quantity
  from public.order_items as item
  where item.order_id = p_order_id and item.variant_id = variant.id and item.is_preorder = false;
  update public.products as product
  set stock = product.stock + item.quantity
  from public.order_items as item
  where item.order_id = p_order_id and item.product_id = product.id
    and item.variant_id is null and item.is_preorder = false;
  update public.orders set status = 'cancelled', updated_at = now() where id = p_order_id;
  return true;
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
  variant_row record;
  new_order_id uuid;
  order_subtotal numeric(10,2) := 0;
  reservation_expiry timestamptz := now() + interval '15 minutes';
  has_variants boolean;
  available_stock integer;
  selected_variant_id uuid;
  selected_color_name text;
  selected_fragrance_name text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Le panier est vide.';
  end if;
  perform public.release_expired_order_reservations();
  insert into public.orders (status, reservation_expires_at)
  values ('reserved', reservation_expiry) returning id into new_order_id;

  for requested_item in
    select * from jsonb_to_recordset(p_items) as item(
      product_id uuid, variant_id uuid, quantity integer,
      color_id uuid, color_name text, color_hex_code text,
      fragrance_id uuid, fragrance_name text
    )
  loop
    if requested_item.quantity is null or requested_item.quantity < 1 or requested_item.quantity > 99 then
      raise exception using errcode = '22023', message = 'La quantité demandée est invalide.';
    end if;
    select id, name, price, stock, published into product_row
    from public.products where id = requested_item.product_id and published = true for update;
    if not found then
      raise exception using errcode = 'P0002', message = 'Un produit du panier n’est plus disponible.';
    end if;

    select exists(select 1 from public.product_variants where product_id = product_row.id)
    into has_variants;
    selected_variant_id := null;
    selected_color_name := requested_item.color_name;
    selected_fragrance_name := requested_item.fragrance_name;

    if has_variants then
      select variant.* into variant_row from public.product_variants as variant
      where variant.product_id = product_row.id
        and (requested_item.variant_id is null or variant.id = requested_item.variant_id)
        and variant.color_id is not distinct from requested_item.color_id
        and variant.fragrance_id is not distinct from requested_item.fragrance_id
      for update;
      if not found then
        raise exception using errcode = 'P0002', message = 'La combinaison choisie n’est plus disponible.';
      end if;
      selected_variant_id := variant_row.id;
      available_stock := variant_row.stock;
      selected_color_name := nullif(variant_row.color, '');
      selected_fragrance_name := nullif(variant_row.scent, '');
      if available_stock > 0 and available_stock < requested_item.quantity then
        raise exception using errcode = 'P0001', message = format('Le stock de « %s » est insuffisant.', product_row.name);
      end if;
      if available_stock > 0 then
        update public.product_variants set stock = stock - requested_item.quantity where id = selected_variant_id;
      end if;
    else
      available_stock := product_row.stock;
      if available_stock > 0 and available_stock < requested_item.quantity then
        raise exception using errcode = 'P0001', message = format('Le stock de « %s » est insuffisant.', product_row.name);
      end if;
      if available_stock > 0 then
        update public.products set stock = stock - requested_item.quantity where id = product_row.id;
      end if;
    end if;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, unit_price, quantity,
      is_preorder, color_id, color_name, color_hex_code, fragrance_id, fragrance_name
    ) values (
      new_order_id, product_row.id, selected_variant_id, product_row.name, product_row.price,
      requested_item.quantity, available_stock = 0, requested_item.color_id,
      selected_color_name, requested_item.color_hex_code, requested_item.fragrance_id,
      selected_fragrance_name
    );
    order_subtotal := order_subtotal + product_row.price * requested_item.quantity;
  end loop;
  update public.orders set subtotal = order_subtotal where id = new_order_id;
  return jsonb_build_object('order_id', new_order_id, 'status', 'reserved', 'subtotal', order_subtotal, 'reservation_expires_at', reservation_expiry);
end;
$$;
