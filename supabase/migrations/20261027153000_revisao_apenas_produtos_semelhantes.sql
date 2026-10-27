-- Novos produtos entram automaticamente; somente semelhanças reais aguardam revisão.
create or replace function public.normalize_product_match_name(value text)
returns text language sql immutable security invoker set search_path = '' as $$
  select trim(regexp_replace(
    regexp_replace(
      translate(upper(coalesce(value, '')),
        'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
        'AAAAAEEEEIIIIOOOOOUUUUCN'),
      '[^A-Z0-9/,.]+', ' ', 'g'),
    '\s+', ' ', 'g'));
$$;

create or replace function public.product_measure_signature(value text)
returns text language sql immutable security invoker set search_path = '' as $$
  select coalesce(string_agg(found[1], '|' order by position), '')
  from regexp_matches(public.normalize_product_match_name(value),
    '([0-9]+(?:[.,][0-9]+)?(?:\s*[X/]\s*[0-9]+(?:[.,][0-9]+)?)?)', 'g')
    with ordinality as matches(found, position);
$$;

create or replace function public.product_match_tokens(value text)
returns text[] language sql immutable security invoker set search_path = '' as $$
  select coalesce(array_agg(token order by position), array[]::text[])
  from regexp_split_to_table(public.normalize_product_match_name(value), '[^A-Z0-9/,.]+')
    with ordinality as words(token, position)
  where length(token) > 1
    and token not in ('PARA','COM','SEM','COR','DE','DA','DO','DAS','DOS',
      'POLEGADA','POLEGADAS','MILIMETRO','MILIMETROS','CENTIMETRO','CENTIMETROS',
      'METRO','METROS','GRAMA','GRAMAS','QUILO','QUILOS','LITRO','LITROS');
$$;

create or replace function public.product_token_similarity(left_text text, right_text text)
returns numeric language sql immutable security invoker set search_path = '' as $$
  with left_tokens as (
    select distinct token from unnest(public.product_match_tokens(left_text)) token
  ), right_tokens as (
    select distinct token from unnest(public.product_match_tokens(right_text)) token
  ), counts as (
    select (select count(*) from left_tokens) left_count,
      (select count(*) from right_tokens) right_count,
      (select count(*) from left_tokens join right_tokens using (token)) overlap_count
  )
  select case when left_count + right_count = 0 then 0
    else (2 * overlap_count)::numeric / (left_count + right_count) end from counts;
$$;

-- Para sugerir revisão, abreviações claras de três ou mais letras contam como próximas.
-- A associação automática continua exigindo igualdade ou um único erro de digitação.
create or replace function public.product_candidate_similarity(left_text text, right_text text)
returns numeric language sql immutable security invoker set search_path = '' as $$
  with left_tokens as (
    select distinct token from unnest(public.product_match_tokens(left_text)) token
  ), right_tokens as (
    select distinct token from unnest(public.product_match_tokens(right_text)) token
  ), counts as (
    select (select count(*) from left_tokens) left_count,
      (select count(*) from right_tokens) right_count,
      (select count(*) from left_tokens left_token
        where exists (select 1 from right_tokens right_token
          where left_token.token = right_token.token
            or (least(length(left_token.token), length(right_token.token)) >= 3
              and (left_token.token like right_token.token || '%'
                or right_token.token like left_token.token || '%')))) left_matches,
      (select count(*) from right_tokens right_token
        where exists (select 1 from left_tokens left_token
          where left_token.token = right_token.token
            or (least(length(left_token.token), length(right_token.token)) >= 3
              and (left_token.token like right_token.token || '%'
                or right_token.token like left_token.token || '%')))) right_matches
  )
  select case when left_count + right_count = 0 then 0
    else (left_matches + right_matches)::numeric / (left_count + right_count) end from counts;
$$;

create or replace function public.is_one_edit_apart(left_token text, right_token text)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare
  shorter text;
  longer text;
  short_pos integer := 1;
  long_pos integer := 1;
  differences integer := 0;
