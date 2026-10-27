-- Separa o item fiscal da identidade do produto e só publica preço após confirmação.
alter table public.nfe_imports alter column access_key drop not null;
alter table public.nfe_imports add column if not exists invoice_number text;
alter table public.nfe_imports add column if not exists series text;
alter table public.nfe_imports add column if not exists model text;
alter table public.nfe_imports add column source_fingerprint text;
alter table public.nfe_imports add constraint nfe_imports_store_id_key unique (store_id, id);
alter table public.nfe_imports add constraint nfe_imports_store_fingerprint_key unique (store_id, source_fingerprint);
alter table public.suppliers add column if not exists document text
  check (document is null or document ~ '^[0-9]{14}$');
create unique index if not exists suppliers_store_document_idx
  on public.suppliers(store_id, document) where document is not null;

drop policy if exists "members manage nfe imports" on public.nfe_imports;
create policy "members read nfe imports" on public.nfe_imports
  for select to authenticated using (public.is_store_member(store_id));
revoke insert, update, delete on public.nfe_imports from authenticated;
grant select on public.nfe_imports to authenticated;

create table public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  supplier_id uuid not null,
  supplier_code text,
  description_original text not null check (length(trim(description_original)) between 1 and 200),
  description_normalized text not null,
  gtin text,
  ncm text,
  reference_unit text not null,
  product_id uuid,
  association_status text not null default 'pending' check (association_status in ('pending', 'confirmed')),
  confirmed_at timestamptz,
  created_product_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, supplier_id) references public.suppliers(store_id, id),
  foreign key (store_id, product_id) references public.products(store_id, id),
  foreign key (store_id, created_product_id) references public.products(store_id, id),
  check ((association_status = 'confirmed') = (product_id is not null)),
  check ((association_status = 'confirmed') = (confirmed_at is not null))
);
create unique index supplier_products_store_supplier_code_idx
  on public.supplier_products(store_id, supplier_id, supplier_code) where active and supplier_code is not null and supplier_code <> '';
create index supplier_products_store_supplier_gtin_idx
  on public.supplier_products(store_id, supplier_id, gtin) where active and gtin is not null;
create index supplier_products_pending_idx on public.supplier_products(store_id, association_status, created_at desc);
alter table public.supplier_products enable row level security;
create policy "members read supplier products" on public.supplier_products
  for select to authenticated using (public.is_store_member(store_id));
revoke insert, update, delete on public.supplier_products from authenticated;
grant select on public.supplier_products to authenticated;

create table public.product_association_rejections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  supplier_product_id uuid not null,
  candidate_product_id uuid not null,
  created_at timestamptz not null default now(),
  unique (store_id, supplier_product_id, candidate_product_id),
  foreign key (store_id, supplier_product_id) references public.supplier_products(store_id, id) on delete cascade,
  foreign key (store_id, candidate_product_id) references public.products(store_id, id) on delete cascade
);
alter table public.product_association_rejections enable row level security;
create policy "members read product association rejections" on public.product_association_rejections
  for select to authenticated using (public.is_store_member(store_id));
revoke insert, update, delete on public.product_association_rejections from authenticated;
grant select on public.product_association_rejections to authenticated;

create table if not exists public.nfe_import_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  nfe_import_id uuid not null,
  product_id uuid,
  product_name text not null check (length(trim(product_name)) between 1 and 200),
  quantity numeric(14, 4) not null check (quantity > 0),
  unit text not null check (length(trim(unit)) between 1 and 80),
  unit_price numeric(20, 10) not null check (unit_price >= 0),
  total numeric(14, 2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  foreign key (store_id, nfe_import_id) references public.nfe_imports(store_id, id) on delete cascade,
  foreign key (store_id, product_id) references public.products(store_id, id)
);
-- vUnCom na NF-e admite até dez casas decimais; preserve o valor fiscal original.
alter table public.nfe_import_items alter column unit_price type numeric(20, 10);
alter table public.price_entries alter column unit_price type numeric(20, 10);
alter table public.nfe_import_items alter column product_id drop not null;
alter table public.nfe_import_items add column if not exists supplier_product_id uuid;
alter table public.nfe_import_items add column if not exists item_number integer;
alter table public.nfe_import_items add column if not exists supplier_code text;
alter table public.nfe_import_items add column if not exists gtin text;
alter table public.nfe_import_items add column if not exists ncm text;
alter table public.nfe_import_items add column if not exists description_normalized text;
alter table public.nfe_import_items add constraint nfe_import_items_store_id_key unique (store_id, id);
alter table public.nfe_import_items add constraint nfe_import_items_supplier_product_fk
  foreign key (store_id, supplier_product_id) references public.supplier_products(store_id, id);
