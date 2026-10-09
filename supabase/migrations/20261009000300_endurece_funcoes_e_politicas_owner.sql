-- Mantém sincronizado o endurecimento aplicado no projeto de desenvolvimento.
revoke all on function public.is_store_member(uuid) from public, anon;
grant execute on function public.is_store_member(uuid) to authenticated;
revoke all on function public.create_store_for_current_user(text) from public, anon;
grant execute on function public.create_store_for_current_user(text) to authenticated;

create or replace function public.is_store_owner(target_store uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.store_members m
    where m.store_id = target_store
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;
revoke all on function public.is_store_owner(uuid) from public, anon;
grant execute on function public.is_store_owner(uuid) to authenticated;

drop policy if exists "owners can update own store" on public.stores;
create policy "owners can update own store" on public.stores
for update to authenticated using (public.is_store_owner(id)) with check (public.is_store_owner(id));

drop policy if exists "owners can manage members" on public.store_members;
create policy "owners can manage members" on public.store_members
for all to authenticated using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
