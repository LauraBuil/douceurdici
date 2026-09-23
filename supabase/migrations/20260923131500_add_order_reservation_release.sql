create or replace function public.release_order_reservation(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_row record;
begin
  select id, status
  into order_row
  from public.orders
  where id = p_order_id
  for update;

  if not found or order_row.status <> 'reserved' then
    return false;
  end if;

  update public.products as product
  set stock = product.stock + item.quantity
  from public.order_items as item
  where item.order_id = p_order_id
    and item.product_id = product.id
    and item.is_preorder = false;

  update public.orders
  set status = 'cancelled', updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.release_order_reservation(uuid) from public, anon, authenticated;
grant execute on function public.release_order_reservation(uuid) to service_role;