begin
  if left_token = right_token then return false; end if;
  if abs(length(left_token) - length(right_token)) > 1 then return false; end if;
  if length(left_token) <= length(right_token) then shorter := left_token; longer := right_token;
  else shorter := right_token; longer := left_token; end if;
  while short_pos <= length(shorter) and long_pos <= length(longer) loop
    if substr(shorter, short_pos, 1) = substr(longer, long_pos, 1) then
      short_pos := short_pos + 1; long_pos := long_pos + 1;
    else
      differences := differences + 1;
      if differences > 1 then return false; end if;
      if length(shorter) = length(longer) then short_pos := short_pos + 1; end if;
      long_pos := long_pos + 1;
    end if;
  end loop;
  if long_pos <= length(longer) then differences := differences + 1; end if;
  return differences = 1;
end;
$$;

create or replace function public.product_typo_equivalent(left_text text, right_text text)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare
  left_tokens text[] := public.product_match_tokens(left_text);
  right_tokens text[] := public.product_match_tokens(right_text);
  position integer;
  differences integer := 0;
begin
  if cardinality(left_tokens) <> cardinality(right_tokens) or cardinality(left_tokens) = 0 then return false; end if;
  for position in 1..cardinality(left_tokens) loop
    if left_tokens[position] <> right_tokens[position] then
      differences := differences + 1;
      if differences > 1 or not public.is_one_edit_apart(left_tokens[position], right_tokens[position]) then return false; end if;
    end if;
  end loop;
  return differences = 1;
end;
$$;

revoke all on function public.normalize_product_match_name(text) from public, anon, authenticated;
revoke all on function public.product_measure_signature(text) from public, anon, authenticated;
revoke all on function public.product_match_tokens(text) from public, anon, authenticated;
revoke all on function public.product_token_similarity(text, text) from public, anon, authenticated;
revoke all on function public.product_candidate_similarity(text, text) from public, anon, authenticated;
revoke all on function public.is_one_edit_apart(text, text) from public, anon, authenticated;
revoke all on function public.product_typo_equivalent(text, text) from public, anon, authenticated;
grant execute on function public.normalize_product_match_name(text) to authenticated;
grant execute on function public.product_measure_signature(text) to authenticated;
grant execute on function public.product_match_tokens(text) to authenticated;

alter table public.products add column comparison_name text;
update public.products set comparison_name = public.normalize_product_match_name(name) where comparison_name is null;
alter table public.products alter column comparison_name set not null;
alter table public.products add column comparison_key text generated always as ((public.product_match_tokens(comparison_name))[1]) stored;
alter table public.products add column measure_signature text generated always as (public.product_measure_signature(comparison_name)) stored;
create index products_candidate_lookup_idx
  on public.products(store_id, upper(coalesce(unit, '')), comparison_key, measure_signature);

create or replace function public.set_product_comparison_name()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.comparison_name is null or (tg_op = 'UPDATE' and new.name is distinct from old.name) then
    new.comparison_name := public.normalize_product_match_name(new.name);
  end if;
  return new;
end;
$$;
create trigger products_set_comparison_name
  before insert or update of name on public.products
  for each row execute function public.set_product_comparison_name();
revoke all on function public.set_product_comparison_name() from public, anon, authenticated;

alter table public.supplier_products add column association_method text
  check (association_method in ('auto_new', 'auto_existing', 'manual_new', 'manual_existing'));
update public.supplier_products set association_method = 'manual_existing'
  where association_status = 'confirmed' and association_method is null;

create table public.nfe_product_candidates (
  store_id uuid not null references public.stores(id) on delete cascade,
  supplier_product_id uuid not null,
  candidate_product_id uuid not null,
  score numeric(5, 4) not null check (score between 0 and 1),
  match_reason text not null check (match_reason in ('gtin', 'text')),
  created_at timestamptz not null default now(),
  primary key (store_id, supplier_product_id, candidate_product_id),
  foreign key (store_id, supplier_product_id) references public.supplier_products(store_id, id) on delete cascade,
  foreign key (store_id, candidate_product_id) references public.products(store_id, id) on delete cascade
);
create index nfe_product_candidates_source_score_idx
  on public.nfe_product_candidates(store_id, supplier_product_id, score desc);