create unique index nfe_import_items_store_import_item_number_idx
  on public.nfe_import_items(store_id, nfe_import_id, item_number) where item_number is not null;
create index nfe_import_items_store_supplier_product_idx on public.nfe_import_items(store_id, supplier_product_id);
alter table public.nfe_import_items enable row level security;
drop policy if exists "members manage nfe import items" on public.nfe_import_items;
create policy "members read nfe import items" on public.nfe_import_items
  for select to authenticated using (public.is_store_member(store_id));
revoke insert, update, delete on public.nfe_import_items from authenticated;
grant select on public.nfe_import_items to authenticated;

alter table public.price_entries add column nfe_import_item_id uuid;
alter table public.price_entries add constraint price_entries_nfe_item_fk
  foreign key (store_id, nfe_import_item_id) references public.nfe_import_items(store_id, id);
create unique index price_entries_store_nfe_item_idx
  on public.price_entries(store_id, nfe_import_item_id) where nfe_import_item_id is not null;
drop policy if exists "members manage price entries" on public.price_entries;
create policy "members read price entries" on public.price_entries
  for select to authenticated using (public.is_store_member(store_id));
create policy "members insert manual price entries" on public.price_entries
  for insert to authenticated with check (public.is_store_member(store_id) and nfe_import_item_id is null);
create policy "members update manual price entries" on public.price_entries
  for update to authenticated using (public.is_store_member(store_id) and nfe_import_item_id is null)
  with check (public.is_store_member(store_id) and nfe_import_item_id is null);
create policy "members delete manual price entries" on public.price_entries
  for delete to authenticated using (public.is_store_member(store_id) and nfe_import_item_id is null);

create or replace function public.is_valid_gtin(candidate text)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select case when candidate ~ '^([0-9]{8}|[0-9]{12}|[0-9]{13}|[0-9]{14})$' and candidate !~ '^0+$' then
    (10 - coalesce((select sum(substr(candidate, digit_pos, 1)::integer *
      case when (length(candidate) - digit_pos) % 2 = 1 then 3 else 1 end)
      from generate_series(1, length(candidate) - 1) as digit_pos), 0) % 10) % 10 = right(candidate, 1)::integer
  else false end;
$$;
revoke all on function public.is_valid_gtin(text) from public, anon, authenticated;

create or replace function public.product_text_similarity(left_text text, right_text text)
returns numeric language sql immutable security invoker set search_path = '' as $$
  with left_tokens as (
    select distinct token from regexp_split_to_table(upper(coalesce(left_text, '')), '[^A-Z0-9/]+') token
    where length(token) > 1 and token not in ('PARA', 'COM', 'SEM', 'COR')
  ), right_tokens as (
    select distinct token from regexp_split_to_table(upper(coalesce(right_text, '')), '[^A-Z0-9/]+') token
    where length(token) > 1 and token not in ('PARA', 'COM', 'SEM', 'COR')
  ), counts as (
    select (select count(*) from left_tokens) left_count,
      (select count(*) from right_tokens) right_count,
      (select count(*) from left_tokens join right_tokens using (token)) overlap_count
  )
  select case when greatest(left_count, right_count) = 0 then 0
    else overlap_count::numeric / greatest(left_count, right_count) end from counts;
$$;
revoke all on function public.product_text_similarity(text, text) from public, anon, authenticated;

