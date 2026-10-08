-- Only the server-side synchronizer can replace the Drive catalogue.
create function public.sync_drive_catalog(p_designs jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare d jsonb; pair jsonb; target_id uuid; synced uuid[] := '{}'; position integer := 0;
begin
 if jsonb_typeof(p_designs) is distinct from 'array' or jsonb_array_length(p_designs) = 0 then
  raise exception 'Refusing an empty catalogue replacement';
 end if;
 for d in select value from jsonb_array_elements(p_designs) loop
  if d->>'type' not in ('printed','woven') or d->>'image' !~ '^catalog/drive/[A-Za-z0-9_-]+-800\.webp$'
   or d->>'asset_version' not like 'drive-v1%' or jsonb_typeof(d->'compatibility') is distinct from 'array' then
   raise exception 'Invalid Drive design';
  end if;
  -- Preserve existing design references, including the former demo seed code.
  select id into target_id from public.designs where id=(d->>'id')::uuid or code=d->>'code'
   order by (id=(d->>'id')::uuid) desc limit 1;
  target_id := coalesce(target_id,(d->>'id')::uuid);
  insert into public.designs(id,code,type,image_path,active,is_test_data,display_order,asset_version)
   values(target_id,d->>'code',d->>'type',d->>'image',true,false,position,d->>'asset_version')
   on conflict(id) do update set code=excluded.code,type=excluded.type,image_path=excluded.image_path,
    active=true,is_test_data=false,display_order=excluded.display_order,asset_version=excluded.asset_version,updated_at=now();
  delete from public.design_compatibility where design_id=target_id;
  for pair in select value from jsonb_array_elements(d->'compatibility') loop
   insert into public.design_compatibility(design_id,size_code,width_cm)
    values(target_id,pair->>'size_code',(pair->>'width_cm')::numeric);
  end loop;
  synced := array_append(synced,target_id);position := position+1;
 end loop;
 update public.designs set active=false,updated_at=now()
  where (asset_version like 'drive-v1%' or is_test_data) and not(id=any(synced));
 return position;
end;
$$;
revoke all on function public.sync_drive_catalog(jsonb) from public,anon,authenticated;
grant execute on function public.sync_drive_catalog(jsonb) to service_role;
