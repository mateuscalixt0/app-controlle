create or replace function public.create_store_for_current_user(store_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_store_id uuid;
  clean_name text := trim(store_name);
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;
  if clean_name is null or length(clean_name) < 1 or length(clean_name) > 160 then
    raise exception 'Nome da loja inválido' using errcode = '22023';
  end if;
  if exists (select 1 from public.store_members where user_id = auth.uid()) then
    raise exception 'Usuário já está associado a uma loja' using errcode = '23505';
  end if;

  insert into public.stores(name) values (clean_name) returning id into new_store_id;
  insert into public.store_members(store_id, user_id, role) values (new_store_id, auth.uid(), 'owner');
  return new_store_id;
end;
$$;
revoke all on function public.create_store_for_current_user(text) from public, anon;
grant execute on function public.create_store_for_current_user(text) to authenticated;

create function public.is_store_owner(target_store uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.store_members m
    where m.store_id = target_store and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;
revoke all on function public.is_store_owner(uuid) from public, anon;
grant execute on function public.is_store_owner(uuid) to authenticated;

create policy "owners can update own store" on public.stores
for update to authenticated using (public.is_store_owner(id)) with check (public.is_store_owner(id));

create policy "owners can manage members" on public.store_members
for all to authenticated using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));

grant update on public.stores to authenticated;
grant insert, update, delete on public.store_members to authenticated;
