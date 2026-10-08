-- Admin uses the original orders and immutable order_items snapshots.
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check check(status in ('new','in_progress','finished','ready','delivered','cancelled'));
alter table public.orders add column production_note text not null default '' check(length(production_note)<=4000);
create index orders_admin_date on public.orders(confirmed_at desc,id);
create table public.catalog_availability (
 design_id uuid not null references public.designs(id), width numeric not null check(width>=0),
 enabled boolean not null, revision integer not null default 1, primary key(design_id,width)
);
create table public.hero_configuration (
 singleton boolean primary key default true check(singleton), revision integer not null default 0,
 images jsonb not null default '[]'::jsonb
);
insert into public.hero_configuration(singleton) values(true);
alter table public.catalog_availability enable row level security;
alter table public.hero_configuration enable row level security;
create policy availability_read on public.catalog_availability for select to anon,authenticated using(true);
create policy hero_read on public.hero_configuration for select to anon,authenticated using(true);
grant select on public.catalog_availability,public.hero_configuration to anon,authenticated;
revoke insert,update,delete on public.catalog_availability,public.hero_configuration from anon,authenticated;
-- production_note is never added to order_document / find_order / customer exports.
-- Existing owner SELECT is already restricted to the configured production owner.
create function public.admin_order(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 return (select jsonb_build_object('order',public.order_document(id),'note',production_note) from public.orders where id=p_id);
end;$$;
create function public.admin_orders(p_search text default '',p_status text default null,p_page integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare search text:=lower(regexp_replace(btrim(coalesce(p_search,'')),'\s+',' ','g'));
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_page is null or p_page<0 or p_page>100000 then raise exception 'INVALID_PAGE'; end if;
 if p_status is not null and p_status not in ('new','in_progress','ready','delivered','cancelled') then raise exception 'INVALID_STATUS'; end if;
 return coalesce((select jsonb_agg(public.order_document(id) order by confirmed_at desc,id) from (
 select o.id,o.confirmed_at from public.orders o where
 (p_status is null or (case when o.status='finished' then 'ready' else o.status end)=p_status)
 and (search='' or position(search in lower(regexp_replace(o.order_code||' '||(o.customer_snapshot->>'name'),'\s+',' ','g')))>0
 or position(regexp_replace(search,'\s+','','g') in lower(regexp_replace(o.customer_snapshot->>'phone','\s+','','g')))>0
 or exists(select 1 from public.order_items i where i.order_id=o.id and position(search in lower(regexp_replace(i.pet_name,'\s+',' ','g')))>0))
 order by o.confirmed_at desc,o.id limit 20 offset p_page*20) q),'[]'::jsonb);
end;$$;
create function public.admin_update_order(p_id uuid,p_updated timestamptz,p_status text default null,p_note text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare current_order public.orders; current_status text;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 select * into current_order from public.orders where id=p_id for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 if p_updated is distinct from current_order.updated_at then raise exception 'STATE_CONFLICT'; end if;
 current_status:=case when current_order.status='finished' then 'ready' else current_order.status end;
 if (p_status is null)=(p_note is null) then raise exception 'INVALID_UPDATE'; end if;
 if p_note is not null and length(p_note)>4000 then raise exception 'INVALID_NOTE'; end if;
 if p_status is not null and not (
 (current_status='new' and p_status='in_progress') or (current_status='in_progress' and p_status='ready') or
 (current_status='ready' and p_status='delivered') or (current_status in ('new','in_progress','ready') and p_status='cancelled')) then raise exception 'INVALID_TRANSITION'; end if;
 update public.orders set status=coalesce(p_status,status),production_note=coalesce(p_note,production_note),updated_at=clock_timestamp() where id=p_id;
 return public.admin_order(p_id);
end;$$;
create function public.admin_catalog() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 return jsonb_build_object('designs',(select coalesce(jsonb_agg(to_jsonb(d)||jsonb_build_object('compatibility',(select coalesce(jsonb_agg(jsonb_build_object('size_code',c.size_code,'width_cm',c.width_cm)),'[]'::jsonb) from public.design_compatibility c where c.design_id=d.id)) order by display_order),'[]'::jsonb) from public.designs d),
 'overrides',(select coalesce(jsonb_agg(jsonb_build_object('designId',design_id,'width',width,'enabled',enabled,'revision',revision)),'[]'::jsonb) from public.catalog_availability));
end;$$;
create function public.admin_availability(p_design uuid,p_width numeric,p_enabled boolean,p_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare current_revision integer; result public.catalog_availability;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_enabled is null or p_width is null or p_revision is null then raise exception 'INVALID_AVAILABILITY'; end if;
 -- Same design lock as confirm_order serializes disabling vs confirmation, even for absent overrides.
 perform 1 from public.designs where id=p_design for update;
 if not found then raise exception 'CATALOG_UNAVAILABLE'; end if;
 if p_width<>0 and not exists(select 1 from public.design_compatibility where design_id=p_design and width_cm=p_width) then raise exception 'INVALID_VARIANT'; end if;
 select revision into current_revision from public.catalog_availability where design_id=p_design and width=p_width;
 if coalesce(current_revision,0)<>p_revision then raise exception 'STATE_CONFLICT'; end if;
 insert into public.catalog_availability values(p_design,p_width,p_enabled,p_revision+1)
 on conflict(design_id,width) do update set enabled=excluded.enabled,revision=excluded.revision returning * into result;
 return jsonb_build_object('designId',result.design_id,'width',result.width,'enabled',result.enabled,'revision',result.revision);
end;$$;
create function public.admin_hero(p_images jsonb,p_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare current_revision integer; result public.hero_configuration;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_images is null or jsonb_typeof(p_images)<>'array' then raise exception 'INVALID_HERO'; end if;
 if jsonb_array_length(p_images)>500 or exists(select 1 from jsonb_array_elements(p_images) i where jsonb_typeof(i->'id') is distinct from 'string' or length(i->>'id') not between 1 and 200 or jsonb_typeof(i->'active') is distinct from 'boolean')
 or (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_images)) then raise exception 'INVALID_HERO'; end if;
 select revision into current_revision from public.hero_configuration where singleton for update;
 if p_revision is distinct from current_revision then raise exception 'STATE_CONFLICT'; end if;
 update public.hero_configuration set images=p_images,revision=revision+1 where singleton returning * into result;
 return jsonb_build_object('revision',result.revision,'images',result.images);
end;$$;
alter function public.confirm_order(uuid,uuid,jsonb,jsonb) rename to confirm_order_before_availability;
revoke all on function public.confirm_order_before_availability(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
create function public.confirm_order(p_key uuid,p_draft uuid,p_customer jsonb,p_items jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
 if exists(select 1 from public.catalog_availability where design_id=(item->>'design_id')::uuid and width in (0,(item->>'width_cm')::numeric) and not enabled) then raise exception 'CATALOG_UNAVAILABLE'; end if;
 end loop;
 return public.confirm_order_before_availability(p_key,p_draft,p_customer,p_items);
end;$$;
revoke all on function public.admin_order(uuid),public.admin_orders(text,text,integer),public.admin_update_order(uuid,timestamptz,text,text),public.admin_catalog(),public.admin_availability(uuid,numeric,boolean,integer),public.admin_hero(jsonb,integer),public.confirm_order(uuid,uuid,jsonb,jsonb) from public,anon;
grant execute on function public.admin_order(uuid),public.admin_orders(text,text,integer),public.admin_update_order(uuid,timestamptz,text,text),public.admin_catalog(),public.admin_availability(uuid,numeric,boolean,integer),public.admin_hero(jsonb,integer),public.confirm_order(uuid,uuid,jsonb,jsonb) to authenticated;
