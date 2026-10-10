-- Índices que cobrem as chaves estrangeiras criadas para anexos e importações.

create index if not exists bill_documents_store_bill_idx on public.bill_documents(store_id, bill_id);
create index if not exists bill_documents_created_by_idx on public.bill_documents(created_by);
create index if not exists nfe_imports_store_supplier_idx on public.nfe_imports(store_id, supplier_id);
