-- Modular hardening. Preserve the established transactional writer once, then
-- evolve small validators without copying its snapshot/ownership/idempotency body.
alter table public.tag_options add column active boolean not null default true;
update public.tag_options set active=false where shape='crown';
drop policy "Tag inventory is public" on public.tag_options;
create policy "Tag inventory is public" on public.tag_options for select using(active);

create function public.utf16_length(p text) returns integer language sql immutable set search_path='' as $$
 select coalesce(sum(case when ascii(substr(p,n,1))>65535 then 2 else 1 end),0)::integer from generate_series(1,length(p)) n;
$$;
create function public.json_text_valid(p jsonb,k text,lo integer,hi integer) returns boolean language sql immutable set search_path='' as $$
 select coalesce(jsonb_typeof(p->k)='string' and public.utf16_length(p->>k) between lo and hi,false);
$$;
create function public.information_icons_for(i jsonb) returns jsonb language sql immutable set search_path='' as $$
 select coalesce(jsonb_agg(k order by ord),'[]'::jsonb) from (values
 ('phone',1,coalesce(i->>'tag_phone','') !~ '^[[:space:]]*$'),
 ('neutered',2,coalesce(i->'tagExtras'->'selected','[]'::jsonb)?'neutered' and coalesce(i->'tagExtras'->>'neutered','') in ('Spayed','Neutered')),
 ('address',3,coalesce(i->'tagExtras'->'selected','[]'::jsonb)?'address' and coalesce(i->'tagExtras'->>'address','') !~ '^[[:space:]]*$'),
 ('email',4,coalesce(i->>'tagEmail','') !~ '^[[:space:]]*$')) v(k,ord,present) where present;
$$;

