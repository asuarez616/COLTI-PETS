-- Payloads are invalidation hints only. RLS still restricts order rows to owner.
do $$
declare table_name text;
begin
 if not exists(select 1 from pg_publication where pubname='supabase_realtime') then
  create publication supabase_realtime;
 end if;
 foreach table_name in array array['orders','order_items','designs','design_compatibility','catalog_availability','hero_configuration'] loop
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name) then
   execute format('alter publication supabase_realtime add table public.%I',table_name);
  end if;
 end loop;
end;$$;
