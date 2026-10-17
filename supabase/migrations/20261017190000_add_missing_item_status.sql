alter table public.missing_items
  add column if not exists is_missing boolean not null default true;

create index if not exists missing_items_store_status_idx
  on public.missing_items(store_id, is_missing, created_at desc);