create function public.validate_tag_extras(e jsonb) returns void language plpgsql immutable set search_path='' as $$
declare k text;
begin
 if e is null or e='null'::jsonb then return; end if;
 if jsonb_typeof(e)<>'object' or coalesce(jsonb_typeof(e->'selected'),'')<>'array' then raise exception 'INVALID_EXTRA_DETAILS'; end if;
 -- Type and uniqueness are checked independently to avoid accepting mixed JSON values.
 if jsonb_array_length(e->'selected')>6 or (select count(*)<>count(distinct value) from jsonb_array_elements(e->'selected')) then raise exception 'INVALID_EXTRA_CATEGORIES'; end if;
 if exists(select 1 from jsonb_array_elements(e->'selected') v where jsonb_typeof(v)<>'string' or v#>>'{}' not in ('address','health','neutered','family','phones','other')) then raise exception 'INVALID_EXTRA_CATEGORIES'; end if;
 foreach k in array array['address','health','familyName','other'] loop
  if not public.json_text_valid(e,k,0,2000) then raise exception 'INVALID_EXTRA_TEXT'; end if;
 end loop;
 if not public.json_text_valid(e,'familyPhone',0,32) or not public.json_text_valid(e,'neutered',0,20) or e->>'neutered' not in ('','Spayed','Neutered') then raise exception 'INVALID_EXTRA_DETAILS'; end if;
 if e?'phones' and not public.json_text_valid(e,'phones',0,2000) then raise exception 'INVALID_EXTRA_TEXT'; end if;
end;$$;

create function public.validate_order_item(i jsonb) returns void language plpgsql stable set search_path='' as $$
declare kind text; icons jsonb; available jsonb; a jsonb;
begin
 if i is null or jsonb_typeof(i)<>'object' then raise exception 'INVALID_ITEM'; end if;
 if not public.json_text_valid(i,'id',36,36) or i->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'INVALID_ITEM_ID'; end if;
 if not public.json_text_valid(i,'collar_type',1,30) or i->>'collar_type' not in ('plastic_buckle','metal_buckle','martingale') or not public.json_text_valid(i,'tag_type',1,20) or i->>'tag_type' not in ('hanging','anti_fall') then raise exception 'INVALID_TYPE'; end if;
 if not public.json_text_valid(i,'pet_name',1,200) or i->>'pet_name' ~ '^[[:space:]]*$' or not public.json_text_valid(i,'tag_phone',7,32) or not public.valid_phone(i->>'tag_phone') then raise exception 'INVALID_TAG'; end if;
 if not public.json_text_valid(i,'extra_text',0,2000) or not public.json_text_valid(i,'personalization_notes',0,2000) then raise exception 'INVALID_PERSONALIZATION'; end if;
 if not public.json_text_valid(i,'personalization_type',1,20) or i->>'personalization_type' not in ('none','decoration','drawing','dog_photo') then raise exception 'INVALID_PERSONALIZATION'; end if;
 kind:=i->>'personalization_type';
 if coalesce(jsonb_typeof(i->'width_cm'),'')<>'number' or coalesce(jsonb_typeof(i->'font_number'),'')<>'number' or (i->>'font_number')::numeric<>trunc((i->>'font_number')::numeric) then raise exception 'INVALID_SIZE_OR_FONT'; end if;
 if i->>'tag_type'='hanging' then
  if not public.json_text_valid(i,'tagShape',1,20) or not public.json_text_valid(i,'tagSize',1,20) or coalesce(jsonb_typeof(i->'tagWidthCm'),'')<>'number' or coalesce(jsonb_typeof(i->'tagHeightCm'),'')<>'number' then raise exception 'INVALID_TAG_SELECTION'; end if;
  if not exists(select 1 from public.tag_options where active and shape=i->>'tagShape' and size=i->>'tagSize' and width_cm=(i->>'tagWidthCm')::numeric and height_cm=(i->>'tagHeightCm')::numeric) then raise exception 'INVALID_TAG_SELECTION'; end if;
 end if;
 perform public.validate_tag_extras(i->'tagExtras');
 if i?'tagEmail' and i->'tagEmail'<>'null'::jsonb then
  if not public.json_text_valid(i,'tagEmail',0,254) or (i->>'tagEmail'<>'' and i->>'tagEmail' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'INVALID_EMAIL'; end if;
 end if;
 if i?'decorationIcon' and i->'decorationIcon'<>'null'::jsonb then
  if not public.json_text_valid(i,'decorationIcon',1,20) or i->>'decorationIcon' not in ('heart','star','paw','bone','crown') or kind<>'decoration' then raise exception 'INVALID_DECORATION'; end if;
 end if;
 icons:=coalesce(nullif(i->'informationIcons','null'::jsonb),'[]'::jsonb);
 if jsonb_typeof(icons)<>'array' then raise exception 'INVALID_INFORMATION_ICONS'; end if;
 if jsonb_array_length(icons)>4 or (select count(*)<>count(distinct value) from jsonb_array_elements(icons)) then raise exception 'INVALID_INFORMATION_ICONS'; end if;
 available:=public.information_icons_for(i);
 if exists(select 1 from jsonb_array_elements(icons) v where jsonb_typeof(v)<>'string' or v#>>'{}' not in ('phone','neutered','address','email') or not available @> jsonb_build_array(v)) then raise exception 'INVALID_INFORMATION_ICONS'; end if;
 if kind<>'decoration' and jsonb_array_length(icons)>0 then raise exception 'INVALID_INFORMATION_ICONS'; end if;
 if kind='decoration' and coalesce(i->>'decorationIcon','')='' and jsonb_array_length(available)=0 then raise exception 'INVALID_DECORATION'; end if;
 if coalesce(jsonb_typeof(i->'attachments'),'')<>'array' then raise exception 'INVALID_ATTACHMENTS'; end if;
 if jsonb_array_length(i->'attachments')>3 or (kind not in ('drawing','dog_photo') and jsonb_array_length(i->'attachments')>0) then raise exception 'INVALID_ATTACHMENTS'; end if;
 if kind in ('drawing','dog_photo') and jsonb_array_length(i->'attachments')=0 then raise exception 'ATTACHMENT_REQUIRED'; end if;
 for a in select value from jsonb_array_elements(i->'attachments') loop
  if jsonb_typeof(a)<>'object' or not public.json_text_valid(a,'id',36,36) or a->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'INVALID_ATTACHMENT'; end if;
 end loop;
end;$$;

alter function public.confirm_order(uuid,uuid,jsonb,jsonb) rename to confirm_order_transaction;
revoke all on function public.confirm_order_transaction(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
create function public.confirm_order(p_key uuid,p_draft uuid,p_customer jsonb,p_items jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); i jsonb; att jsonb; a public.attachments;
begin
 if u is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_key is null or p_draft is null or coalesce(jsonb_typeof(p_customer),'')<>'object' or coalesce(jsonb_typeof(p_items),'')<>'array' then raise exception 'INVALID_PAYLOAD'; end if;
 if octet_length(p_items::text)>200000 or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'ITEM_LIMIT'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 -- Existing retries still use the original hash check, even if inventory has since changed.
 if exists(select 1 from public.orders where owner_user_id=u and idempotency_key=p_key) then return public.confirm_order_transaction(p_key,p_draft,p_customer,p_items); end if;
 if not public.json_text_valid(p_customer,'name',1,200) or p_customer->>'name' ~ '^[[:space:]]*$' or not public.json_text_valid(p_customer,'phone',7,32) or not public.valid_phone(p_customer->>'phone') then raise exception 'INVALID_CUSTOMER'; end if;
 for i in select value from jsonb_array_elements(p_items) loop
  perform public.validate_order_item(i);
  for att in select value from jsonb_array_elements(i->'attachments') loop
   select * into a from public.attachments where id=(att->>'id')::uuid for update;
   if not found or a.owner_user_id<>u or a.draft_id<>p_draft or a.local_item_id<>(i->>'id')::uuid or a.purpose<>i->>'personalization_type' then raise exception 'INVALID_ATTACHMENT_PURPOSE'; end if;
  end loop;
 end loop;
 return public.confirm_order_transaction(p_key,p_draft,p_customer,p_items);
end;$$;
revoke all on function public.confirm_order(uuid,uuid,jsonb,jsonb) from public,anon;
grant execute on function public.confirm_order(uuid,uuid,jsonb,jsonb) to authenticated;

alter function public.begin_attachment(uuid,uuid,text,text,bigint,text) rename to begin_attachment_transaction;
revoke all on function public.begin_attachment_transaction(uuid,uuid,text,text,bigint,text) from public,anon,authenticated;
create function public.begin_attachment(p_draft uuid,p_item uuid,p_name text,p_mime text,p_size bigint,p_purpose text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_purpose is null or p_purpose not in ('drawing','dog_photo') or p_name is null or public.utf16_length(p_name) not between 1 and 255 or p_name ~ '^[[:space:]]*$' or p_mime is null or p_mime not in ('image/jpeg','image/png','image/webp') or p_size is null or p_size not between 1 and 10485760 then raise exception 'INVALID_FILE'; end if;
 return public.begin_attachment_transaction(p_draft,p_item,p_name,p_mime,p_size,p_purpose);
end;$$;
revoke all on function public.begin_attachment(uuid,uuid,text,text,bigint,text) from public,anon;
grant execute on function public.begin_attachment(uuid,uuid,text,text,bigint,text) to authenticated;
revoke all on function public.utf16_length(text),public.json_text_valid(jsonb,text,integer,integer),public.information_icons_for(jsonb),public.validate_tag_extras(jsonb),public.validate_order_item(jsonb) from public,anon,authenticated;
