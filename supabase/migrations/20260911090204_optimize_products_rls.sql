drop policy "Published products are public" on public.products;
drop policy "Admins can read every product" on public.products;

create policy "Visitors can read published products"
on public.products for select
to anon
using (published = true);

create policy "Signed in users read published products or administer"
on public.products for select
to authenticated
using (published = true or (select private.is_admin()));