alter table public.nfe_product_candidates enable row level security;
create policy "members read nfe product candidates" on public.nfe_product_candidates
  for select to authenticated using (public.is_store_member(store_id));
revoke insert, update, delete on public.nfe_product_candidates from authenticated;
grant select on public.nfe_product_candidates to authenticated;

create or replace function public.find_automatic_nfe_product_match(
  p_store_id uuid, p_gtin text, p_description text, p_unit text
) returns uuid language sql stable security definer set search_path = '' as $$
  with matches as (
    select distinct p.id
    from public.products p
    where p.store_id = p_store_id and (
      (p_gtin is not null and exists (
        select 1 from public.supplier_products known
        where known.store_id = p_store_id and known.association_status = 'confirmed'
          and known.gtin = p_gtin and known.product_id = p.id
      ))
      or (
        upper(coalesce(p.unit, '')) = upper(coalesce(p_unit, ''))
        and p.measure_signature = public.product_measure_signature(p_description)
        and (
          p.comparison_name = public.normalize_product_match_name(p_description)
          or public.product_typo_equivalent(p.comparison_name, p_description)
        )
      )
    )
  )
  select case when count(*) = 1 then (array_agg(id))[1] end from matches;
$$;
revoke all on function public.find_automatic_nfe_product_match(uuid, text, text, text) from public, anon, authenticated;

