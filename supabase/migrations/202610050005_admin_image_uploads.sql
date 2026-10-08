-- Server-only image registration. Public clients can only read the hero sources.
create table public.uploaded_hero_images(id uuid primary key,asset jsonb not null,created_at timestamptz not null default now());
alter table public.uploaded_hero_images enable row level security;
create policy uploaded_hero_read on public.uploaded_hero_images for select to anon,authenticated using(true);
grant select on public.uploaded_hero_images to anon,authenticated;
create function public.register_admin_image(p_id uuid,p_target text,p_metadata jsonb,p_asset jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare pair record; group_sizes text[];
begin
 if p_target='hero' then
  if p_asset->>'id'<>p_id::text or jsonb_typeof(p_asset->'variants')<>'array' then raise exception 'INVALID_ASSET'; end if;
  insert into public.uploaded_hero_images values(p_id,p_asset,now());
  update public.hero_configuration set images=images||jsonb_build_array(jsonb_build_object('id',p_id::text,'active',false)),revision=revision+1 where singleton;
 elsif p_target='catalog' then
  if coalesce(p_metadata->>'code','') !~ '^[A-Z0-9][A-Z0-9_-]{0,39}$' or p_metadata->>'type' not in ('woven','printed') then raise exception 'INVALID_DESIGN'; end if;
  group_sizes:=case when p_metadata->>'type'='printed' then array['2XS','XS','S','SM','M','ML','L','XL','2XL'] when p_metadata->>'group'='medium-large' then array['M','ML','L','XL','2XL'] when p_metadata->>'group'='small-medium' then array['S','SM'] when p_metadata->>'group'='miniature' then array['2XS','XS'] end;
  if group_sizes is null then raise exception 'INVALID_GROUP'; end if;
  insert into public.designs(id,code,type,image_path,active,is_test_data,asset_version,source_collection) values(p_id,p_metadata->>'code',p_metadata->>'type',p_asset->>'image',true,false,'admin-upload-v1',case when p_metadata->>'type'='printed' then coalesce(nullif(btrim(p_metadata->>'collection'),''),'Sin colección') else '' end);
  insert into public.design_compatibility (design_id,size_code,width_cm) select p_id,size_code,width_cm from public.size_widths where size_code=any(group_sizes);
  insert into public.catalog_availability values(p_id,0,false,1);
 else raise exception 'INVALID_TARGET'; end if;
 return p_id;
end;$$;
revoke all on function public.register_admin_image(uuid,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.register_admin_image(uuid,text,jsonb,jsonb) to service_role;
-- Refuse a Drive code collision rather than replacing a manually uploaded design.
alter function public.sync_drive_catalog(jsonb) rename to sync_drive_catalog_before_uploads;
create function public.sync_drive_catalog(p_designs jsonb) returns integer language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from jsonb_array_elements(p_designs) item join public.designs d on d.code=item->>'code' where d.asset_version='admin-upload-v1') then raise exception 'DUPLICATE_UPLOADED_CODE'; end if;
 return public.sync_drive_catalog_before_uploads(p_designs);
end;$$;
revoke all on function public.sync_drive_catalog(jsonb) from public,anon,authenticated;
grant execute on function public.sync_drive_catalog(jsonb) to service_role;
do $$ begin if exists(select 1 from pg_publication where pubname='supabase_realtime') then alter publication supabase_realtime add table public.uploaded_hero_images; end if; end $$;
notify pgrst,'reload schema';