-- Transação mantém os dados fiscais, mas preço só entra no catálogo se a origem já foi confirmada.
drop function if exists public.import_nfe_for_current_store(text, text, text, text, date, text, jsonb);
drop function if exists public.import_nfe_for_current_store(text, text, date, text, jsonb);
create or replace function public.import_nfe_for_current_store(
  p_store_id uuid, p_access_key text, p_supplier_name text, p_supplier_cnpj text, p_invoice_number text,
  p_series text, p_model text, p_issued_on date, p_original_name text, p_items jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_store uuid;
  v_supplier uuid;
  v_import uuid;
  v_item jsonb;
  v_source uuid;
  v_product uuid;
  v_gtin text;
  v_code text;
  v_number integer := 0;
  v_import_item uuid;
  v_fingerprint text;
  v_source_row public.supplier_products%rowtype;
begin
  select store_id into strict v_store from public.store_members where user_id = (select auth.uid()) and store_id = p_store_id;
  if (p_access_key is not null and p_access_key !~ '^[0-9]{44}$') or p_supplier_name is null or length(trim(p_supplier_name)) not between 1 and 160
    or p_supplier_cnpj !~ '^[0-9]{14}$' or p_invoice_number !~ '^[0-9]{1,9}$' or p_issued_on is null
    or p_series !~ '^[0-9]{1,3}$' or p_model <> '55'
    or p_original_name is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 1000
  then raise exception 'Dados da NF-e inválidos'; end if;
  if p_access_key is null then
    v_fingerprint := md5(concat_ws('|', p_supplier_cnpj, p_model, p_series, p_invoice_number, p_issued_on::text));
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_store::text || coalesce(p_access_key, v_fingerprint), 0));

  select id into v_supplier from public.suppliers where store_id = v_store and document = p_supplier_cnpj limit 1;
  if v_supplier is null then
    insert into public.suppliers(store_id, name, document) values (v_store, trim(p_supplier_name), p_supplier_cnpj)
      on conflict (store_id, name) do update set document = coalesce(public.suppliers.document, excluded.document)
      where public.suppliers.document is null or public.suppliers.document = excluded.document
      returning id into v_supplier;
    if v_supplier is null then raise exception 'Fornecedor com este nome já existe com outro CNPJ'; end if;
  end if;
  insert into public.nfe_imports(store_id, access_key, source_fingerprint, supplier_id, issued_on, original_name, invoice_number, series, model)
    values (v_store, p_access_key, v_fingerprint, v_supplier, p_issued_on, p_original_name, p_invoice_number, p_series, p_model) returning id into v_import;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_number := v_number + 1;
    if coalesce(v_item->>'name', '') = '' or coalesce(v_item->>'unit', '') = ''
      or coalesce(v_item->>'item_number', '') !~ '^[1-9][0-9]{0,3}$'
      or coalesce(v_item->>'quantity', '') !~ '^\d+(\.\d{1,4})?$'
      or coalesce(v_item->>'unit_price', '') !~ '^\d+(\.\d{1,10})?$'
      or coalesce(v_item->>'total', '') !~ '^\d+(\.\d{1,2})?$'
    then raise exception 'Item inválido'; end if;
    v_number := (v_item->>'item_number')::integer;
    v_code := nullif(left(v_item->>'supplier_code', 100), '');
    v_gtin := nullif(v_item->>'gtin', '');
    if v_gtin is not null and not public.is_valid_gtin(v_gtin) then raise exception 'GTIN inválido'; end if;
    v_product := null;
    v_source := null;
    v_source_row := null;

    if v_code is not null then
      select * into v_source_row from public.supplier_products
        where store_id = v_store and supplier_id = v_supplier and supplier_code = v_code and active for update;
    end if;
    if v_source_row.id is null and v_gtin is not null then
      if (select count(*) from public.supplier_products where store_id = v_store and supplier_id = v_supplier and gtin = v_gtin and active) = 1 then
        select * into v_source_row from public.supplier_products
          where store_id = v_store and supplier_id = v_supplier and gtin = v_gtin and active for update;
      end if;
    end if;
    v_source := v_source_row.id;
    v_product := v_source_row.product_id;
    if v_source is not null and (
      upper(trim(v_source_row.reference_unit)) <> upper(trim(v_item->>'unit'))
      or (v_source_row.gtin is not null and v_gtin is not null and v_source_row.gtin <> v_gtin)
      or regexp_replace(v_source_row.description_normalized, '[^0-9/,.]+', '', 'g')
        <> regexp_replace(coalesce(v_item->>'normalized_name', v_item->>'name'), '[^0-9/,.]+', '', 'g')
      or public.product_text_similarity(v_source_row.description_normalized, coalesce(v_item->>'normalized_name', v_item->>'name')) < 0.35
    ) then
      update public.supplier_products set active = false where id = v_source;
      v_source := null;
      v_product := null;
      v_source_row := null;
    end if;
    if v_source is null then
      insert into public.supplier_products(store_id, supplier_id, supplier_code, description_original,
        description_normalized, gtin, ncm, reference_unit)
      values (v_store, v_supplier, v_code, left(v_item->>'name', 200), left(coalesce(v_item->>'normalized_name', v_item->>'name'), 240),
        v_gtin, nullif(left(v_item->>'ncm', 8), ''), left(v_item->>'unit', 80)) returning id into v_source;
    elsif v_source_row.gtin is null and v_gtin is not null then
      update public.supplier_products set gtin = v_gtin where id = v_source;
    end if;
    insert into public.nfe_import_items(store_id, nfe_import_id, product_id, supplier_product_id, item_number,
      supplier_code, gtin, ncm, description_normalized, product_name, quantity, unit, unit_price, total)
    values (v_store, v_import, v_product, v_source, v_number, v_code, v_gtin, nullif(left(v_item->>'ncm', 8), ''),
      left(coalesce(v_item->>'normalized_name', v_item->>'name'), 240), left(v_item->>'name', 200),
      (v_item->>'quantity')::numeric, left(v_item->>'unit', 80), (v_item->>'unit_price')::numeric, (v_item->>'total')::numeric)
      returning id into v_import_item;
    if v_product is not null then
      insert into public.price_entries(store_id, product_id, supplier_id, unit, unit_price, recorded_on, nfe_import_item_id)
      values (v_store, v_product, v_supplier, left(v_item->>'unit', 80), (v_item->>'unit_price')::numeric, p_issued_on, v_import_item);
    end if;
  end loop;
  return v_import;
