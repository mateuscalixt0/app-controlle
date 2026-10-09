-- Dados exclusivamente fictícios. Requer supabase db reset; não usar em produção.
-- Não cria usuário de autenticação: contas devem ser criadas pelo Supabase Auth.
insert into public.stores (id, name) values ('10000000-0000-4000-8000-000000000001', 'Loja Demonstração (fictícia)') on conflict (id) do nothing;
insert into public.suppliers (id, store_id, name) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Depósito Exemplo'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Casa Hidráulica Fictícia')
on conflict (id) do nothing;
insert into public.products (id, store_id, name, unit) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Cimento CP II 50 kg (exemplo)', 'saco 50 kg'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Tubo PVC 100 mm (exemplo)', 'barra 6 m')
on conflict (id) do nothing;
insert into public.bills (id, store_id, supplier_id, description, amount_cents, due_date) values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Compra de materiais (fictícia)', 234000, '2026-10-14'),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Serviço mensal (fictício)', 12990, '2026-10-20')
on conflict (id) do nothing;
insert into public.missing_items (id, store_id, product_id, product_name, quantity, unit, category, priority) values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Cimento CP II 50 kg (exemplo)', 20, 'sacos', 'Cimentos', 'urgente'),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 'Tubo PVC 100 mm (exemplo)', 12, 'barras', 'Hidráulica', 'media')
on conflict (id) do nothing;
insert into public.price_entries (id, store_id, product_id, supplier_id, unit, unit_price, recorded_on) values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'saco 50 kg', 31.9000, '2026-10-02'),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'barra 6 m', 68.4000, '2026-10-01')
on conflict (id) do nothing;
