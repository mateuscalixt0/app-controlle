-- Smoke test transacional: usuários/lojas sintéticos são sempre revertidos.
-- Executar como administrador em desenvolvimento. Não testa objetos binários do Storage.
begin;
do $$
declare
  user_a uuid := gen_random_uuid(); user_b uuid := gen_random_uuid();
  store_a uuid := gen_random_uuid(); store_b uuid := gen_random_uuid();
  bill_a uuid := gen_random_uuid(); bill_b uuid := gen_random_uuid();
  denied boolean;
begin
  insert into auth.users(id) values (user_a), (user_b);
  insert into public.stores(id,name) values (store_a,'TESTE TRANSITORIO A'),(store_b,'TESTE TRANSITORIO B');
  insert into public.store_members(store_id,user_id,role) values (store_a,user_a,'owner'),(store_b,user_b,'member');
  insert into public.bills(id,store_id,description,amount_cents,due_date,digitable_line)
    values (bill_a,store_a,'BOLETO SINTETICO A',100,'2026-10-11',null),(bill_b,store_b,'BOLETO SINTETICO B',200,'2026-10-12',null);
  insert into public.bill_documents(store_id,bill_id,storage_path,original_name,content_type,size_bytes,created_by,extraction_status)
    values (store_a,bill_a,store_a||'/'||bill_a||'/teste.pdf','teste.pdf','application/pdf',10,user_a,'confirmed'),
           (store_b,bill_b,store_b||'/'||bill_b||'/teste.pdf','teste.pdf','application/pdf',10,user_b,'confirmed');
  perform set_config('request.jwt.claims',json_build_object('sub',user_a,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  if (select count(*) from public.bills where id in (bill_a,bill_b)) <> 1 then raise exception 'Isolamento de boletos falhou'; end if;
  if (select count(*) from public.bill_documents where bill_id in (bill_a,bill_b)) <> 1 then raise exception 'Isolamento de anexos falhou'; end if;
  denied := false;
  begin
    insert into public.bill_documents(store_id,bill_id,storage_path,original_name,content_type,size_bytes,created_by)
      values (store_b,bill_b,store_b||'/'||bill_b||'/intruso.pdf','intruso.pdf','application/pdf',10,user_a);
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Inserção em outra loja não foi bloqueada'; end if;
  denied := false;
  begin
    insert into public.bill_documents(store_id,bill_id,storage_path,original_name,content_type,size_bytes,created_by)
      values (store_a,bill_b,store_a||'/'||bill_b||'/vinculo.pdf','vinculo.pdf','application/pdf',10,user_a);
  exception when foreign_key_violation or insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Vínculo cruzado não foi bloqueado'; end if;
  perform set_config('request.jwt.claims',json_build_object('sub',user_b,'role','authenticated')::text,true);
  if (select count(*) from public.bills where id in (bill_a,bill_b)) <> 1 then raise exception 'Isolamento member falhou'; end if;
  update public.bills set description='MEMBER CONFIRMADO' where id=bill_b;
  if not found then raise exception 'Member não conseguiu atualizar seu boleto'; end if;
  execute 'set local role anon';
  perform set_config('request.jwt.claims','{}',true);
  denied := false;
  begin
    if (select count(*) from public.bill_documents where bill_id in (bill_a,bill_b)) = 0 then denied := true; end if;
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Anônimo acessou documentos'; end if;
  execute 'reset role';
end $$;
rollback;
select 'PASS: owner/member, duas lojas, anônimo, troca de IDs e vínculo cruzado; fixtures revertidas' as resultado;
