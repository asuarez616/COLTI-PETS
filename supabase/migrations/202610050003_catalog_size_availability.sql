-- Additive hierarchy; legacy design/width overrides remain intact.
create table public.catalog_size_availability (
 design_id uuid not null references public.designs(id),
 size_code text not null references public.sizes(code),
 width numeric not null check(width>=0),enabled boolean not null,
 revision integer not null default 1,primary key(design_id,size_code,width)
);
alter table public.catalog_size_availability enable row level security;
create policy availability_read on public.catalog_size_availability for select to anon,authenticated using(true);
grant select on public.catalog_size_availability to anon,authenticated;
revoke insert,update,delete on public.catalog_size_availability from anon,authenticated;
-- Materialize existing width preferences into compatible size/width pairs.
insert into public.catalog_size_availability(design_id,size_code,width,enabled)
select a.design_id,c.size_code,a.width,a.enabled from public.catalog_availability a
join public.design_compatibility c on c.design_id=a.design_id and c.width_cm=a.width
where a.width>0;
create function public.catalog_variant_available(p_design uuid,p_size text,p_width numeric) returns boolean
language sql stable security definer set search_path='' as $$
select exists(select 1 from public.designs d join public.design_compatibility c on c.design_id=d.id
join public.size_widths sw on sw.size_code=c.size_code and sw.width_cm=c.width_cm
where d.id=p_design and d.active and c.size_code=p_size and c.width_cm=p_width)
and coalesce((select enabled from public.catalog_availability where design_id=p_design and width=0),true)
and coalesce((select enabled from public.catalog_size_availability where design_id=p_design and size_code=p_size and width=0),true)
and coalesce((select enabled from public.catalog_size_availability where design_id=p_design and size_code=p_size and width=p_width),
(select enabled from public.catalog_availability where design_id=p_design and width=p_width),true);
$$;
create function public.admin_size_availability(p_design uuid,p_size text,p_width numeric,p_enabled boolean,p_revision integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare current_revision integer; result public.catalog_size_availability;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_enabled is null or p_width is null or p_revision is null or p_revision<0 then raise exception 'INVALID_AVAILABILITY'; end if;
 perform 1 from public.designs where id=p_design for update;
 if not found then raise exception 'CATALOG_UNAVAILABLE'; end if;
 if not exists(select 1 from public.design_compatibility c join public.size_widths sw on sw.size_code=c.size_code and sw.width_cm=c.width_cm
 where c.design_id=p_design and c.size_code=p_size and (p_width=0 or c.width_cm=p_width)) then raise exception 'INVALID_VARIANT'; end if;
 select revision into current_revision from public.catalog_size_availability where design_id=p_design and size_code=p_size and width=p_width;
 if coalesce(current_revision,0)<>p_revision then raise exception 'STATE_CONFLICT'; end if;
 insert into public.catalog_size_availability values(p_design,p_size,p_width,p_enabled,p_revision+1)
 on conflict(design_id,size_code,width) do update set enabled=excluded.enabled,revision=excluded.revision returning * into result;
 return jsonb_build_object('designId',result.design_id,'size',result.size_code,'width',result.width,'enabled',result.enabled,'revision',result.revision);
end;$$;
revoke all on function public.admin_size_availability(uuid,text,numeric,boolean,integer) from public,anon;
grant execute on function public.admin_size_availability(uuid,text,numeric,boolean,integer) to authenticated;
create or replace function public.admin_catalog() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 return jsonb_build_object('designs',(select coalesce(jsonb_agg(to_jsonb(d)||jsonb_build_object('compatibility',(select coalesce(jsonb_agg(jsonb_build_object('size_code',c.size_code,'width_cm',c.width_cm)),'[]'::jsonb) from public.design_compatibility c where c.design_id=d.id)) order by display_order),'[]'::jsonb) from public.designs d),
 'overrides',(select coalesce(jsonb_agg(jsonb_build_object('designId',design_id,'width',width,'size',size_code,'enabled',enabled,'revision',revision)),'[]'::jsonb) from (select design_id,width,enabled,revision,null::text as size_code from public.catalog_availability union all select design_id,width,enabled,revision,size_code from public.catalog_size_availability) a));
end;$$;
create or replace function public.confirm_order(p_key uuid,p_draft uuid,p_customer jsonb,p_items jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.orders where owner_user_id=auth.uid() and idempotency_key=p_key) then return public.confirm_order_before_availability(p_key,p_draft,p_customer,p_items); end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'INVALID_PAYLOAD'; end if;
 if octet_length(p_items::text)>200000 or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'ITEM_LIMIT'; end if;
 -- Lock in deterministic ID order, avoiding deadlocks on multi-collar orders.
 perform 1 from public.designs where id in (select (value->>'design_id')::uuid from jsonb_array_elements(p_items)) order by id for share;
 for item in select value from jsonb_array_elements(p_items) loop
 if not public.catalog_variant_available((item->>'design_id')::uuid,item->>'size_code',(item->>'width_cm')::numeric) then raise exception 'CATALOG_UNAVAILABLE'; end if;
 end loop;
 return public.confirm_order_before_availability(p_key,p_draft,p_customer,p_items);
end;$$;

-- Same existing realtime channel; add only the new availability relation.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
 alter publication supabase_realtime add table public.catalog_size_availability;
 end if;
end $$;
notify pgrst,'reload schema';

create or replace function public.admin_availability_batch(p_changes jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare change jsonb; result jsonb:='[]'::jsonb;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_changes is null or jsonb_typeof(p_changes)<>'array' then raise exception 'INVALID_AVAILABILITY'; end if;
 if jsonb_array_length(p_changes) not between 1 and 500 or exists(select 1 from jsonb_array_elements(p_changes) c where jsonb_typeof(c->'designId') is distinct from 'string' or jsonb_typeof(c->'width') is distinct from 'number' or jsonb_typeof(c->'enabled') is distinct from 'boolean' or jsonb_typeof(c->'revision') is distinct from 'number') then raise exception 'INVALID_AVAILABILITY'; end if;
 if exists(select 1 from jsonb_array_elements(p_changes) c group by c->>'designId',coalesce(c->>'size',''),c->>'width' having count(*)>1) then raise exception 'INVALID_AVAILABILITY'; end if;
 perform 1 from public.designs where id in (select (c->>'designId')::uuid from jsonb_array_elements(p_changes) c) order by id for update;
 for change in select value from jsonb_array_elements(p_changes) order by value->>'designId',(value->>'width')::numeric loop
  if coalesce(change->>'size','')<>'' then
 result:=result||jsonb_build_array(public.admin_size_availability((change->>'designId')::uuid,change->>'size',(change->>'width')::numeric,(change->>'enabled')::boolean,(change->>'revision')::integer));
 else
 result:=result||jsonb_build_array(public.admin_availability((change->>'designId')::uuid,(change->>'width')::numeric,(change->>'enabled')::boolean,(change->>'revision')::integer));
 end if;
 end loop;
 return result;
end;$$;
revoke all on function public.admin_availability_batch(jsonb) from public,anon;
grant execute on function public.admin_availability_batch(jsonb) to authenticated;
