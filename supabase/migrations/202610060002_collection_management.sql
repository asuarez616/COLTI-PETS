alter table public.catalog_categories add column active boolean not null default true,add column deleted boolean not null default false,add column revision integer not null default 0;
insert into public.catalog_categories(name) select distinct upper(left(n,1))||substr(n,2) from (select coalesce(nullif(collection_override,''),nullif(source_collection,''),'Sin colección') n from public.designs where type='printed') q on conflict do nothing;
create unique index catalog_collection_unique on public.catalog_categories(lower(name));
drop policy categories_owner_read on public.catalog_categories;
create policy collections_read on public.catalog_categories for select to anon,authenticated using(true);
grant select on public.catalog_categories to anon;
create function public.admin_collection(p_action text,p_name text,p_new text default null,p_revision integer default 0) returns void language plpgsql security definer set search_path='' as $$
declare current public.catalog_categories; clean text:=upper(left(btrim(p_new),1))||substr(btrim(p_new),2);
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_action='create' then
  if clean is null or length(clean) not between 1 and 80 or clean ~ '[[:cntrl:]]' then raise exception 'INVALID_COLLECTION'; end if;
  insert into public.catalog_categories(name) values(clean); return;
 end if;
 select * into current from public.catalog_categories where lower(name)=lower(p_name) and not deleted for update;
 if not found or current.revision<>p_revision then raise exception 'STATE_CONFLICT'; end if;
 if lower(current.name)='sin colección' then raise exception 'DEFAULT_COLLECTION'; end if;
 if p_action='rename' then
  if clean is null or length(clean) not between 1 and 80 or clean ~ '[[:cntrl:]]' then raise exception 'INVALID_COLLECTION'; end if;
  update public.catalog_categories set name=clean,revision=revision+1 where name=current.name;
  update public.designs set collection_override=clean,collection_revision=collection_revision+1 where type='printed' and lower(coalesce(nullif(collection_override,''),nullif(source_collection,''),'Sin colección'))=lower(current.name);
 elsif p_action='delete' then
  update public.designs set collection_override='Sin colección',collection_revision=collection_revision+1 where type='printed' and lower(coalesce(nullif(collection_override,''),nullif(source_collection,''),'Sin colección'))=lower(current.name);
  update public.catalog_categories set deleted=true,revision=revision+1 where name=current.name;
 elsif p_action in ('activate','deactivate') then
  update public.catalog_categories set active=(p_action='activate'),revision=revision+1 where name=current.name;
 else raise exception 'INVALID_ACTION'; end if;
end;$$;
revoke all on function public.admin_collection(text,text,text,integer) from public,anon;
grant execute on function public.admin_collection(text,text,text,integer) to authenticated;
alter function public.catalog_variant_available(uuid,text,numeric) rename to catalog_variant_before_collections;
create function public.catalog_variant_available(p_design uuid,p_size text,p_width numeric) returns boolean language sql stable security definer set search_path='' as $$
select public.catalog_variant_before_collections(p_design,p_size,p_width) and not exists(select 1 from public.designs d join public.catalog_categories c on lower(c.name)=lower(coalesce(nullif(d.collection_override,''),nullif(d.source_collection,''),'Sin colección')) where d.id=p_design and d.type='printed' and not c.deleted and not c.active);
$$;
do $$ begin if exists(select 1 from pg_publication where pubname='supabase_realtime') then alter publication supabase_realtime add table public.catalog_categories; end if; end $$;
notify pgrst,'reload schema';
