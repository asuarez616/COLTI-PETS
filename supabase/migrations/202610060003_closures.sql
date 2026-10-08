-- Closure configuration uses the existing Size/Width master. No historical backfill.
create table public.closures (
 key text primary key check(key in ('plastic_buckle','metal_buckle','martingale')),
 name_en text not null check(length(btrim(name_en)) between 1 and 100),
 name_es text not null check(length(btrim(name_es)) between 1 and 100),
 icon text not null check(icon ~ '^/icons/[a-z0-9-]+[.]svg$' or icon ~ '^closures/uploads/[a-f0-9-]+-[0-9]+[.]webp$'),
 active boolean not null default true,display_order integer not null check(display_order between 0 and 100),
 preferences jsonb not null default '{}'::jsonb,revision integer not null default 1
);
insert into public.closures(key,name_en,name_es,icon,display_order) values
 ('plastic_buckle','Plastic Buckle','Broche plástico','/icons/plastic-buckle.svg',0),
 ('metal_buckle','Metal Buckle','Hebilla metálica','/icons/metal-buckle.svg',1),
 ('martingale','Martingale','Martingale','/icons/martingale.svg',2);
alter table public.closures enable row level security;
create policy closures_read on public.closures for select to anon,authenticated using(true);
grant select on public.closures to anon,authenticated;
revoke insert,update,delete on public.closures from anon,authenticated;
create function public.admin_closure(p_value jsonb,p_revision integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare current_row public.closures; size_entry record; width_entry record;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 select * into current_row from public.closures where key=p_value->>'key' for update;
 if not found then raise exception 'INVALID_CLOSURE'; end if;
 if current_row.revision is distinct from p_revision then raise exception 'STATE_CONFLICT'; end if;
 if jsonb_typeof(p_value->'active') is distinct from 'boolean' or jsonb_typeof(p_value->'preferences') is distinct from 'object' or jsonb_typeof(p_value->'display_order') is distinct from 'number' or jsonb_typeof(p_value->'name_en') is distinct from 'string' or jsonb_typeof(p_value->'name_es') is distinct from 'string' or jsonb_typeof(p_value->'icon') is distinct from 'string' then raise exception 'INVALID_CLOSURE'; end if;
 for size_entry in select * from jsonb_each(p_value->'preferences') loop
  if not exists(select 1 from public.sizes where code=size_entry.key) or jsonb_typeof(size_entry.value->'enabled') is distinct from 'boolean' or jsonb_typeof(size_entry.value->'widths') is distinct from 'object' then raise exception 'INVALID_SIZE'; end if;
  for width_entry in select * from jsonb_each(size_entry.value->'widths') loop
   if jsonb_typeof(width_entry.value) is distinct from 'boolean' or not exists(select 1 from public.size_widths where size_code=size_entry.key and width_cm::text::numeric=width_entry.key::numeric) then raise exception 'INVALID_WIDTH'; end if;
  end loop;
 end loop;
 update public.closures set name_en=btrim(p_value->>'name_en'),name_es=btrim(p_value->>'name_es'),icon=p_value->>'icon',active=(p_value->>'active')::boolean,display_order=(p_value->>'display_order')::integer,preferences=p_value->'preferences',revision=revision+1 where key=current_row.key returning * into current_row;
 return to_jsonb(current_row);
end;$$;
revoke all on function public.admin_closure(jsonb,integer) from public,anon;
grant execute on function public.admin_closure(jsonb,integer) to authenticated;
create function public.closure_available(p_key text,p_size text,p_width numeric) returns boolean
language sql stable security definer set search_path='' as $$
select exists(select 1 from public.closures c join public.size_widths sw on sw.size_code=p_size and sw.width_cm=p_width
 where c.key=p_key and c.active
 and coalesce((c.preferences->p_size->>'enabled')::boolean,true)
 and ((select count(*) from public.size_widths where size_code=p_size)=1 or coalesce((select value::boolean from jsonb_each(c.preferences->p_size->'widths') where key::numeric=p_width),true)));
$$;
alter function public.confirm_order(uuid,uuid,jsonb,jsonb) rename to confirm_order_before_closures;
revoke all on function public.confirm_order_before_closures(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
create function public.confirm_order(p_key uuid,p_draft uuid,p_customer jsonb,p_items jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item jsonb; result jsonb;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.orders where owner_user_id=auth.uid() and idempotency_key=p_key) then return public.confirm_order_before_closures(p_key,p_draft,p_customer,p_items); end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20 or octet_length(p_items::text)>200000 then raise exception 'INVALID_PAYLOAD'; end if;
 -- Lock configuration for availability validation and snapshot capture in one transaction.
 perform 1 from public.closures where key in (select value->>'collar_type' from jsonb_array_elements(p_items)) order by key for share;
 for item in select value from jsonb_array_elements(p_items) loop
  if not public.closure_available(item->>'collar_type',item->>'size_code',(item->>'width_cm')::numeric) then raise exception 'CLOSURE_CHANGED'; end if;
 end loop;
 result:=public.confirm_order_before_closures(p_key,p_draft,p_customer,p_items);
 update public.order_items i set snapshot=i.snapshot||jsonb_build_object('closure_snapshot',jsonb_build_object('key',c.key,'name_en',c.name_en,'name_es',c.name_es,'icon',c.icon)) from public.closures c where i.order_id=(result->>'id')::uuid and c.key=i.collar_type;
 return public.order_document((result->>'id')::uuid);
end;$$;
revoke all on function public.confirm_order(uuid,uuid,jsonb,jsonb) from public,anon;
grant execute on function public.confirm_order(uuid,uuid,jsonb,jsonb) to authenticated;
do $$ begin if exists(select 1 from pg_publication where pubname='supabase_realtime') then alter publication supabase_realtime add table public.closures; end if; end $$;
notify pgrst,'reload schema';
