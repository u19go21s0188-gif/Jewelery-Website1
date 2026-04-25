
create or replace function public.update_updated_at()
returns trigger language plpgsql
security definer
set search_path = public
as $$
begin new.updated_at = now(); return new; end; $$;

drop policy "Anyone can log an inquiry" on public.orders_log;

create policy "Anyone can log inquiry for active product"
on public.orders_log for insert
with check (
  product_id is null or exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active' and p.is_visible = true
  )
);
