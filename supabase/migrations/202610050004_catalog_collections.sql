-- Collections are organizational metadata; availability and order snapshots are unchanged.

alter table public.designs add column source_collection text not null default '', add column collection_override text, add column collection_revision integer not null default 0;

update public.designs d set source_collection=v.name from (values ('E-31','personalizados'),('E-30','personalizados'),('E-29','personalizados'),('EF-10','personalizados'),('EF-7','personalizados'),('EF-9','florales'),('EF-8','florales'),('EF-6','florales'),('EF-5','florales'),('EF-4','florales'),('EF-3','florales'),('EF-2','florales'),('EF-1','florales'),('E-26','autoctonos'),('E-27','autoctonos'),('E-28','autoctonos'),('E-24','autoctonos'),('E-25','autoctonos'),('E-23','autoctonos'),('E-22','autoctonos'),('E-21','autoctonos'),('E-20','autoctonos'),('E-19','autoctonos'),('E-18','autoctonos'),('E-17','autoctonos'),('E-16','autoctonos'),('E-15','autoctonos'),('E-14','autoctonos'),('E-13','autoctonos'),('E-12','autoctonos'),('E-11','autoctonos'),('E-10','autoctonos'),('E-9','autoctonos'),('E-8','autoctonos'),('E-7','autoctonos'),('E-6','autoctonos'),('E-5','autoctonos'),('E-4','autoctonos'),('E-3','autoctonos'),('E-2','autoctonos'),('E-1','autoctonos'),('ES-13','superheroes'),('ES-12','superheroes'),('ES-11','superheroes'),('ES-9','superheroes'),('ES-8','superheroes'),('ES-7','superheroes'),('ES-6','superheroes'),('ES-5','superheroes'),('ES-10','superheroes'),('ES-4','superheroes'),('ES-3','superheroes'),('ES-2','superheroes'),('ES-1','superheroes'),('EC-16','Cartoons'),('EC-14','Cartoons'),('EC-17','Cartoons'),('EC-15','Cartoons'),('EC-13','Cartoons'),('EC-12','Cartoons'),('EC-8','Cartoons'),('EC-7','Cartoons'),('EC-6','Cartoons'),('EC-11','Cartoons'),('EC-5','Cartoons'),('EC-10','Cartoons'),('EC-9','Cartoons'),('EC-4','Cartoons'),('EC-3','Cartoons'),('EC-2','Cartoons'),('EC-1','Cartoons')) v(code,name) where d.code=v.code and d.type='printed';

create or replace function public.admin_design_collection(p_design uuid,p_name text,p_revision integer) returns jsonb

language plpgsql security definer set search_path='' as $$

declare current public.designs; clean text:=nullif(btrim(regexp_replace(p_name,'\s+',' ','g')),'');

begin

 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;

 if p_name is null or length(clean)>80 or clean ~ '[[:cntrl:]]' or p_revision is null then raise exception 'INVALID_COLLECTION'; end if;

 select * into current from public.designs where id=p_design for update;

 if not found or current.type<>'printed' then raise exception 'CATALOG_UNAVAILABLE'; end if;

 if current.collection_revision<>p_revision then raise exception 'STATE_CONFLICT'; end if;

 update public.designs set collection_override=clean,collection_revision=collection_revision+1 where id=p_design;

 return jsonb_build_object('collection_override',clean,'collection_revision',p_revision+1);

end;$$;

revoke all on function public.admin_design_collection(uuid,text,integer) from public,anon;

grant execute on function public.admin_design_collection(uuid,text,integer) to authenticated;

-- Retain manual moves when Drive republishes assets or changes folders.

alter function public.sync_drive_catalog(jsonb) rename to sync_drive_catalog_before_collections;

create function public.sync_drive_catalog(p_designs jsonb) returns integer

language plpgsql security definer set search_path='' as $$

declare count integer; item jsonb;

begin

 count:=public.sync_drive_catalog_before_collections(p_designs);

 for item in select value from jsonb_array_elements(p_designs) loop

  if item ? 'source_collection' then

   if length(item->>'source_collection')>80 then raise exception 'INVALID_COLLECTION'; end if;

   update public.designs set source_collection=coalesce(item->>'source_collection','') where code=item->>'code' and type='printed';

  end if;

 end loop;

 return count;

end;$$;

revoke all on function public.sync_drive_catalog(jsonb) from public,anon,authenticated;

grant execute on function public.sync_drive_catalog(jsonb) to service_role;

notify pgrst,'reload schema';

