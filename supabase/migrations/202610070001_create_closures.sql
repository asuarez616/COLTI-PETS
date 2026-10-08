-- Extend closure inventory without changing existing keys or order snapshots.
alter table public.closures drop constraint closures_key_check;
alter table public.closures add constraint closures_key_check check(key ~ '^(plastic_buckle|metal_buckle|martingale|custom_[a-f0-9]{20})$');
alter table public.order_items drop constraint order_items_collar_type_check;
alter table public.order_items add constraint order_items_collar_type_check check(collar_type ~ '^(plastic_buckle|metal_buckle|martingale|custom_[a-f0-9]{20})$');

create function public.admin_create_closure(p_value jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if coalesce(p_value->>'key','') !~ '^custom_[a-f0-9]{20}$' or (p_value->>'revision')::integer is distinct from 0 then raise exception 'INVALID_CLOSURE'; end if;
 -- Reuse the existing owner validator and preference transaction. Any failure
 -- rolls back the placeholder insert; existing records cannot be overwritten.
 insert into public.closures(key,name_en,name_es,icon,active,display_order,revision)
 values(p_value->>'key',p_value->>'name_en',p_value->>'name_es',p_value->>'icon',false,(p_value->>'display_order')::integer,0);
 return public.admin_closure(p_value,0);
end;$$;
revoke all on function public.admin_create_closure(jsonb) from public,anon;
grant execute on function public.admin_create_closure(jsonb) to authenticated;

-- Keep the existing hardened validation and snapshot writer intact; replace
-- only their legacy fixed closure inventory condition with the real inventory.
do $$
declare definition text; signature regprocedure;
begin
 foreach signature in array array['public.validate_order_item(jsonb)'::regprocedure,'public.confirm_order_transaction(uuid,uuid,jsonb,jsonb)'::regprocedure] loop
  definition:=pg_get_functiondef(signature);
  if position('i->>''collar_type'' not in (''plastic_buckle'',''metal_buckle'',''martingale'')' in definition)>0 then
   definition:=replace(definition,'i->>''collar_type'' not in (''plastic_buckle'',''metal_buckle'',''martingale'')','not exists(select 1 from public.closures where key=i->>''collar_type'')');
  elsif position('coalesce(i->>''collar_type'','''') not in (''plastic_buckle'',''metal_buckle'',''martingale'')' in definition)>0 then
   definition:=replace(definition,'coalesce(i->>''collar_type'','''') not in (''plastic_buckle'',''metal_buckle'',''martingale'')','not exists(select 1 from public.closures where key=i->>''collar_type'')');
  else raise exception 'Expected legacy closure validator not found: %',signature;
  end if;
  execute definition;
 end loop;
end $$;
notify pgrst,'reload schema';