create or replace function public.refresh_nfe_product_candidates(p_store_id uuid, p_source_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  source public.supplier_products%rowtype;
  inserted_count integer;
begin
  select * into strict source from public.supplier_products
    where store_id = p_store_id and id = p_source_id and active and association_status = 'pending';
  delete from public.nfe_product_candidates
    where store_id = p_store_id and supplier_product_id = p_source_id;
  insert into public.nfe_product_candidates(store_id, supplier_product_id, candidate_product_id, score, match_reason)
  select p_store_id, p_source_id, candidate.id, candidate.score, candidate.reason
  from (
    select p.id,
      greatest(
        case when source.gtin is not null and exists (
          select 1 from public.supplier_products known
          where known.store_id = p_store_id and known.association_status = 'confirmed'
            and known.gtin = source.gtin and known.product_id = p.id
        ) then 1 else 0 end,
        case when upper(coalesce(p.unit, '')) = upper(source.reference_unit)
          and (
            p.comparison_key = (public.product_match_tokens(source.description_original))[1]
            or (
              least(length(p.comparison_key), length((public.product_match_tokens(source.description_original))[1])) >= 3
              and (
                p.comparison_key like (public.product_match_tokens(source.description_original))[1] || '%'
                or (public.product_match_tokens(source.description_original))[1] like p.comparison_key || '%'
              )
            )
          )
          and p.measure_signature = public.product_measure_signature(source.description_original)
        then public.product_candidate_similarity(p.comparison_name, source.description_original) else 0 end
      ) score,
      case when source.gtin is not null and exists (
        select 1 from public.supplier_products known
        where known.store_id = p_store_id and known.association_status = 'confirmed'
          and known.gtin = source.gtin and known.product_id = p.id
      ) then 'gtin' else 'text' end reason
    from public.products p
    where p.store_id = p_store_id
  ) candidate
  where candidate.score >= 0.70
    and not exists (
      select 1 from public.product_association_rejections rejection
      where rejection.store_id = p_store_id and rejection.supplier_product_id = p_source_id
        and rejection.candidate_product_id = candidate.id
    )
  order by (candidate.reason = 'gtin') desc, candidate.score desc,
    (select name from public.products where id = candidate.id and store_id = p_store_id), candidate.id
  limit 3;
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
revoke all on function public.refresh_nfe_product_candidates(uuid, uuid) from public, anon, authenticated;

-- A importação serializa a decisão do catálogo por loja e só cria revisão quando há candidato.
create or replace function public.import_nfe_for_current_store(
  p_store_id uuid, p_access_key text, p_supplier_name text, p_supplier_cnpj text, p_invoice_number text,
  p_series text, p_model text, p_issued_on date, p_original_name text, p_items jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_store uuid; v_supplier uuid; v_import uuid; v_item jsonb; v_source uuid; v_product uuid;
  v_gtin text; v_code text; v_number integer := 0; v_import_item uuid; v_fingerprint text;
  v_source_row public.supplier_products%rowtype; v_new_source boolean; v_candidates integer;
begin
  select store_id into strict v_store from public.store_members where user_id = (select auth.uid()) and store_id = p_store_id;
  if (p_access_key is not null and p_access_key !~ '^[0-9]{44}$') or p_supplier_name is null or length(trim(p_supplier_name)) not between 1 and 160
    or p_supplier_cnpj !~ '^[0-9]{14}$' or p_invoice_number !~ '^[0-9]{1,9}$' or p_issued_on is null
    or p_series !~ '^[0-9]{1,3}$' or p_model <> '55' or p_original_name is null
    or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 1000
  then raise exception 'Dados da NF-e inválidos'; end if;
  if p_access_key is null then v_fingerprint := md5(concat_ws('|', p_supplier_cnpj, p_model, p_series, p_invoice_number, p_issued_on::text)); end if;
  perform pg_advisory_xact_lock(hashtextextended(v_store::text || coalesce(p_access_key, v_fingerprint), 0));
  perform pg_advisory_xact_lock(hashtextextended(v_store::text || '|product-catalog', 0));

  select id into v_supplier from public.suppliers where store_id = v_store and document = p_supplier_cnpj limit 1;
  if v_supplier is null then
    insert into public.suppliers(store_id, name, document) values (v_store, trim(p_supplier_name), p_supplier_cnpj)
      on conflict (store_id, name) do update set document = coalesce(public.suppliers.document, excluded.document)
      where public.suppliers.document is null or public.suppliers.document = excluded.document returning id into v_supplier;
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
    v_number := (v_item->>'item_number')::integer; v_code := nullif(left(v_item->>'supplier_code', 100), '');
    v_gtin := nullif(v_item->>'gtin', '');
    if v_gtin is not null and not public.is_valid_gtin(v_gtin) then raise exception 'GTIN inválido'; end if;
    v_product := null; v_source := null; v_source_row := null; v_new_source := false;

    if v_code is not null then select * into v_source_row from public.supplier_products
      where store_id = v_store and supplier_id = v_supplier and supplier_code = v_code and active for update; end if;
    if v_source_row.id is null and v_gtin is not null
      and (select count(*) from public.supplier_products where store_id = v_store and supplier_id = v_supplier and gtin = v_gtin and active) = 1
    then select * into v_source_row from public.supplier_products
      where store_id = v_store and supplier_id = v_supplier and gtin = v_gtin and active for update; end if;
    v_source := v_source_row.id; v_product := v_source_row.product_id;
    if v_source is not null and (
      upper(trim(v_source_row.reference_unit)) <> upper(trim(v_item->>'unit'))
      or (v_source_row.gtin is not null and v_gtin is not null and v_source_row.gtin <> v_gtin)
      or public.product_measure_signature(v_source_row.description_original) <> public.product_measure_signature(v_item->>'name')
      or public.product_token_similarity(v_source_row.description_original, v_item->>'name') < 0.35
    ) then
      update public.supplier_products set active = false where id = v_source;
      v_source := null; v_product := null; v_source_row := null;
    end if;
    if v_source is null then
      insert into public.supplier_products(store_id, supplier_id, supplier_code, description_original,
        description_normalized, gtin, ncm, reference_unit)
      values (v_store, v_supplier, v_code, left(v_item->>'name', 200), left(coalesce(v_item->>'normalized_name', v_item->>'name'), 240),
        v_gtin, nullif(left(v_item->>'ncm', 8), ''), left(v_item->>'unit', 80)) returning id into v_source;
      v_new_source := true;
    elsif v_source_row.gtin is null and v_gtin is not null then update public.supplier_products set gtin = v_gtin where id = v_source; end if;

    if v_new_source then
      v_product := public.find_automatic_nfe_product_match(v_store, v_gtin, v_item->>'name', v_item->>'unit');
      if v_product is not null then
        update public.supplier_products set product_id = v_product, association_status = 'confirmed',
          association_method = 'auto_existing', confirmed_at = now() where id = v_source;
      else
        v_candidates := public.refresh_nfe_product_candidates(v_store, v_source);
        if v_candidates = 0 then
          insert into public.products(store_id, name, unit, comparison_name)
            values (v_store, left(v_item->>'name', 200), left(v_item->>'unit', 80), public.normalize_product_match_name(v_item->>'name')) returning id into v_product;
          update public.supplier_products set product_id = v_product, created_product_id = v_product,
            association_status = 'confirmed', association_method = 'auto_new', confirmed_at = now() where id = v_source;
        end if;
      end if;
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

-- Marque o método e mantenha somente decisões manuais na lista de vínculos revisáveis.
create or replace function public.confirm_nfe_product_association(p_store_id uuid, p_source_id uuid, p_product_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_store uuid; v_source public.supplier_products%rowtype;
begin
  select store_id into strict v_store from public.store_members where user_id = (select auth.uid()) and store_id = p_store_id;
  perform pg_advisory_xact_lock(hashtextextended(v_store::text || '|product-catalog', 0));
  select * into strict v_source from public.supplier_products where id = p_source_id and store_id = v_store and active for update;
  if not exists (select 1 from public.products where id = p_product_id and store_id = v_store) then raise exception 'Produto não pertence à loja atual'; end if;
  if v_source.association_status = 'confirmed' then
    if v_source.product_id = p_product_id then return; end if;
    raise exception 'Esta origem já está associada; desfaça o vínculo antes de alterá-lo';
  end if;
  if v_source.gtin is not null then perform pg_advisory_xact_lock(hashtextextended(v_store::text || '|gtin|' || v_source.gtin, 0)); end if;
  if v_source.gtin is not null and exists (select 1 from public.supplier_products
    where store_id = v_store and association_status = 'confirmed' and id <> p_source_id
      and gtin = v_source.gtin and product_id <> p_product_id) then raise exception 'Este GTIN já está confirmado para outro produto'; end if;
  update public.supplier_products set product_id = p_product_id, association_status = 'confirmed',
    association_method = 'manual_existing', confirmed_at = now() where id = p_source_id;
  delete from public.product_association_rejections where store_id = v_store and supplier_product_id = p_source_id and candidate_product_id = p_product_id;
  delete from public.nfe_product_candidates where store_id = v_store and supplier_product_id = p_source_id;
  update public.nfe_import_items set product_id = p_product_id where store_id = v_store and supplier_product_id = p_source_id;
  insert into public.price_entries(store_id, product_id, supplier_id, unit, unit_price, recorded_on, nfe_import_item_id)
    select v_store, p_product_id, i.supplier_id, item.unit, item.unit_price, coalesce(i.issued_on, item.created_at::date), item.id
    from public.nfe_import_items item join public.nfe_imports i on i.id = item.nfe_import_id and i.store_id = item.store_id
    where item.store_id = v_store and item.supplier_product_id = p_source_id on conflict do nothing;
end;
$$;
revoke all on function public.confirm_nfe_product_association(uuid, uuid, uuid) from public, anon;
grant execute on function public.confirm_nfe_product_association(uuid, uuid, uuid) to authenticated;

create or replace function public.create_product_from_nfe_source(p_store_id uuid, p_source_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_store uuid; v_source public.supplier_products%rowtype; v_product uuid;
begin
  select store_id into strict v_store from public.store_members where user_id = (select auth.uid()) and store_id = p_store_id;
  perform pg_advisory_xact_lock(hashtextextended(v_store::text || '|product-catalog', 0));
  select * into strict v_source from public.supplier_products where id = p_source_id and store_id = v_store and active for update;
  if v_source.association_status <> 'pending' then raise exception 'Origem não está pendente'; end if;
  insert into public.products(store_id, name, unit, comparison_name)
    values (v_store, v_source.description_original, v_source.reference_unit, public.normalize_product_match_name(v_source.description_original)) returning id into v_product;
  perform public.confirm_nfe_product_association(v_store, p_source_id, v_product);
  update public.supplier_products set created_product_id = v_product, association_method = 'manual_new' where id = p_source_id and store_id = v_store;
  return v_product;
end;
$$;
revoke all on function public.create_product_from_nfe_source(uuid, uuid) from public, anon;
grant execute on function public.create_product_from_nfe_source(uuid, uuid) to authenticated;

create or replace function public.reject_nfe_product_association(p_store_id uuid, p_source_id uuid, p_product_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_store uuid; v_remaining integer; v_gtin text;
begin
  select store_id into strict v_store from public.store_members where user_id = (select auth.uid()) and store_id = p_store_id;
  perform pg_advisory_xact_lock(hashtextextended(v_store::text || '|product-catalog', 0));
  if exists (select 1 from public.product_association_rejections where store_id = v_store
    and supplier_product_id = p_source_id and candidate_product_id = p_product_id) then return; end if;
  if not exists (select 1 from public.nfe_product_candidates where store_id = v_store
    and supplier_product_id = p_source_id and candidate_product_id = p_product_id) then raise exception 'Sugestão pendente não encontrada'; end if;
  select gtin into v_gtin from public.supplier_products
    where store_id = v_store and id = p_source_id and active and association_status = 'pending' for update;
  insert into public.product_association_rejections(store_id, supplier_product_id, candidate_product_id)
    values (v_store, p_source_id, p_product_id) on conflict do nothing;
  delete from public.nfe_product_candidates where store_id = v_store
    and supplier_product_id = p_source_id and candidate_product_id = p_product_id;
  select count(*) into v_remaining from public.nfe_product_candidates where store_id = v_store and supplier_product_id = p_source_id;
  if v_remaining = 0 then
    if v_gtin is not null and exists (select 1 from public.supplier_products
      where store_id = v_store and association_status = 'confirmed' and gtin = v_gtin and product_id is not null)
    then raise exception 'O mesmo GTIN já identifica um produto do catálogo'; end if;
    perform public.create_product_from_nfe_source(v_store, p_source_id);
  end if;
end;
$$;
revoke all on function public.reject_nfe_product_association(uuid, uuid, uuid) from public, anon;
grant execute on function public.reject_nfe_product_association(uuid, uuid, uuid) to authenticated;

-- Ao desfazer uma decisão manual, recalcule somente as sugestões próximas.
-- O produto criado anteriormente é preservado para não apagar histórico compartilhado.
create or replace function public.reset_nfe_product_association(p_store_id uuid, p_source_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_store uuid;
  v_source public.supplier_products%rowtype;
begin
  select store_id into strict v_store from public.store_members
    where user_id = (select auth.uid()) and store_id = p_store_id;
  perform pg_advisory_xact_lock(hashtextextended(v_store::text || '|product-catalog', 0));
  select * into strict v_source from public.supplier_products
    where id = p_source_id and store_id = v_store and active for update;
  if v_source.association_status <> 'confirmed' then
    raise exception 'Origem não possui vínculo confirmado';
  end if;
  delete from public.price_entries
    where store_id = v_store and nfe_import_item_id in (
      select id from public.nfe_import_items
      where store_id = v_store and supplier_product_id = p_source_id
    );
  update public.nfe_import_items set product_id = null
    where store_id = v_store and supplier_product_id = p_source_id;
  delete from public.nfe_product_candidates
    where store_id = v_store and supplier_product_id = p_source_id;
  update public.supplier_products set product_id = null, created_product_id = null,
    association_status = 'pending', association_method = null, confirmed_at = null
    where id = p_source_id and store_id = v_store;
  perform public.refresh_nfe_product_candidates(v_store, p_source_id);
end;
$$;
revoke all on function public.reset_nfe_product_association(uuid, uuid) from public, anon;
grant execute on function public.reset_nfe_product_association(uuid, uuid) to authenticated;

-- Itens da primeira nota de uma loja sem catálogo são a base inicial e não exigem revisão.
do $$
declare source record; new_product uuid;
begin
  for source in
    with empty_stores as materialized (
      select distinct sp.store_id from public.supplier_products sp
      where sp.active and sp.association_status = 'pending'
        and not exists (select 1 from public.products p where p.store_id = sp.store_id)
    ), first_imports as materialized (
      select distinct on (imported.store_id) imported.store_id, imported.id
      from public.nfe_imports imported
      join empty_stores using (store_id)
      join public.nfe_import_items pending_item
        on pending_item.store_id = imported.store_id and pending_item.nfe_import_id = imported.id
      join public.supplier_products pending_source
        on pending_source.store_id = pending_item.store_id and pending_source.id = pending_item.supplier_product_id
      where pending_source.active and pending_source.association_status = 'pending'
      order by imported.store_id, imported.created_at, imported.id
    )
    select distinct sp.* from public.supplier_products sp
    join empty_stores using (store_id)
    join public.nfe_import_items item on item.store_id = sp.store_id and item.supplier_product_id = sp.id
    join first_imports on first_imports.store_id = item.store_id and first_imports.id = item.nfe_import_id
    where sp.active and sp.association_status = 'pending'
    order by sp.store_id, sp.created_at, sp.id
  loop
    perform pg_advisory_xact_lock(hashtextextended(source.store_id::text || '|product-catalog', 0));
    insert into public.products(store_id, name, unit, comparison_name)
      values (source.store_id, source.description_original, source.reference_unit,
        public.normalize_product_match_name(source.description_original)) returning id into new_product;
    update public.supplier_products set product_id = new_product, created_product_id = new_product,
      association_status = 'confirmed', association_method = 'auto_new', confirmed_at = now() where id = source.id;
    update public.nfe_import_items set product_id = new_product where store_id = source.store_id and supplier_product_id = source.id;
    insert into public.price_entries(store_id, product_id, supplier_id, unit, unit_price, recorded_on, nfe_import_item_id)
      select source.store_id, new_product, imported.supplier_id, item.unit, item.unit_price,
        coalesce(imported.issued_on, item.created_at::date), item.id
      from public.nfe_import_items item join public.nfe_imports imported
        on imported.id = item.nfe_import_id and imported.store_id = item.store_id
      where item.store_id = source.store_id and item.supplier_product_id = source.id on conflict do nothing;
  end loop;
end;
$$;

-- Pendências posteriores passam pela mesma decisão: reaproveitar, perguntar ou cadastrar.
do $$
declare source record; matched_product uuid; new_product uuid; candidate_count integer;
begin
  for source in
    select sp.* from public.supplier_products sp
    where sp.active and sp.association_status = 'pending'
    order by sp.store_id, sp.created_at, sp.id
  loop
    perform pg_advisory_xact_lock(hashtextextended(source.store_id::text || '|product-catalog', 0));
    matched_product := null;
    new_product := null;
    matched_product := public.find_automatic_nfe_product_match(
      source.store_id, source.gtin, source.description_original, source.reference_unit);
    if matched_product is not null then
      update public.supplier_products set product_id = matched_product,
        association_status = 'confirmed', association_method = 'auto_existing', confirmed_at = now()
        where id = source.id and store_id = source.store_id;
    else
      candidate_count := public.refresh_nfe_product_candidates(source.store_id, source.id);
      if candidate_count = 0 then
        insert into public.products(store_id, name, unit, comparison_name)
          values (source.store_id, source.description_original, source.reference_unit,
            public.normalize_product_match_name(source.description_original)) returning id into new_product;
        matched_product := new_product;
        update public.supplier_products set product_id = new_product, created_product_id = new_product,
          association_status = 'confirmed', association_method = 'auto_new', confirmed_at = now()
          where id = source.id and store_id = source.store_id;
      end if;
    end if;
    if matched_product is not null then
      update public.nfe_import_items set product_id = matched_product
        where store_id = source.store_id and supplier_product_id = source.id;
      insert into public.price_entries(store_id, product_id, supplier_id, unit, unit_price, recorded_on, nfe_import_item_id)
        select source.store_id, matched_product, imported.supplier_id, item.unit, item.unit_price,
          coalesce(imported.issued_on, item.created_at::date), item.id
        from public.nfe_import_items item join public.nfe_imports imported
          on imported.id = item.nfe_import_id and imported.store_id = item.store_id
        where item.store_id = source.store_id and item.supplier_product_id = source.id
        on conflict do nothing;
    end if;
  end loop;
end;
$$;
