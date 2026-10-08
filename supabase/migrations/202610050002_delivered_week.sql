-- Actual delivery time is separate from note edits and creation time.
-- Historical deliveries stay undated: no fabricated backfill.
alter table public.orders add column delivered_at timestamptz;
create function public.capture_delivery_time() returns trigger language plpgsql set search_path='' as $$
begin
 if old.delivered_at is not null then new.delivered_at:=old.delivered_at;
 elsif new.status='delivered' and old.status is distinct from 'delivered' then new.delivered_at:=clock_timestamp();
 else new.delivered_at:=old.delivered_at;
 end if;
 return new;
end;$$;
create trigger capture_delivery_time before update on public.orders for each row execute function public.capture_delivery_time();
create index orders_delivered_time_idx on public.orders(delivered_at desc,id) where status='delivered';
create function public.admin_delivered_week(p_search text default '',p_from timestamptz default null,p_to timestamptz default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 week_start timestamptz:=date_trunc('week',current_timestamp at time zone 'America/Guayaquil') at time zone 'America/Guayaquil';
 week_end timestamptz:=(date_trunc('week',current_timestamp at time zone 'America/Guayaquil')+interval '1 week') at time zone 'America/Guayaquil';
 search text:=lower(regexp_replace(btrim(coalesce(p_search,'')),'\s+',' ','g'));
 result jsonb;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_from is not null and p_to is not null and p_from>=p_to then raise exception 'INVALID_DATE_RANGE'; end if;
 with matching as (
 select o.id,o.delivered_at from public.orders o where o.status='delivered'
 and o.delivered_at>=week_start and o.delivered_at<week_end
 and (p_from is null or o.confirmed_at>=p_from) and (p_to is null or o.confirmed_at<p_to)
 and (search='' or position(search in lower(regexp_replace(o.order_code||' '||(o.customer_snapshot->>'name'),'\s+',' ','g')))>0
 or position(regexp_replace(search,'\s+','','g') in lower(regexp_replace(o.customer_snapshot->>'phone','\s+','','g')))>0
 or exists(select 1 from public.order_items i where i.order_id=o.id and position(search in lower(regexp_replace(i.pet_name,'\s+',' ','g')))>0))
 ), latest as (select * from matching order by delivered_at desc,id limit 6)
 select jsonb_build_object('total',(select count(*) from matching),'orders',coalesce((select jsonb_agg(public.order_document(id) order by delivered_at desc,id) from latest),'[]'::jsonb)) into result;
 return result;
end;$$;
revoke all on function public.capture_delivery_time(),public.admin_delivered_week(text,timestamptz,timestamptz) from public,anon;
grant execute on function public.admin_delivered_week(text,timestamptz,timestamptz) to authenticated;
