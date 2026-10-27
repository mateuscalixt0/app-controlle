-- Mantém a versão publicada funcional enquanto clientes antigos ainda usam a assinatura sem loja/série/modelo.
create or replace function public.import_nfe_for_current_store(
  p_access_key text,
  p_supplier_name text,
  p_supplier_cnpj text,
  p_invoice_number text,
  p_issued_on date,
  p_original_name text,
  p_items jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_store uuid;
  v_items jsonb;
begin
  select store_id into strict v_store
  from public.store_members
  where user_id = (select auth.uid())
  order by created_at
  limit 1;

  select jsonb_agg(
    item || jsonb_build_object(
      'item_number', item_number,
      'supplier_code', '',
      'normalized_name', item->>'name',
      'gtin', null,
      'ncm', ''
    ) order by item_number
  ) into v_items
  from jsonb_array_elements(p_items) with ordinality as source(item, item_number);

  return public.import_nfe_for_current_store(
    v_store,
    p_access_key,
    p_supplier_name,
    p_supplier_cnpj,
    p_invoice_number,
    substring(p_access_key from 23 for 3),
    substring(p_access_key from 21 for 2),
    p_issued_on,
    p_original_name,
    v_items
  );
end;
$$;

revoke all on function public.import_nfe_for_current_store(text, text, text, text, date, text, jsonb) from public, anon;
grant execute on function public.import_nfe_for_current_store(text, text, text, text, date, text, jsonb) to authenticated;
