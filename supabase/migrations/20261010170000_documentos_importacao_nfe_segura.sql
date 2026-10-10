-- Importação reproduzível de NF-e e documentos privados por loja.
create table if not exists public.nfe_imports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  access_key text not null check (access_key ~ '^[0-9]{44}$'),
  supplier_id uuid not null,
  issued_on date,
  original_name text not null check (length(trim(original_name)) between 1 and 255),
  created_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, access_key),
  foreign key (store_id, supplier_id) references public.suppliers(store_id, id)
);

create table if not exists public.bill_documents (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  bill_id uuid not null,
  storage_path text not null unique check (length(storage_path) between 1 and 500),
  original_name text not null check (length(trim(original_name)) between 1 and 255),
  content_type text not null check (content_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (store_id, bill_id) references public.bills(store_id, id)
);

alter table public.nfe_imports enable row level security;
alter table public.bill_documents enable row level security;

drop policy if exists "members manage nfe imports" on public.nfe_imports;
create policy "members manage nfe imports" on public.nfe_imports
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

drop policy if exists "members manage bill documents" on public.bill_documents;
create policy "members manage bill documents" on public.bill_documents
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

grant select, insert, update, delete on public.nfe_imports, public.bill_documents to authenticated;

alter table public.suppliers add column if not exists document text
  check (document is null or document ~ '^[0-9]{14}$');
alter table public.nfe_imports add column if not exists invoice_number text;
alter table public.bills add column if not exists beneficiary_document text;
alter table public.bills add column if not exists digitable_line text;
alter table public.bill_documents add column if not exists extraction_status text not null default 'not_processed'
  check (extraction_status in ('not_processed', 'needs_manual_review', 'confirmed', 'unsupported', 'failed'));

create table if not exists public.nfe_import_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  nfe_import_id uuid not null,
  product_id uuid not null,
  product_name text not null check (length(trim(product_name)) between 1 and 200),
  quantity numeric(14, 4) not null check (quantity > 0),
  unit text not null check (length(trim(unit)) between 1 and 80),
  unit_price numeric(14, 4) not null check (unit_price >= 0),
  total numeric(14, 2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  foreign key (store_id, nfe_import_id) references public.nfe_imports(store_id, id) on delete cascade,
  foreign key (store_id, product_id) references public.products(store_id, id)
);

alter table public.nfe_import_items enable row level security;
drop policy if exists "members manage nfe import items" on public.nfe_import_items;
create policy "members manage nfe import items" on public.nfe_import_items
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));
grant select, insert, update, delete on public.nfe_import_items to authenticated;

create index if not exists nfe_import_items_store_import_idx on public.nfe_import_items(store_id, nfe_import_id);
create index if not exists products_store_name_unit_idx on public.products(store_id, lower(name), coalesce(unit, ''));

-- Retorna NULL antes de converter: objetos com caminho malformado nunca causam cast de UUID.
create or replace function public.storage_store_id(object_name text)
returns uuid
language sql immutable security invoker set search_path = ''
as $$
  select case
    when object_name ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F-]{27}/[^/]+/.+$'
      then split_part(object_name, '/', 1)::uuid
    else null
  end;
$$;
revoke all on function public.storage_store_id(text) from public, anon;
grant execute on function public.storage_store_id(text) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('bill-documents', 'bill-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'];

drop policy if exists "members upload bill documents" on storage.objects;
create policy "members upload bill documents" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bill-documents'
    and public.is_store_member(public.storage_store_id(name))
  );

drop policy if exists "members read bill documents" on storage.objects;
create policy "members read bill documents" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bill-documents'
    and public.is_store_member(public.storage_store_id(name))
  );

drop policy if exists "members delete bill documents" on storage.objects;
create policy "members delete bill documents" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bill-documents'
    and public.is_store_member(public.storage_store_id(name))
  );

create or replace function public.import_nfe_for_current_store(
  p_access_key text,
  p_supplier_name text,
  p_supplier_cnpj text,
  p_invoice_number text,
  p_issued_on date,
  p_original_name text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store uuid;
  v_supplier uuid;
  v_import uuid;
  v_item jsonb;
  v_product uuid;
begin
  select store_id into v_store
  from public.store_members
  where user_id = (select auth.uid())
  limit 1;

  if v_store is null then raise exception 'Loja não encontrada'; end if;
  if p_access_key !~ '^[0-9]{44}$'
    or p_supplier_name is null
    or length(trim(p_supplier_name)) not between 1 and 160
    or p_supplier_cnpj !~ '^[0-9]{14}$'
    or p_invoice_number !~ '^[0-9]{1,9}$'
    or p_issued_on is null
    or p_original_name is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) not between 1 and 1000
  then raise exception 'Dados da NF-e inválidos'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_store::text || p_access_key, 0));

  select id into v_supplier from public.suppliers
  where store_id = v_store and name = p_supplier_name limit 1;

  if v_supplier is null then
    insert into public.suppliers(store_id, name, document)
    values (v_store, trim(p_supplier_name), p_supplier_cnpj)
    returning id into v_supplier;
  else
    update public.suppliers set document = coalesce(document, p_supplier_cnpj)
    where id = v_supplier;
  end if;

  insert into public.nfe_imports(store_id, access_key, supplier_id, issued_on, original_name, invoice_number)
  values (v_store, p_access_key, v_supplier, p_issued_on, p_original_name, p_invoice_number)
  returning id into v_import;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if coalesce(v_item->>'name', '') = ''
      or coalesce(v_item->>'unit', '') = ''
      or coalesce(v_item->>'quantity', '') !~ '^\d+(\.\d{1,4})?$'
      or coalesce(v_item->>'unit_price', '') !~ '^\d+(\.\d{1,4})?$'
      or coalesce(v_item->>'total', '') !~ '^\d+(\.\d{1,2})?$'
    then raise exception 'Item inválido'; end if;

    select id into v_product from public.products
    where store_id = v_store
      and lower(name) = lower(left(v_item->>'name', 200))
      and unit is not distinct from left(v_item->>'unit', 80)
    limit 1;

    if v_product is null then
      insert into public.products(store_id, name, unit)
      values (v_store, left(v_item->>'name', 200), left(v_item->>'unit', 80))
      returning id into v_product;
    end if;

    insert into public.price_entries(store_id, product_id, supplier_id, unit, unit_price, recorded_on)
    values (v_store, v_product, v_supplier, left(v_item->>'unit', 80), (v_item->>'unit_price')::numeric, p_issued_on);

    insert into public.nfe_import_items(store_id, nfe_import_id, product_id, product_name, quantity, unit, unit_price, total)
    values (v_store, v_import, v_product, left(v_item->>'name', 200), (v_item->>'quantity')::numeric,
      left(v_item->>'unit', 80), (v_item->>'unit_price')::numeric, (v_item->>'total')::numeric);
  end loop;

  return v_import;
end;
$$;

revoke all on function public.import_nfe_for_current_store(text, text, text, text, date, text, jsonb) from public, anon;
grant execute on function public.import_nfe_for_current_store(text, text, text, text, date, text, jsonb) to authenticated;