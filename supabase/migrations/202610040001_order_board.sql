-- Private cancellation metadata; customer order_document remains unchanged.
alter table public.orders add column cancellation_reason text not null default '' check(length(cancellation_reason)<=1000);
create or replace function public.admin_order(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 return (select jsonb_build_object('order',public.order_document(id),'note',production_note,'cancellationReason',cancellation_reason) from public.orders where id=p_id);
end;$$;
create function public.admin_cancel_order(p_id uuid,p_updated timestamptz,p_reason text default '') returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_reason is null or length(p_reason)>1000 then raise exception 'INVALID_NOTE'; end if;
 -- Original transition and optimistic-lock rules perform the cancellation.
 perform public.admin_update_order(p_id,p_updated,'cancelled',null);
 update public.orders set cancellation_reason=btrim(p_reason) where id=p_id;
 return public.admin_order(p_id);
end;$$;
create function public.admin_orders_filtered(p_search text default '',p_status text default null,p_page integer default 0,p_from timestamptz default null,p_to timestamptz default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare search text:=lower(regexp_replace(btrim(coalesce(p_search,'')),'\s+',' ','g'));
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_page is null or p_page<0 or p_page>100000 then raise exception 'INVALID_PAGE'; end if;
 if p_from is not null and p_to is not null and p_from>=p_to then raise exception 'INVALID_DATE_RANGE'; end if;
 if p_status is not null and p_status not in ('new','in_progress','ready','delivered','cancelled') then raise exception 'INVALID_STATUS'; end if;
 return coalesce((select jsonb_agg(public.order_document(id) order by confirmed_at desc,id) from (
 select o.id,o.confirmed_at from public.orders o where
 (p_from is null or o.confirmed_at>=p_from) and (p_to is null or o.confirmed_at<p_to)
 and (p_status is null or (case when o.status='finished' then 'ready' else o.status end)=p_status)
 and (search='' or position(search in lower(regexp_replace(o.order_code||' '||(o.customer_snapshot->>'name'),'\s+',' ','g')))>0
 or position(regexp_replace(search,'\s+','','g') in lower(regexp_replace(o.customer_snapshot->>'phone','\s+','','g')))>0
 or exists(select 1 from public.order_items i where i.order_id=o.id and position(search in lower(regexp_replace(i.pet_name,'\s+',' ','g')))>0))
 order by o.confirmed_at desc,o.id limit 20 offset p_page*20) q),'[]'::jsonb);
end;$$;
revoke all on function public.admin_cancel_order(uuid,timestamptz,text),public.admin_orders_filtered(text,text,integer,timestamptz,timestamptz) from public,anon;
grant execute on function public.admin_cancel_order(uuid,timestamptz,text),public.admin_orders_filtered(text,text,integer,timestamptz,timestamptz) to authenticated;
