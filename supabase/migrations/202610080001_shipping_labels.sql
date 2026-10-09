-- COLTI 4 x 6 in thermal labels. The carrier still creates the official guide.
alter table public.orders add column shipping_address jsonb;

create or replace function public.admin_order(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 return (select jsonb_build_object(
  'order',public.order_document(id)||jsonb_build_object('shipping_address',shipping_address),
  'note',production_note,'cancellationReason',cancellation_reason
 ) from public.orders where id=p_id);
end;$$;

create function public.admin_save_shipping_address(p_id uuid,p_updated timestamptz,p_address jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare current_order public.orders;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_address is null or jsonb_typeof(p_address)<>'object'
  or jsonb_typeof(p_address->'line1') is distinct from 'string'
  or jsonb_typeof(p_address->'line2') is distinct from 'string'
  or jsonb_typeof(p_address->'city') is distinct from 'string'
  or jsonb_typeof(p_address->'region') is distinct from 'string'
  or jsonb_typeof(p_address->'postalCode') is distinct from 'string'
  or jsonb_typeof(p_address->'country') is distinct from 'string'
  or length(btrim(p_address->>'line1')) not between 1 and 120
  or length(p_address->>'line2')>100 or length(btrim(p_address->>'city')) not between 1 and 80
  or length(p_address->>'region')>80 or length(p_address->>'postalCode')>16
  or length(btrim(p_address->>'country')) not between 1 and 80 then raise exception 'INVALID_SHIPPING_ADDRESS'; end if;
 select * into current_order from public.orders where id=p_id for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 if p_updated is distinct from current_order.updated_at then raise exception 'STATE_CONFLICT'; end if;
 if current_order.status not in ('ready','finished','delivered') then raise exception 'INVALID_SHIPPING_STATUS'; end if;
 update public.orders set shipping_address=jsonb_build_object(
  'line1',btrim(p_address->>'line1'),'line2',btrim(p_address->>'line2'),
  'city',btrim(p_address->>'city'),'region',btrim(p_address->>'region'),
  'postalCode',btrim(p_address->>'postalCode'),'country',btrim(p_address->>'country')
 ),updated_at=clock_timestamp() where id=p_id;
 return public.admin_order(p_id)->'order';
end;$$;

revoke all on function public.admin_save_shipping_address(uuid,timestamptz,jsonb) from public,anon;
grant execute on function public.admin_save_shipping_address(uuid,timestamptz,jsonb) to authenticated;
notify pgrst,'reload schema';
