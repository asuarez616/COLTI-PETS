-- Hanging tag inventory; dimensions follow the supplied height × width reference.
create table public.tag_options(shape text not null,size text not null,width_cm numeric not null,height_cm numeric not null,primary key(shape,size));
insert into public.tag_options values ('paw','small',2.5,2.5),('paw','large',3.5,3.3),('circle','small',2.5,2.5),('bone','miniature',2.3,2),('bone','medium',2.7,4),('bone','large',3,5),('crown','small',2.5,2.5),('military','medium',2.7,4),('military','large',3,5);
alter table public.tag_options enable row level security;
create policy "Tag inventory is public" on public.tag_options for select using(true);
grant select on public.tag_options to anon,authenticated;
alter table public.order_items add column tag_shape text,add column tag_size text,add column tag_width_cm numeric,add column tag_height_cm numeric;
alter table public.order_items add constraint order_item_tag_option foreign key(tag_shape,tag_size) references public.tag_options(shape,size);
create or replace function public.confirm_order(p_key uuid,p_draft uuid,p_customer jsonb,p_items jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 u uuid := auth.uid(); h text; existing public.orders; c_id uuid; o_id uuid; n bigint;
 i jsonb; d public.designs; f public.fonts; a public.attachments; item_id uuid; att_id uuid;
 pos integer:=0; att_json jsonb; snapshot jsonb; ids uuid[] := '{}';
begin
 if u is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_key is null or p_draft is null or p_customer is null or p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'INVALID_PAYLOAD'; end if;
 if octet_length(p_items::text)>200000 or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'ITEM_LIMIT'; end if;
 h:=encode(extensions.digest(jsonb_build_object('draft',p_draft,'customer',p_customer,'items',p_items)::text,'sha256'),'hex');
 -- Serialize one user's confirmation to enforce rate limits and retry races.
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select * into existing from public.orders where owner_user_id=u and idempotency_key=p_key;
 if found then
  if existing.request_hash<>h then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return public.order_document(existing.id);
 end if;
 if (select count(*) from public.orders where owner_user_id=u and created_at>now()-interval '1 hour')>=10 then raise exception 'RATE_LIMIT'; end if;
 if coalesce(length(btrim(p_customer->>'name')),0) not between 1 and 200 or not public.valid_phone(p_customer->>'phone') then raise exception 'INVALID_CUSTOMER'; end if;
 insert into public.customers(owner_user_id,name,phone) values(u,btrim(p_customer->>'name'),btrim(p_customer->>'phone')) returning id into c_id;
 n:=nextval('public.order_sequence');
 insert into public.orders(customer_id,owner_user_id,sequence_number,order_code,idempotency_key,request_hash,customer_snapshot)
 values(c_id,u,n,'COLTI-US-'||case when n<10000 then lpad(n::text,4,'0') else n::text end,p_key,h,jsonb_build_object('name',btrim(p_customer->>'name'),'phone',btrim(p_customer->>'phone'))) returning id into o_id;
 for i in select value from jsonb_array_elements(p_items) loop
  pos:=pos+1; item_id:=gen_random_uuid(); att_json:='[]'::jsonb;
  if (i->>'id')::uuid=any(ids) then raise exception 'DUPLICATE_ITEM'; end if; ids:=array_append(ids,(i->>'id')::uuid);
  if not exists(select 1 from public.size_widths where size_code=i->>'size_code' and width_cm=(i->>'width_cm')::numeric) then raise exception 'INVALID_SIZE item %',pos; end if;
  select * into d from public.designs where id=(i->>'design_id')::uuid and active;
  if not found or not exists(select 1 from public.design_compatibility where design_id=d.id and size_code=i->>'size_code' and width_cm=(i->>'width_cm')::numeric) then raise exception 'DESIGN_CHANGED item %',pos; end if;
  select * into f from public.fonts where number=(i->>'font_number')::integer and active;
  if not found then raise exception 'FONT_CHANGED item %',pos; end if;
  if coalesce(i->>'collar_type','') not in ('plastic_buckle','metal_buckle','martingale') or coalesce(i->>'tag_type','') not in ('hanging','anti_fall') then raise exception 'INVALID_TYPE item %',pos; end if;
  if i->>'tag_type'='hanging' and not exists(select 1 from public.tag_options where shape=i->>'tagShape' and size=i->>'tagSize' and width_cm=(i->>'tagWidthCm')::numeric and height_cm=(i->>'tagHeightCm')::numeric) then raise exception 'INVALID_TAG_SELECTION item %',pos; end if;
  if i->>'tag_type'='anti_fall' then i:=i-'tagShape'-'tagSize'-'tagWidthCm'-'tagHeightCm'; end if;
  if coalesce(length(btrim(i->>'pet_name')),0) not between 1 and 200 or not public.valid_phone(i->>'tag_phone') then raise exception 'INVALID_TAG item %',pos; end if;
  if coalesce(i->>'personalization_type','') not in ('none','decoration','drawing','dog_photo') or coalesce(length(i->>'extra_text'),0)>2000 or coalesce(length(i->>'personalization_notes'),0)>2000 then raise exception 'INVALID_PERSONALIZATION item %',pos; end if;
  if i->'attachments' is null or jsonb_typeof(i->'attachments')<>'array' or jsonb_array_length(i->'attachments')>3 then raise exception 'INVALID_ATTACHMENTS item %',pos; end if;
  if i->>'personalization_type' in ('drawing','dog_photo') and jsonb_array_length(i->'attachments')=0 then raise exception 'ATTACHMENT_REQUIRED item %',pos; end if;
  for att_id in select (value->>'id')::uuid from jsonb_array_elements(i->'attachments') loop
   select * into a from public.attachments where id=att_id for update;
   if not found or a.owner_user_id<>u or a.draft_id<>p_draft or a.local_item_id<>(i->>'id')::uuid or a.status<>'ready' or a.order_item_id is not null then raise exception 'INVALID_ATTACHMENT item %',pos; end if;
   if exists(select 1 from jsonb_array_elements(att_json) j where j->>'id'=att_id::text) then raise exception 'DUPLICATE_ATTACHMENT'; end if;
   att_json:=att_json||jsonb_build_array(jsonb_build_object('id',a.id,'original_filename',a.original_filename,'mime_type',a.mime_type,'byte_size',a.byte_size,'object_path',a.object_path,'purpose',a.purpose,'status','linked'));
  end loop;
  snapshot:=jsonb_build_object('id',item_id,'size_code',i->>'size_code','width_cm',(i->>'width_cm')::numeric,'design_id',d.id,
   'collar_type',i->>'collar_type','tag_type',i->>'tag_type','pet_name',btrim(i->>'pet_name'),'tag_phone',btrim(i->>'tag_phone'),
   'tagShape',i->>'tagShape','tagSize',i->>'tagSize','tagWidthCm',(i->>'tagWidthCm')::numeric,'tagHeightCm',(i->>'tagHeightCm')::numeric,'extra_text',coalesce(i->>'extra_text',''),'font_number',f.number,'personalization_type',i->>'personalization_type','personalization_notes',coalesce(i->>'personalization_notes',''),
   'attachments',att_json,'design',jsonb_build_object('id',d.id,'code',d.code,'type',d.type,'image',d.image_path,'active',d.active,'is_test_data',d.is_test_data,'asset_version',d.asset_version),
   'font',jsonb_build_object('number',f.number,'label',f.label,'state',f.state,'asset_path',f.asset_path,'css_family',f.css_family,'active',f.active,'asset_version',f.asset_version,'presentation',coalesce(to_jsonb(f)->'presentation','{}'::jsonb)));
  insert into public.order_items(id,order_id,position,size_code,width_cm,design_id,collar_type,tag_type,pet_name,tag_phone,extra_text,font_number,personalization_type,personalization_notes,tag_shape,tag_size,tag_width_cm,tag_height_cm,snapshot)
  values(item_id,o_id,pos,i->>'size_code',(i->>'width_cm')::numeric,d.id,i->>'collar_type',i->>'tag_type',btrim(i->>'pet_name'),btrim(i->>'tag_phone'),i->>'extra_text',f.number,i->>'personalization_type',i->>'personalization_notes',i->>'tagShape',i->>'tagSize',(i->>'tagWidthCm')::numeric,(i->>'tagHeightCm')::numeric,snapshot);
  update public.attachments set order_item_id=item_id,status='linked' where id in (select (value->>'id')::uuid from jsonb_array_elements(att_json));
 end loop;
 return public.order_document(o_id);
end; $$;

