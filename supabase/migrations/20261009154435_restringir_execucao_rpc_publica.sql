revoke all on function public.is_store_member(uuid) from public, anon;
grant execute on function public.is_store_member(uuid) to authenticated;
revoke all on function public.create_store_for_current_user(text) from public, anon;
grant execute on function public.create_store_for_current_user(text) to authenticated;
