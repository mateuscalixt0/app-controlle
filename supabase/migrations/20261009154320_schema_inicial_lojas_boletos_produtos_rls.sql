-- Schema inicial do App Controle. Executar com Supabase CLI em um projeto de desenvolvimento.
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'member');
create type public.bill_status as enum ('pending', 'paid', 'cancelled');
create type public.missing_priority as enum ('normal', 'media', 'urgente');

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  created_at timestamptz not null default now()
);

create table public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  created_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, name)
);

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  supplier_id uuid,
  description text not null check (length(trim(description)) between 1 and 240),
  amount_cents bigint not null check (amount_cents >= 0),
  due_date date not null,
  status public.bill_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, supplier_id) references public.suppliers(store_id, id),
  check ((status = 'paid') = (paid_at is not null))
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 200),
  unit text,
  created_at timestamptz not null default now(),
  unique (store_id, id)
);

create table public.missing_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid,
  product_name text not null check (length(trim(product_name)) between 1 and 200),
  quantity numeric(14,3) not null check (quantity > 0),
  unit text,
  category text,
  reference_company text,
  priority public.missing_priority not null default 'normal',
  created_at timestamptz not null default now(),
  foreign key (store_id, product_id) references public.products(store_id, id)
);

create table public.price_entries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null,
  supplier_id uuid not null,
  unit text not null check (length(trim(unit)) between 1 and 80),
  unit_price numeric(14,4) not null check (unit_price >= 0),
  recorded_on date not null default current_date,
  created_at timestamptz not null default now(),
  foreign key (store_id, product_id) references public.products(store_id, id),
  foreign key (store_id, supplier_id) references public.suppliers(store_id, id)
);

create index bills_store_due_date_idx on public.bills(store_id, due_date);
create index missing_items_store_created_idx on public.missing_items(store_id, created_at desc, id);
create index price_entries_store_product_date_idx on public.price_entries(store_id, product_id, recorded_on desc);

create function public.is_store_member(target_store uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.store_members m
    where m.store_id = target_store and m.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_store_member(uuid) from public;
grant execute on function public.is_store_member(uuid) to authenticated;

alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.suppliers enable row level security;
alter table public.bills enable row level security;
alter table public.products enable row level security;
alter table public.missing_items enable row level security;
alter table public.price_entries enable row level security;

create policy "members can read stores" on public.stores for select to authenticated using (public.is_store_member(id));
create policy "members can read store membership" on public.store_members for select to authenticated using (public.is_store_member(store_id));
create policy "members manage suppliers" on public.suppliers for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "members manage bills" on public.bills for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "members manage products" on public.products for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "members manage missing items" on public.missing_items for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "members manage price entries" on public.price_entries for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

grant select on public.stores, public.store_members to authenticated;
grant select, insert, update, delete on public.suppliers, public.bills, public.products, public.missing_items, public.price_entries to authenticated;

-- A criação segura do owner é feita por create_store_for_current_user na migração seguinte.
