-- Explicit Phase 24 production reversals; preserve optimistic locking and terminal history.
create or replace function public.admin_update_order(p_id uuid,p_updated timestamptz,p_status text default null,p_note text default null) returns jsonb language plpgsql security definer set search_path='' as $$
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
 (current_status='in_progress' and p_status='new') or (current_status='ready' and p_status='in_progress') or (current_status='ready' and p_status='delivered') or (current_status in ('new','in_progress','ready') and p_status='cancelled')) then raise exception 'INVALID_TRANSITION'; end if;
 update public.orders set status=coalesce(p_status,status),production_note=coalesce(p_note,production_note),updated_at=clock_timestamp() where id=p_id;
 return public.admin_order(p_id);
end;$$;

-- One owner-only transaction. Stable design locking avoids bulk/confirmation deadlocks.
create function public.admin_availability_batch(p_changes jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare change jsonb; result jsonb:='[]'::jsonb;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_changes is null or jsonb_typeof(p_changes)<>'array' then raise exception 'INVALID_AVAILABILITY'; end if;
 if jsonb_array_length(p_changes) not between 1 and 500 or exists(select 1 from jsonb_array_elements(p_changes) c where jsonb_typeof(c->'designId') is distinct from 'string' or jsonb_typeof(c->'width') is distinct from 'number' or jsonb_typeof(c->'enabled') is distinct from 'boolean' or jsonb_typeof(c->'revision') is distinct from 'number') then raise exception 'INVALID_AVAILABILITY'; end if;
 if exists(select 1 from jsonb_array_elements(p_changes) c group by c->>'designId',c->>'width' having count(*)>1) then raise exception 'INVALID_AVAILABILITY'; end if;
 perform 1 from public.designs where id in (select (c->>'designId')::uuid from jsonb_array_elements(p_changes) c) order by id for update;
 for change in select value from jsonb_array_elements(p_changes) order by value->>'designId',(value->>'width')::numeric loop
  result:=result||jsonb_build_array(public.admin_availability((change->>'designId')::uuid,(change->>'width')::numeric,(change->>'enabled')::boolean,(change->>'revision')::integer));
 end loop;
 return result;
end;$$;
revoke all on function public.admin_availability_batch(jsonb) from public,anon;
grant execute on function public.admin_availability_batch(jsonb) to authenticated;
