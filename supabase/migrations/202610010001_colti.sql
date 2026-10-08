create extension if not exists pgcrypto with schema extensions;

create table public.production_owner (
 singleton boolean primary key default true check (singleton),
 user_id uuid not null unique references auth.users(id)
);
alter table public.production_owner enable row level security;
create function public.is_owner() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.production_owner where user_id = auth.uid());
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

create table public.sizes (code text primary key, neck_min numeric not null, neck_max numeric not null, weight_reference text not null);
create table public.size_widths (size_code text references public.sizes(code), width_cm numeric not null, primary key(size_code,width_cm));
create table public.designs (
 id uuid primary key default gen_random_uuid(), code text not null unique, type text not null check(type in ('woven','printed')),
 image_path text not null, active boolean not null default true, is_test_data boolean not null default false,
 display_order integer not null default 0, asset_version text not null default 'v1',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.design_compatibility (
 id uuid primary key default gen_random_uuid(), design_id uuid not null references public.designs(id), size_code text not null, width_cm numeric not null,
 foreign key(size_code,width_cm) references public.size_widths, unique(design_id,size_code,width_cm),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.fonts (
 number integer primary key check(number between 1 and 36), label text not null, asset_path text, css_family text,
 state text not null check(state in ('placeholder','ready')), active boolean not null default true,
 asset_version text not null default 'placeholder-v1', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(state='placeholder' or (asset_path is not null and css_family is not null))
);
create table public.customers (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id),
 name text not null check(length(name) between 1 and 200), phone text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create sequence public.order_sequence;
create table public.orders (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id),
 owner_user_id uuid not null references auth.users(id), sequence_number bigint not null unique,
 order_code text not null unique, idempotency_key uuid not null, request_hash text not null,
 status text not null default 'new' check(status in ('new','in_progress','finished')),
 customer_snapshot jsonb not null, schema_version integer not null default 1,
 confirmed_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(owner_user_id,idempotency_key)
);
create table public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id), position integer not null,
 size_code text not null, width_cm numeric not null, design_id uuid not null references public.designs(id),
 collar_type text not null check(collar_type in ('plastic_buckle','metal_buckle','martingale')),
 tag_type text not null check(tag_type in ('hanging','anti_fall')), pet_name text not null, tag_phone text not null,
 extra_text text, font_number integer not null references public.fonts(number),
 personalization_type text not null check(personalization_type in ('none','decoration','drawing','dog_photo')),
 personalization_notes text, snapshot jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(order_id,position), foreign key(size_code,width_cm) references public.size_widths
);
create table public.attachments (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id),
 draft_id uuid not null, local_item_id uuid not null, order_item_id uuid references public.order_items(id),
 bucket text not null default 'order-attachments' check(bucket='order-attachments'), object_path text not null unique,
 original_filename text not null check(length(original_filename) between 1 and 255),
 mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
 byte_size bigint not null check(byte_size between 1 and 10485760),
 purpose text not null check(purpose in ('decoration','drawing','dog_photo')),
 status text not null default 'pending' check(status in ('pending','ready','linked','rejected')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.orders(created_at desc);
create index on public.orders(owner_user_id);
create index on public.order_items(order_id);
create index on public.attachments(owner_user_id,draft_id,local_item_id);

create function public.touch_updated() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = clock_timestamp(); return new; end; $$;
do $$ declare t text; begin foreach t in array array['designs','design_compatibility','fonts','customers','orders','order_items','attachments'] loop
 execute format('create trigger touch_updated before update on public.%I for each row execute function public.touch_updated()',t);
end loop; end $$;

alter table public.sizes enable row level security;
alter table public.size_widths enable row level security;
alter table public.designs enable row level security;
alter table public.design_compatibility enable row level security;
alter table public.fonts enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.attachments enable row level security;
create policy read_sizes on public.sizes for select to anon,authenticated using(true);
create policy read_widths on public.size_widths for select to anon,authenticated using(true);
create policy active_designs on public.designs for select to anon,authenticated using(active);
create policy active_compatibility on public.design_compatibility for select to anon,authenticated using(exists(select 1 from public.designs d where d.id=design_id and d.active));
create policy active_fonts on public.fonts for select to anon,authenticated using(active);
create policy owner_customers on public.customers for select to authenticated using(public.is_owner());
create policy owner_orders on public.orders for select to authenticated using(public.is_owner());
create policy owner_items on public.order_items for select to authenticated using(public.is_owner());
create policy read_attachments on public.attachments for select to authenticated using(public.is_owner() or owner_user_id=auth.uid());
revoke all on public.production_owner,public.customers,public.orders,public.order_items,public.attachments from anon,authenticated;
grant select on public.customers,public.orders,public.order_items,public.attachments to authenticated;
grant select on public.sizes,public.size_widths,public.designs,public.design_compatibility,public.fonts to anon,authenticated;
revoke insert,update,delete on public.sizes,public.size_widths,public.designs,public.design_compatibility,public.fonts from anon,authenticated;
revoke all on sequence public.order_sequence from anon,authenticated;

-- Internal renderer. Never executable by clients; exposed only through authorized RPCs.
create function public.order_document(p_id uuid) returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('id',o.id,'order_code',o.order_code,'status',o.status,'confirmed_at',o.confirmed_at,'updated_at',o.updated_at,
 'customer_snapshot',o.customer_snapshot,'items',coalesce((select jsonb_agg(i.snapshot order by i.position) from public.order_items i where i.order_id=o.id),'[]'::jsonb))
 from public.orders o where o.id=p_id;
$$;
revoke all on function public.order_document(uuid) from public,anon,authenticated;

create function public.valid_phone(p text) returns boolean language sql immutable set search_path = '' as $$
 select p is not null and p ~ '^[+0-9().[:space:]-]{7,32}$' and length(regexp_replace(p,'[^0-9]','','g'))>=7;
$$;
revoke all on function public.valid_phone(text) from public,anon,authenticated;

create function public.find_order(p_key uuid) returns jsonb language sql stable security definer set search_path = '' as $$
 select public.order_document(id) from public.orders where owner_user_id=auth.uid() and idempotency_key=p_key;
$$;
revoke all on function public.find_order(uuid) from public,anon;
grant execute on function public.find_order(uuid) to authenticated;

create function public.confirm_order(p_key uuid,p_draft uuid,p_customer jsonb,p_items jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
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
   'extra_text',coalesce(i->>'extra_text',''),'font_number',f.number,'personalization_type',i->>'personalization_type','personalization_notes',coalesce(i->>'personalization_notes',''),
   'attachments',att_json,'design',jsonb_build_object('id',d.id,'code',d.code,'type',d.type,'image',d.image_path,'active',d.active,'is_test_data',d.is_test_data,'asset_version',d.asset_version),
   'font',jsonb_build_object('number',f.number,'label',f.label,'state',f.state,'asset_path',f.asset_path,'css_family',f.css_family,'active',f.active,'asset_version',f.asset_version,'presentation',coalesce(to_jsonb(f)->'presentation','{}'::jsonb)));
  insert into public.order_items(id,order_id,position,size_code,width_cm,design_id,collar_type,tag_type,pet_name,tag_phone,extra_text,font_number,personalization_type,personalization_notes,snapshot)
  values(item_id,o_id,pos,i->>'size_code',(i->>'width_cm')::numeric,d.id,i->>'collar_type',i->>'tag_type',btrim(i->>'pet_name'),btrim(i->>'tag_phone'),i->>'extra_text',f.number,i->>'personalization_type',i->>'personalization_notes',snapshot);
  update public.attachments set order_item_id=item_id,status='linked' where id in (select (value->>'id')::uuid from jsonb_array_elements(att_json));
 end loop;
 return public.order_document(o_id);
end; $$;
revoke all on function public.confirm_order(uuid,uuid,jsonb,jsonb) from public,anon;
grant execute on function public.confirm_order(uuid,uuid,jsonb,jsonb) to authenticated;

create function public.production_orders(p_status text default null,p_page integer default 0) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_page<0 or p_page>100000 then raise exception 'INVALID_PAGE'; end if;
 return coalesce((select jsonb_agg(public.order_document(id) order by confirmed_at desc) from
  (select id,confirmed_at from public.orders where p_status is null or status=p_status order by confirmed_at desc limit 20 offset p_page*20) o),'[]'::jsonb);
end; $$;
create function public.production_order(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if; return public.order_document(p_id); end; $$;
create function public.advance_order(p_id uuid,p_expected text,p_updated timestamptz) returns jsonb language plpgsql security definer set search_path = '' as $$
declare next_status text;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 next_status:=case p_expected when 'new' then 'in_progress' when 'in_progress' then 'finished' else null end;
 if next_status is null then raise exception 'INVALID_TRANSITION'; end if;
 update public.orders set status=next_status where id=p_id and status=p_expected and updated_at=p_updated;
 if not found then raise exception 'STATE_CONFLICT'; end if;
 return public.order_document(p_id);
end; $$;
revoke all on function public.production_orders(text,integer),public.production_order(uuid),public.advance_order(uuid,text,timestamptz) from public,anon;
grant execute on function public.production_orders(text,integer),public.production_order(uuid),public.advance_order(uuid,text,timestamptz) to authenticated;

create function public.begin_attachment(p_draft uuid,p_item uuid,p_name text,p_mime text,p_size bigint,p_purpose text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid(); a public.attachments; aid uuid:=gen_random_uuid();
begin
 if u is null then raise exception 'AUTH_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,1));
 if p_draft is null or p_item is null or coalesce(length(p_name),0) not between 1 and 255 or p_mime not in ('image/jpeg','image/png','image/webp') or p_size not between 1 and 10485760 or p_purpose not in ('decoration','drawing','dog_photo') then raise exception 'INVALID_FILE'; end if;
 if (select count(*) from public.attachments where owner_user_id=u and created_at>now()-interval '1 hour')>=30 then raise exception 'UPLOAD_RATE_LIMIT'; end if;
 if (select count(*) from public.attachments where owner_user_id=u and draft_id=p_draft and local_item_id=p_item and status in ('pending','ready','linked'))>=3 then raise exception 'FILE_LIMIT'; end if;
 insert into public.attachments(id,owner_user_id,draft_id,local_item_id,object_path,original_filename,mime_type,byte_size,purpose)
 values(aid,u,p_draft,p_item,u::text||'/'||p_draft::text||'/'||aid::text,p_name,p_mime,p_size,p_purpose) returning * into a;
 return to_jsonb(a);
end; $$;
revoke all on function public.begin_attachment(uuid,uuid,text,text,bigint,text) from public,anon;
grant execute on function public.begin_attachment(uuid,uuid,text,text,bigint,text) to authenticated;

create function public.verify_attachment(p_id uuid,p_user uuid,p_valid boolean) returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.attachments;
begin
 update public.attachments set status=case when p_valid then 'ready' else 'rejected' end where id=p_id and owner_user_id=p_user and status='pending' returning * into a;
 if not found then raise exception 'ATTACHMENT_STATE_CONFLICT'; end if;
 return to_jsonb(a);
end; $$;
revoke all on function public.verify_attachment(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.verify_attachment(uuid,uuid,boolean) to service_role;

-- Removal first rejects metadata (no new insert / no linked files can be removed).
create function public.discard_attachment(p_id uuid) returns text language plpgsql security definer set search_path = '' as $$
declare path text;
begin
 update public.attachments set status='rejected' where id=p_id and owner_user_id=auth.uid() and order_item_id is null and status in ('pending','ready','rejected') returning object_path into path;
 if path is null then raise exception 'INVALID_ATTACHMENT'; end if; return path;
end; $$;
revoke all on function public.discard_attachment(uuid) from public,anon;
grant execute on function public.discard_attachment(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('catalog-images','catalog-images',true,10485760,array['image/jpeg','image/png','image/webp']),
 ('font-assets','font-assets',true,10485760,array['font/woff2','font/woff','font/ttf','application/octet-stream']),
 ('order-attachments','order-attachments',false,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy read_catalog_objects on storage.objects for select to anon,authenticated using(bucket_id in ('catalog-images','font-assets'));
create policy upload_own_pending on storage.objects for insert to authenticated with check(
 bucket_id='order-attachments' and exists(select 1 from public.attachments a where a.object_path=name and a.owner_user_id=auth.uid() and a.status='pending' and a.created_at>now()-interval '2 hours'));
create policy read_private_objects on storage.objects for select to authenticated using(
 bucket_id='order-attachments' and exists(select 1 from public.attachments a where a.object_path=name and a.status in ('ready','linked') and (a.owner_user_id=auth.uid() or public.is_owner())));
-- No client UPDATE/DELETE on Storage. Discard/cleanup is a server operation.

create function public.claim_stale_attachment(p_id uuid,p_before timestamptz) returns text language plpgsql security definer set search_path = '' as $$
declare path text;
begin
 update public.attachments set status='rejected' where id=p_id and order_item_id is null and status in ('pending','ready','rejected') and created_at<p_before returning object_path into path;
 return path;
end; $$;
revoke all on function public.claim_stale_attachment(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.claim_stale_attachment(uuid,timestamptz) to service_role;
