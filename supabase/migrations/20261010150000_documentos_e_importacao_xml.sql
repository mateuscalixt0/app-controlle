-- Documentos privados de boletos, importações de XML e índices para consultas frequentes.

do $$
begin
  alter table public.bills add constraint bills_store_id_id_key unique (store_id, id);
exception when duplicate_object then null;
end $$;

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
  constraint bill_documents_store_bill_fkey
    foreign key (store_id, bill_id) references public.bills(store_id, id) on delete cascade
);

alter table public.bill_documents enable row level security;

drop policy if exists "members manage bill documents" on public.bill_documents;
create policy "members manage bill documents" on public.bill_documents
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create table if not exists public.nfe_imports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  access_key text not null check (access_key ~ '^[0-9]{44}$'),
  supplier_id uuid not null,
  issued_on date,
  original_name text not null check (length(trim(original_name)) between 1 and 255),
  created_at timestamptz not null default now(),
  constraint nfe_imports_store_access_key_key unique (store_id, access_key),
  constraint nfe_imports_store_supplier_fkey
    foreign key (store_id, supplier_id) references public.suppliers(store_id, id)
);

alter table public.nfe_imports enable row level security;

drop policy if exists "members manage nfe imports" on public.nfe_imports;
create policy "members manage nfe imports" on public.nfe_imports
  for all to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bill-documents',
  'bill-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "store members upload bill documents" on storage.objects;
create policy "store members upload bill documents" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bill-documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "store members read bill documents" on storage.objects;
create policy "store members read bill documents" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bill-documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "store members remove bill documents" on storage.objects;
create policy "store members remove bill documents" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bill-documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create index if not exists bills_store_status_due_idx on public.bills(store_id, status, due_date);
create index if not exists bills_store_supplier_idx on public.bills(store_id, supplier_id);
create index if not exists missing_items_store_product_idx on public.missing_items(store_id, product_id);
create index if not exists price_entries_store_supplier_idx on public.price_entries(store_id, supplier_id);
create index if not exists store_members_user_idx on public.store_members(user_id);

create or replace function public.import_nfe_for_current_store(
  p_access_key text,
  p_supplier_name text,
  p_issued_on date,
  p_original_name text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_store_id uuid;
  v_supplier_id uuid;
  v_product_id uuid;
  v_import_id uuid;
  v_item jsonb;
  v_product_name text;
  v_unit text;
  v_quantity numeric;
  v_unit_price numeric;
begin
  select store_id into v_store_id
  from public.store_members
  where user_id = (select auth.uid())
  order by created_at
  limit 1;

  if v_store_id is null then
    raise exception 'Loja não encontrada para a conta atual';
  end if;

  if p_access_key !~ '^[0-9]{44}$' then
    raise exception 'Chave de acesso inválida';
  end if;

  if length(trim(coalesce(p_supplier_name, ''))) not between 1 and 160 then
    raise exception 'Fornecedor inválido';
  end if;

  if length(trim(coalesce(p_original_name, ''))) not between 1 and 255 then
    raise exception 'Nome de arquivo inválido';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 100 then
    raise exception 'Itens da nota inválidos';
  end if;

  select id into v_supplier_id
  from public.suppliers
  where store_id = v_store_id and name = trim(p_supplier_name)
  limit 1;

  if v_supplier_id is null then
    insert into public.suppliers (store_id, name)
    values (v_store_id, trim(p_supplier_name))
    returning id into v_supplier_id;
  end if;

  insert into public.nfe_imports (store_id, access_key, supplier_id, issued_on, original_name)
  values (v_store_id, p_access_key, v_supplier_id, p_issued_on, trim(p_original_name))
  returning id into v_import_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_name := trim(v_item ->> 'name');
    v_unit := nullif(trim(v_item ->> 'unit'), '');
    v_quantity := nullif(v_item ->> 'quantity', '')::numeric;
    v_unit_price := nullif(v_item ->> 'unit_price', '')::numeric;

    if length(coalesce(v_product_name, '')) not between 1 and 200
       or length(coalesce(v_unit, '')) not between 1 and 80
       or v_quantity is null or v_quantity <= 0
       or v_unit_price is null or v_unit_price < 0 then
      raise exception 'Item da nota inválido';
    end if;

    select id into v_product_id
    from public.products
    where store_id = v_store_id and name = v_product_name
    order by created_at
    limit 1;

    if v_product_id is null then
      insert into public.products (store_id, name, unit)
      values (v_store_id, v_product_name, v_unit)
      returning id into v_product_id;
    end if;

    insert into public.price_entries (store_id, product_id, supplier_id, unit, unit_price, recorded_on)
    values (v_store_id, v_product_id, v_supplier_id, v_unit, v_unit_price, coalesce(p_issued_on, current_date));
  end loop;

  return v_import_id;
end;
$$;

revoke all on function public.import_nfe_for_current_store(text, text, date, text, jsonb) from public;
grant execute on function public.import_nfe_for_current_store(text, text, date, text, jsonb) to authenticated;