end;
$$;
revoke all on function public.import_nfe_for_current_store(uuid, text, text, text, text, text, text, date, text, jsonb) from public, anon;
grant execute on function public.import_nfe_for_current_store(uuid, text, text, text, text, text, text, date, text, jsonb) to authenticated;

create or replace function public.confirm_nfe_product_association(p_store_id uuid, p_source_id uuid, p_product_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_store uuid;
  v_source public.supplier_products%rowtype;
begin
  select store_id into strict v_store from public.store_members where user_id = (select auth.uid()) and store_id = p_store_id;
  select * into strict v_source from public.supplier_products where id = p_source_id and store_id = v_store and active for update;
  if not exists (select 1 from public.products where id = p_product_id and store_id = v_store) then
    raise exception 'Produto não pertence à loja atual';
  end if;
  if v_source.association_status = 'confirmed' then
    if v_source.product_id = p_product_id then return; end if;
    raise exception 'Esta origem já está associada; desfaça o vínculo antes de alterá-lo';
  end if;
  if v_source.gtin is not null then
    perform pg_advisory_xact_lock(hashtextextended(v_store::text || '|gtin|' || v_source.gtin, 0));
  end if;
  if v_source.gtin is not null and exists (
    select 1 from public.supplier_products
    where store_id = v_store and association_status = 'confirmed'
      and id <> p_source_id and gtin = v_source.gtin and product_id <> p_product_id
  ) then
    raise exception 'Este GTIN já está confirmado para outro produto';
  end if;
  update public.supplier_products set product_id = p_product_id, association_status = 'confirmed', confirmed_at = now()
    where id = p_source_id;
  delete from public.product_association_rejections
    where store_id = v_store and supplier_product_id = p_source_id and candidate_product_id = p_product_id;
  update public.nfe_import_items set product_id = p_product_id
    where store_id = v_store and supplier_product_id = p_source_id;
  insert into public.price_entries(store_id, product_id, supplier_id, unit, unit_price, recorded_on, nfe_import_item_id)
    select v_store, p_product_id, i.supplier_id, item.unit, item.unit_price, coalesce(i.issued_on, item.created_at::date), item.id
    from public.nfe_import_items item join public.nfe_imports i on i.id = item.nfe_import_id and i.store_id = item.store_id
    where item.store_id = v_store and item.supplier_product_id = p_source_id;
end;
$$;
revoke all on function public.confirm_nfe_product_association(uuid, uuid, uuid) from public, anon;
grant execute on function public.confirm_nfe_product_association(uuid, uuid, uuid) to authenticated;

create or replace function public.reject_nfe_product_association(p_store_id uuid, p_source_id uuid, p_product_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_store uuid;
begin
  select store_id into strict v_store from public.store_members where user_id = (select auth.uid()) and store_id = p_store_id;
  if not exists (select 1 from public.supplier_products where id = p_source_id and store_id = v_store and association_status = 'pending')
    or not exists (select 1 from public.products where id = p_product_id and store_id = v_store)
  then raise exception 'Sugestão pendente não encontrada'; end if;
  insert into public.product_association_rejections(store_id, supplier_product_id, candidate_product_id)
    values (v_store, p_source_id, p_product_id) on conflict do nothing;
end;
$$;
revoke all on function public.reject_nfe_product_association(uuid, uuid, uuid) from public, anon;
grant execute on function public.reject_nfe_product_association(uuid, uuid, uuid) to authenticated;

create or replace function public.create_product_from_nfe_source(p_store_id uuid, p_source_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_store uuid;
  v_source public.supplier_products%rowtype;
  v_product uuid;
begin
  select store_id into strict v_store from public.store_members where user_id = (select auth.uid()) and store_id = p_store_id;
  select * into strict v_source from public.supplier_products where id = p_source_id and store_id = v_store and active for update;
  if v_source.association_status <> 'pending' then raise exception 'Origem não está pendente'; end if;
  insert into public.products(store_id, name, unit) values (v_store, v_source.description_original, v_source.reference_unit)
    returning id into v_product;
  perform public.confirm_nfe_product_association(v_store, p_source_id, v_product);
  update public.supplier_products set created_product_id = v_product where id = p_source_id and store_id = v_store;
  return v_product;
end;
$$;
revoke all on function public.create_product_from_nfe_source(uuid, uuid) from public, anon;
grant execute on function public.create_product_from_nfe_source(uuid, uuid) to authenticated;

create or replace function public.reset_nfe_product_association(p_store_id uuid, p_source_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_store uuid;
  v_source public.supplier_products%rowtype;
begin
  select store_id into strict v_store from public.store_members where user_id = (select auth.uid()) and store_id = p_store_id;
  select * into strict v_source from public.supplier_products where id = p_source_id and store_id = v_store and active for update;
  if v_source.association_status <> 'confirmed' then raise exception 'Origem não possui vínculo confirmado'; end if;
  delete from public.price_entries where store_id = v_store and nfe_import_item_id in
    (select id from public.nfe_import_items where store_id = v_store and supplier_product_id = p_source_id);
  update public.nfe_import_items set product_id = null where store_id = v_store and supplier_product_id = p_source_id;
  update public.supplier_products set product_id = null, created_product_id = null, association_status = 'pending', confirmed_at = null where id = p_source_id;
  if v_source.created_product_id = v_source.product_id
    and not exists (select 1 from public.missing_items where store_id = v_store and product_id = v_source.product_id)
    and not exists (select 1 from public.price_entries where store_id = v_store and product_id = v_source.product_id)
    and not exists (select 1 from public.supplier_products where store_id = v_store and product_id = v_source.product_id)
  then delete from public.products where store_id = v_store and id = v_source.product_id; end if;
end;
$$;
revoke all on function public.reset_nfe_product_association(uuid, uuid) from public, anon;
grant execute on function public.reset_nfe_product_association(uuid, uuid) to authenticated;
